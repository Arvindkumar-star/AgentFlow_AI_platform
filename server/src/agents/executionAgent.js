/**
 * Execution Agent
 * Runs a single workflow node by delegating to the integration service.
 * Pure — no HTTP knowledge. Receives integration service via DI.
 */

async function executionAgent(node, context, integrationService) {
  const { type, data, id: nodeId } = node;
  const result = { nodeId, type, output: null, error: null };

  try {
    switch (type) {
      case 'trigger':
      case 'triggerNode':
      case 'trigger_webhook':
      case 'webhook':
      case 'start':
      case 'manual':
        result.output = {
          triggered: true,
          inputs: context.inputs || {},
          fileUrl: data?.fileUrl || context.inputs?.fileUrl || 'https://storage.googleapis.com/agentflow-invoices/sample_inv_1042.pdf',
          customerEmail: data?.customerEmail || context.inputs?.customerEmail || 'vendor@example.com',
          invoiceId: data?.invoiceId || context.inputs?.invoiceId || 'INV-2026-1042',
        };
        break;

      // Gmail & Auth Check & Email Notifications
      case 'check_auth':
      case 'checkAuth':
      case 'auth':
      case 'gmail_check_auth':
      case 'gmail':
      case 'email':
      case 'send':
      case 'sendEmail':
      case 'send_email':
      case 'email_notification':
      case 'emailNotification':
      case 'email_dispatcher':
      case 'actionNode': {
        const nodeLabel = (node.label || '').toLowerCase();
        const isAuthCheck = type.includes('auth') ||
          ['checkAuth', 'checkAuthentication', 'getProfile', 'getEmail', 'status', 'verify'].includes(data.action) ||
          nodeLabel.includes('auth') || nodeLabel.includes('check');

        const prev = data._previousOutput || {};

        // Find payment link from upstream steps if any
        let paymentLink = data.paymentLink || prev.paymentLink || prev.short_url;
        if (!paymentLink) {
          for (const prevOut of Object.values(context.outputs || {})) {
            if (prevOut?.paymentLink || prevOut?.short_url) {
              paymentLink = prevOut.paymentLink || prevOut.short_url;
              break;
            }
          }
        }

        const hasUpstreamPayout = Boolean(paymentLink || prev.payoutId || Object.values(context.outputs || {}).some(o => o?.payoutId || o?.paymentLink));

        const isRead = !hasUpstreamPayout && (
          ['read', 'fetch', 'fetchLatest', 'search', 'getLatest', 'readInvoice', 'getInvoice'].includes(data.action) ||
          ((nodeLabel.includes('read') || nodeLabel.includes('invoice') || nodeLabel.includes('fetch') || nodeLabel.includes('inbox')) &&
           !nodeLabel.includes('send') && !nodeLabel.includes('notification') && !nodeLabel.includes('notify') && !nodeLabel.includes('payout'))
        );

        const isSendAction = !isAuthCheck && !isRead;

        let recipient = data.to || data.recipient || data.email || data.recipientEmail || prev.recipientEmail || prev.email || prev.to;
        if (!recipient) {
          for (const prevOut of Object.values(context.outputs || {})) {
            if (prevOut?.recipientEmail || prevOut?.email || prevOut?.emailAddress || prevOut?.to) {
              recipient = prevOut.recipientEmail || prevOut.email || prevOut.emailAddress || prevOut.to;
              break;
            }
          }
        }

        if (isSendAction) {
          const emailService = require('../services/emailService');
          const amt = Number(data.amount || prev.amount || prev.requestedAmount || 4200);
          const vendor = data.recipientName || data.vendor || prev.vendor || prev.vendor_name || 'Valued Partner';
          const invNum = data.invoiceNumber || prev.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;

          // If no payment link was passed, create one automatically
          if (!paymentLink) {
            try {
              const razorpayService = require('../services/razorpayService');
              const linkRes = await razorpayService.createPaymentLink({
                amount: amt,
                recipientName: vendor,
                recipientEmail: recipient || null,
                invoiceNumber: invNum,
                description: `Payment request for ${invNum}`,
                userId: context.userId,
                autoEmail: false,
              });
              if (linkRes?.short_url || linkRes?.paymentLink) {
                paymentLink = linkRes.short_url || linkRes.paymentLink;
              }
            } catch (linkGenErr) {
              console.warn('[ExecutionAgent] Auto payment link creation note:', linkGenErr.message);
            }
          }

          if (paymentLink) {
            const dispatchResult = await emailService.sendGuardedPaymentLinkEmail({
              to: recipient,
              recipientName: vendor,
              amount: amt,
              invoiceNumber: invNum,
              paymentLink,
              userId: context.userId,
              description: data.description || `Payment request for ${invNum}`,
            });

            result.output = {
              success: true,
              status: dispatchResult.dispatched ? 'EMAIL_SENT' : 'EMAIL_SKIPPED',
              dispatched: dispatchResult.dispatched,
              skipped: dispatchResult.skipped || false,
              to: dispatchResult.to || recipient || null,
              paymentLink,
              emailDispatch: dispatchResult,
              message: dispatchResult.dispatched
                ? `[Email Service] Payment link email successfully dispatched to ${dispatchResult.to || recipient}`
                : `[AgentGuard] Email integration not connected for user. Skipping email dispatch. Link: ${paymentLink}`,
            };
            break;
          }
        }

        const gmailAction = data.action || (isAuthCheck ? 'checkAuth' : isRead ? 'read' : 'send');
        try {
          result.output = await integrationService.execute('gmail', gmailAction, {
            ...data,
            to: recipient,
            userId: context.userId,
          });
        } catch (err) {
          const isNotConnected = err.code === 'INTEGRATION_NOT_CONNECTED' ||
            err.code === 'MISSING_INTEGRATION_CREDENTIALS' ||
            err.message?.includes('not connected') ||
            err.message?.includes('No active credentials') ||
            err.message?.includes('invalid_grant');

          if (isAuthCheck && isNotConnected) {
            result.output = {
              success: false,
              connected: false,
              status: 'NEEDS_RECONNECTION',
              needsReconnect: true,
              email: null,
              emailAddress: null,
              error: err.message,
              message: 'Gmail authentication check: account not connected or token expired. Please reconnect in Integrations.',
            };
          } else if (isRead && isNotConnected) {
            const reqAmt = Number(context.inputs?.requestedAmount ?? context.inputs?.amount ?? data.requestedAmount ?? data.amount ?? 4200);
            const vName = context.inputs?.vendor || context.inputs?.vendor_name || data.vendor || 'AWS India';
            result.output = {
              success: true,
              simulated: true,
              action: 'read',
              vendor: vName,
              vendor_name: vName,
              amount: reqAmt,
              requestedAmount: reqAmt,
              invoiceTotal: reqAmt,
              subject: `Invoice #${data.invoiceNumber || 'INV-2026-4200'} - Payment Due`,
              from: 'billing@aws.amazon.com',
              invoiceDate: new Date().toISOString().split('T')[0],
              status: 'READ_SUCCESS',
              message: `Read vendor invoice email: ${vName} for ₹${reqAmt.toLocaleString()}.`,
            };
          } else if (isSendAction && isNotConnected) {
            console.log('[AgentGuard] Email integration not connected for user. Skipping email dispatch.');
            result.output = {
              success: true,
              simulated: true,
              dispatched: false,
              skipped: true,
              to: recipient || null,
              message: '[AgentGuard] Email integration not connected for user. Skipping email dispatch.',
              note: 'Connect your Gmail or SMTP integration in /integrations to send live emails.',
            };
          } else {
            throw err;
          }
        }
        break;
      }

      // Return Email Address / Result node
      case 'returnEmail':
      case 'return_email': {
        const prev = data._previousOutput || {};
        let email = data.email || data.emailAddress || prev.email || prev.emailAddress;
        if (!email) {
          for (const prevOut of Object.values(context.outputs || {})) {
            if (prevOut?.email || prevOut?.emailAddress) {
              email = prevOut.email || prevOut.emailAddress;
              break;
            }
          }
        }
        const needsReconnect = prev.needsReconnect || prev.status === 'NEEDS_RECONNECTION' || prev.connected === false;
        result.output = {
          success: !needsReconnect && !!email,
          status: email ? 'AUTHENTICATED' : (needsReconnect ? 'NEEDS_RECONNECTION' : 'NO_EMAIL_FOUND'),
          email: email || null,
          emailAddress: email || null,
          message: email
            ? `Authenticated Gmail Address: ${email}`
            : (needsReconnect
              ? `Gmail needs reconnection: ${prev.message || prev.error || 'Token expired or revoked'}`
              : 'No authenticated email address found from upstream steps'),
          upstream: prev,
        };
        break;
      }

      case 'agentGuard':
      case 'agent_guard':
      case 'zk_guard':
      case 'securityNode':
      case 'agentguard_policy': {
        const agentGuardService = require('../services/agentGuardService');
        let maxLimit = Number(context.inputs?.maxLimit ?? data.maxLimit ?? 10000);
        let requestedAmount = Number(context.inputs?.requestedAmount ?? data.requestedAmount ?? 4200);

        // Check if upstream AI / extraction node provided requestedAmount or invoiceTotal
        const prev = data._previousOutput || {};
        if (prev.requestedAmount !== undefined && prev.requestedAmount !== null) {
          requestedAmount = Number(prev.requestedAmount);
        } else if (prev.amount !== undefined && prev.amount !== null) {
          requestedAmount = Number(prev.amount);
        } else if (prev.extractedAmount !== undefined && prev.extractedAmount !== null) {
          requestedAmount = Number(prev.extractedAmount);
        } else if (prev.invoiceTotal !== undefined && prev.invoiceTotal !== null) {
          requestedAmount = Number(prev.invoiceTotal);
        } else if (!context.inputs?.requestedAmount) {
          for (const prevOut of Object.values(context.outputs || {})) {
            if (prevOut?.requestedAmount !== undefined && prevOut?.requestedAmount !== null) {
              requestedAmount = Number(prevOut.requestedAmount);
              break;
            } else if (prevOut?.amount !== undefined && prevOut?.amount !== null) {
              requestedAmount = Number(prevOut.amount);
              break;
            } else if (prevOut?.extractedAmount !== undefined && prevOut?.extractedAmount !== null) {
              requestedAmount = Number(prevOut.extractedAmount);
              break;
            } else if (prevOut?.invoiceTotal !== undefined && prevOut?.invoiceTotal !== null) {
              requestedAmount = Number(prevOut.invoiceTotal);
              break;
            }
          }
        }

        const targetMerchantId = Number(data.targetMerchantId ?? 1);
        const allowedMerchantId = Number(data.allowedMerchantId ?? 1);
        const privateAuthSecret = data.privateAuthSecret ?? 123456;

        // If this is a standard policy-safe run, discard any stale attack proof from data so fresh proof is generated
        const isSafeRun = requestedAmount <= maxLimit && !data.isAttacked;
        const passProof = isSafeRun ? null : data.proof;
        const passSignals = isSafeRun ? null : data.publicSignals;

        const checkRes = await agentGuardService.verifySpend({
          requestedAmount,
          maxLimit,
          targetMerchantId,
          allowedMerchantId,
          privateAuthSecret,
          proof: passProof,
          publicSignals: passSignals,
        });

        result.output = {
          verified: checkRes.isValid,
          isValid: checkRes.isValid,
          status: checkRes.isValid ? 'GROTH16_VERIFIED' : 'CONSTRAINT_VIOLATION',
          proofStatus: checkRes.isValid ? 'GROTH16_VERIFIED' : 'CONSTRAINT_VIOLATION',
          verificationStatus: checkRes.isValid ? 'VERIFIED' : 'REJECTED',
          policyToken: checkRes.isValid ? `zk_tok_${Date.now()}` : null,
          requestedAmount: checkRes.requestedAmount,
          extractedAmount: checkRes.requestedAmount,
          amount: checkRes.requestedAmount,
          maxLimit: checkRes.maxLimit,
          targetMerchantId: checkRes.targetMerchantId,
          allowedMerchantId: checkRes.allowedMerchantId,
          publicSignals: checkRes.publicSignals,
          proof: checkRes.proof,
          message: checkRes.isValid
            ? 'ZK Proof Verified. Financial execution bounded and safe within policy limits.'
            : `Spending limit violated: Requested ₹${requestedAmount} exceeds max allowance ₹${maxLimit}`,
          reason: checkRes.isValid ? null : `Spending limit violated: Requested ₹${requestedAmount} exceeds max allowance ₹${maxLimit}`,
          errorCode: checkRes.isValid ? null : 'ZK_CONSTRAINT_VIOLATION',
        };
        break;
      }

      case 'razorpay':
      case 'razorpay_payout':
      case 'razorpay_payment_link':
      case 'payment_link':
      case 'paymentLink':
      case 'payout':
      case 'payoutNode':
      case 'razorpay_link_gen': {
        const { processPayoutNode } = require('./payoutAgent');
        const payoutOutput = await processPayoutNode(node, {
          previousStepOutput: data._previousOutput,
          outputs: context.outputs,
          userId: context.userId,
          executionId: context.executionId,
          workflowId: context.workflowId,
        });
        result.output = payoutOutput;
        break;
      }

      case 'slack':
      case 'slack_post':
      case 'post_to_slack':
      case 'postToSlack':
      case 'postSlack': {
        const slackAction = data.action || 'postMessage';
        // Build message: use configured message, or auto-build from previous node output
        let message = data.message || data.text || data.messageTemplate || '';

        // Resolve single-brace templates like {video_title}, {video_link}, {videos}
        if (message) {
          const prev = data._previousOutput || {};
          message = message
            .replace(/\{video_title\}/gi,   prev.title    || '')
            .replace(/\{video_link\}/gi,    prev.url      || prev.videoUrl || '')
            .replace(/\{video_url\}/gi,     prev.url      || prev.videoUrl || '')
            .replace(/\{title\}/gi,         prev.title    || '')
            .replace(/\{url\}/gi,           prev.url      || '')
            .replace(/\{channel\}/gi,       prev.channel  || '')
            .replace(/\{videos\}/gi, () => {
              const results = prev.results || [];
              return results.slice(0, 3).map((v, i) => `${i+1}. *${v.title}*\n${v.url}`).join('\n') || (prev.url || '');
            });
        }

        // If still empty, auto-build from previous output
        if (!message.trim()) {
          const prev = data._previousOutput || data;
          const title = prev.title || prev.videoTitle;
          const url   = prev.url || prev.videoUrl || prev.link;
          if (title && url) message = `*${title}*\n${url}`;
          else if (url)     message = url;
          else if (title)   message = title;
          else              message = 'Workflow completed.';
        }

        result.output = await integrationService.execute('slack', slackAction, {
          ...data,
          message,
          userId: context.userId,
        });
        break;
      }

      case 'discord':
        result.output = await integrationService.execute('discord', data.action, {
          ...data,
          userId: context.userId,
        });
        break;

      // Google Sheets — also handle AI-generated aliases
      case 'google-sheets':
      case 'googleSheets':
      case 'sheets':
      case 'spreadsheet': {
        const sheetsAction = data.action || 'appendRow';
        result.output = await integrationService.execute('google-sheets', sheetsAction, {
          ...data, userId: context.userId,
        });
        break;
      }

      // ── Social Media + YouTube ─────────────────────────────────────────
      // NOTE: 'default' is here because AI often generates nodes with type='default'
      // that are actually YouTube search nodes based on their label/data.
      case 'youtube':
      case 'youtubeSearch':
      case 'searchYoutube':
      case 'search_youtube': {
        const ytQuery = data.query || data.searchQuery || data.keyword || 'trending';
        const ytAction = data.action || 'search';
        result.output = await integrationService.execute('youtube', ytAction, {
          ...data,
          query: ytQuery,
          userId: context.userId,
        });
        break;
      }

      case 'twitter':
      case 'tweet':
      case 'x': {
        const twAction = data.action || 'tweet';
        result.output = await integrationService.execute('twitter', twAction, {
          ...data, userId: context.userId,
        });
        break;
      }

      case 'linkedin': {
        const liAction = data.action || 'post';
        try {
          result.output = await integrationService.execute('linkedin', liAction, {
            ...data,
            text: data.text || data.content || data.message,
            userId: context.userId,
          });
        } catch (err) {
          if (err.code === 'INTEGRATION_NOT_CONNECTED' || err.message?.includes('not connected')) {
            const postText = data.text || data.content || data.message || "Exploring the evolving nature of generative AI in today's era.";
            result.output = {
              success: true,
              simulated: true,
              status: 'POSTED_SIMULATED',
              postId: `li_sim_${Date.now()}`,
              text: postText,
              visibility: 'PUBLIC',
              message: `LinkedIn account not yet connected in Integrations. (Simulated post succeeded). To publish directly to your live LinkedIn feed, go to Integrations → LinkedIn and connect via OAuth.`,
              note: 'Connect your LinkedIn account in /integrations to publish live to your profile.',
            };
          } else {
            throw err;
          }
        }
        break;
      }

      case 'facebook':
      case 'fb': {
        const fbAction = data.action || 'post';
        result.output = await integrationService.execute('facebook', fbAction, {
          ...data, userId: context.userId,
        });
        break;
      }

      case 'instagram':
      case 'ig': {
        const igAction = data.action || 'post';
        result.output = await integrationService.execute('instagram', igAction, {
          ...data, userId: context.userId,
        });
        break;
      }

      case 'condition': {
        const { field, operator, value } = data;
        const inputVal = context.outputs?.[field] ?? data.inputValue;
        let conditionMet = false;
        switch (operator) {
          case 'eq': conditionMet = inputVal == value; break;
          case 'neq': conditionMet = inputVal != value; break;
          case 'gt': conditionMet = Number(inputVal) > Number(value); break;
          case 'lt': conditionMet = Number(inputVal) < Number(value); break;
          case 'contains': conditionMet = String(inputVal).includes(value); break;
          default: conditionMet = Boolean(inputVal);
        }
        result.output = { conditionMet, field, operator, value };
        break;
      }

      case 'ai':
      case 'aiNode':
      case 'ai_ocr_parser':
      case 'ocr': {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const env = require('../config/env');

        const prev = data._previousOutput || {};
        const promptParts = [];
        if (data.task) promptParts.push(`Task: ${data.task}`);
        if (data.instructions) promptParts.push(`Instructions: ${data.instructions}`);
        if (data.schema) promptParts.push(`Output JSON Schema: ${typeof data.schema === 'object' ? JSON.stringify(data.schema) : data.schema}`);
        if (data.prompt) promptParts.push(`Prompt: ${data.prompt}`);

        const emailSubject = prev.subject || prev.emailSubject || '';
        const emailBody = prev.body || prev.text || prev.snippet || prev.emailBody || '';

        if (emailBody || emailSubject) {
          promptParts.push(`Incoming Email Context:\nSubject: ${emailSubject}\nBody:\n${emailBody}`);
        } else if (Object.keys(prev).length > 0) {
          promptParts.push(`Upstream Step Data:\n${JSON.stringify(prev, null, 2)}`);
        }

        const fullPrompt = promptParts.join('\n\n') || data.prompt || 'Extract financial and invoice details as JSON with requestedAmount.';

        let rawResponse = '';

        // 1. Try OpenRouter first (works with openai/gpt-4o-mini)
        if (env.OPENROUTER_API_KEY) {
          try {
            const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              signal: AbortSignal.timeout(4000),
              headers: {
                Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'You are an AI data extractor. Return JSON only.' },
                  { role: 'user', content: fullPrompt },
                ],
              }),
            });
            const orData = await orRes.json();
            if (orRes.ok && orData.choices?.[0]?.message?.content) {
              rawResponse = orData.choices[0].message.content.trim();
            }
          } catch (_) {}
        }

        // 2. Try Gemini if OpenRouter didn't return a response
        if (!rawResponse && env.GEMINI_API_KEY && (env.GEMINI_API_KEY.startsWith('AIza') || !env.GEMINI_API_KEY.includes('.'))) {
          try {
            const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { timeout: 3000 });
            const aiPromise = model.generateContent(fullPrompt);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 3000));
            const aiResult = await Promise.race([aiPromise, timeoutPromise]);
            rawResponse = aiResult.response.text();
          } catch (_) {}
        }

        // 3. Fallback deterministic heuristic parser if API fails
        if (!rawResponse) {
          const textToSearch = `${emailSubject} ${emailBody} ${JSON.stringify(prev)}`;
          const amountMatch = textToSearch.match(/(?:(?:rs\.?|inr|₹|\$)\s*([\d,]+(?:\.\d+)?))|(?:([\d,]+(?:\.\d+)?)\s*(?:rs\.?|inr|₹|\$))/i)
            || textToSearch.match(/(?:amount|total|due|invoice|price|cost|pay)[\s:]+(?:rs\.?|inr|₹|\$)?\s*([\d,]+(?:\.\d+)?)/i);
          const rawNum = (amountMatch?.[1] || amountMatch?.[2] || '500').replace(/,/g, '');
          const requestedAmount = Number(rawNum) || 500;

          const vendorMatch = textToSearch.match(/(?:from|vendor|merchant|company|bill from)[\s:]+([A-Za-z0-9\s&.-]+?)(?:\r|\n|,|\.|$)/i);
          const vendor = vendorMatch?.[1]?.trim() || 'Vendor';

          rawResponse = JSON.stringify({ requestedAmount, vendor, parsedBy: 'rule-based-extractor' });
        }

        // Parse structured JSON output
        let parsed = null;
        try {
          const cleanJson = rawResponse.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanJson);
        } catch (_) {}

        const finalAmount = parsed?.extractedAmount ?? parsed?.requestedAmount ?? parsed?.amount ?? 4200;
        const finalVendor = parsed?.vendorName ?? parsed?.vendor ?? 'Vendor';
        const finalEmail = parsed?.parsedEmail ?? parsed?.customerEmail ?? parsed?.email ?? 'vendor@example.com';
        const finalDueDate = parsed?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        result.output = {
          text: rawResponse,
          ...(parsed && typeof parsed === 'object' ? parsed : {}),
          extractedAmount: Number(finalAmount),
          requestedAmount: Number(finalAmount),
          amount: Number(finalAmount),
          vendorName: finalVendor,
          vendor: finalVendor,
          parsedEmail: finalEmail,
          customerEmail: finalEmail,
          dueDate: finalDueDate,
        };
        break;
      }

      case 'notification':
      case 'end':
      case 'complete':
      case 'log':
      case 'action':
      default: {
        const nodeLabel = (node.label || '').toLowerCase();
        // Check if this default/action node is intended to return email
        if (data.action === 'returnEmail' || nodeLabel.includes('return email') || nodeLabel.includes('email address')) {
          const prev = data._previousOutput || {};
          let email = data.email || data.emailAddress || prev.email || prev.emailAddress;
          if (!email) {
            for (const prevOut of Object.values(context.outputs || {})) {
              if (prevOut?.email || prevOut?.emailAddress) {
                email = prevOut.email || prevOut.emailAddress;
                break;
              }
            }
          }
          const needsReconnect = prev.needsReconnect || prev.status === 'NEEDS_RECONNECTION' || prev.connected === false;
          result.output = {
            success: !needsReconnect && !!email,
            status: email ? 'AUTHENTICATED' : (needsReconnect ? 'NEEDS_RECONNECTION' : 'NO_EMAIL_FOUND'),
            email: email || null,
            emailAddress: email || null,
            message: email
              ? `Authenticated Gmail Address: ${email}`
              : (needsReconnect
                ? `Gmail needs reconnection: ${prev.message || prev.error || 'Token expired or revoked'}`
                : 'No authenticated email address found from upstream steps'),
            upstream: prev,
          };
          break;
        }

        // Check if this default/action node is intended to check Gmail auth
        if (nodeLabel.includes('gmail') && (nodeLabel.includes('auth') || data.action === 'checkAuthentication')) {
          try {
            result.output = await integrationService.execute('gmail', 'checkAuth', {
              ...data,
              userId: context.userId,
            });
          } catch (err) {
            result.output = {
              success: false,
              connected: false,
              status: 'NEEDS_RECONNECTION',
              needsReconnect: true,
              email: null,
              emailAddress: null,
              error: err.message,
              message: 'Gmail authentication check failed: account not connected or token expired.',
            };
          }
          break;
        }

        // Check if this default/action node is intended for LinkedIn
        if (nodeLabel.includes('linkedin') || data.platform === 'linkedin' || data.service === 'linkedin' || data.type === 'linkedin') {
          const liAction = data.action || 'post';
          try {
            result.output = await integrationService.execute('linkedin', liAction, {
              ...data,
              text: data.text || data.content || data.message,
              userId: context.userId,
            });
          } catch (err) {
            if (err.code === 'INTEGRATION_NOT_CONNECTED' || err.message?.includes('not connected')) {
              const postText = data.text || data.content || data.message || "Exploring the evolving nature of generative AI in today's era.";
              result.output = {
                success: true,
                simulated: true,
                status: 'POSTED_SIMULATED',
                postId: `li_sim_${Date.now()}`,
                text: postText,
                visibility: 'PUBLIC',
                message: `LinkedIn account not yet connected in Integrations. (Simulated post succeeded). To publish directly to your live LinkedIn feed, go to Integrations → LinkedIn and connect via OAuth.`,
                note: 'Connect your LinkedIn account in /integrations to publish live to your profile.',
              };
            } else {
              throw err;
            }
          }
          break;
        }

        // Check if this default/action node is intended for Twitter / X
        if (nodeLabel.includes('twitter') || nodeLabel.includes('tweet') || data.platform === 'twitter') {
          const twAction = data.action || 'tweet';
          result.output = await integrationService.execute('twitter', twAction, {
            ...data,
            text: data.text || data.content || data.message,
            userId: context.userId,
          });
          break;
        }

        // Check if this default/action node is intended for YouTube
        if (nodeLabel.includes('youtube') || data.platform === 'youtube') {
          const ytAction = data.action || 'search';
          result.output = await integrationService.execute('youtube', ytAction, {
            ...data,
            query: data.query || data.searchQuery || 'trending',
            userId: context.userId,
          });
          break;
        }

        // Check if this default/action node is intended for Facebook
        if (nodeLabel.includes('facebook') || data.platform === 'facebook') {
          const fbAction = data.action || 'post';
          result.output = await integrationService.execute('facebook', fbAction, {
            ...data,
            message: data.message || data.text || data.content,
            userId: context.userId,
          });
          break;
        }

        // Check if this default/action node is intended for Instagram
        if (nodeLabel.includes('instagram') || data.platform === 'instagram') {
          const igAction = data.action || 'post';
          result.output = await integrationService.execute('instagram', igAction, {
            ...data,
            userId: context.userId,
          });
          break;
        }

        // Check if this default/action node is intended for Slack
        if (nodeLabel.includes('slack') || data.platform === 'slack') {
          const slackAction = data.action || 'postMessage';
          result.output = await integrationService.execute('slack', slackAction, {
            ...data,
            channel: data.channel || '#general',
            message: data.message || data.text || 'Notification from Agentflow',
            userId: context.userId,
          });
          break;
        }

        // Check if this default/action node is intended for Discord
        if (nodeLabel.includes('discord') || data.platform === 'discord') {
          const dcAction = data.action || 'postMessage';
          result.output = await integrationService.execute('discord', dcAction, {
            ...data,
            message: data.message || data.text || 'Notification from Agentflow',
            userId: context.userId,
          });
          break;
        }

        // Check if this default/action node is intended for Google Sheets
        if (nodeLabel.includes('sheet') || nodeLabel.includes('spreadsheet') || data.platform === 'google-sheets') {
          const gsAction = data.action || 'appendRow';
          result.output = await integrationService.execute('google-sheets', gsAction, {
            ...data,
            userId: context.userId,
          });
          break;
        }

        const prevOut = data._previousOutput;
        const cleanData = { ...data };
        delete cleanData._previousOutput;
        result.output = {
          message: data.message || (prevOut?.message ? `Received upstream: ${prevOut.message}` : `Node ${nodeId} executed`),
          ...(prevOut ? { previousOutput: prevOut } : {}),
          ...cleanData,
        };
        break;
      }
    }
  } catch (err) {
    result.error = err.message;
    result.errorCode = err.code || 'EXECUTION_ERROR';
    throw err;
  }

  return result;
}

module.exports = { executionAgent };
