const env = require('../config/env');

function getMeaningfulLabel(node, type, prompt) {
  const current = (node?.label || node?.data?.label || node?.data?.name || '').trim();
  if (current && !/^(step|node|task|action|item)(\s*\d+)?$/i.test(current)) {
    return current;
  }
  const defaultLabels = {
    trigger: 'Start Workflow',
    manual: 'Manual Trigger',
    start: 'Start Workflow',
    linkedin: 'Post to LinkedIn',
    twitter: 'Post Tweet to Twitter',
    youtube: 'Search YouTube',
    facebook: 'Post to Facebook',
    instagram: 'Post to Instagram',
    gmail: (node?.data?.action === 'read' || (prompt && prompt.toLowerCase().includes('read'))) ? 'Read Invoice Emails' : 'Send Email via Gmail',
    slack: 'Send Slack Message',
    discord: 'Send Discord Message',
    'google-sheets': 'Append Row to Sheet',
    agentGuard: 'AgentGuard ZK Guard',
    razorpay: 'Razorpay Vendor Payout',
    ai: 'AI Content Generator',
    condition: 'Check Condition',
    notification: 'Send Notification',
    log: 'Log Event',
    action: 'Execute Action',
  };
  return defaultLabels[type] || 'Process Action';
}

// ─── Sanitizer to ensure AgentGuard and Razorpay nodes use precise types ─────────
function sanitizeWorkflow(workflow, prompt) {
  if (!workflow || !Array.isArray(workflow.nodes)) return workflow;
  const lowerPrompt = (prompt || '').toLowerCase();

  // Extract limit from prompt if present (e.g. 10000 or ₹10,000)
  const limitMatch = lowerPrompt.match(/(?:under|<|max|limit\s*of|upto|up\s*to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  const parsedLimit = limitMatch ? Number(limitMatch[1].replace(/,/g, '')) : 10000;

  // Extract amount if present
  const amountMatch = lowerPrompt.match(/(?:amount|payout|pay|for)\s*(?:of)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  const parsedAmount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 4200;

  workflow.nodes = workflow.nodes.map((node, index) => {
    // 1. GUARANTEE VALID UNIQUE ID (Mongoose required: true)
    const nodeId = node.id || node._id || `${node.type || 'step'}-${index + 1}`;

    // 2. GUARANTEE VALID POSITION OBJECT
    const position = {
      x: typeof node.position?.x === 'number' ? node.position.x : (typeof node.x === 'number' ? node.x : (100 + index * 350)),
      y: typeof node.position?.y === 'number' ? node.position.y : (typeof node.y === 'number' ? node.y : 200),
    };

    const rawType = String(node.type || '').toLowerCase();
    const rawLabel = String(node.label || node.data?.label || '').toLowerCase();
    const rawDesc = String(node.data?.description || '').toLowerCase();

    // Check if node is an AgentGuard node
    const isAgentGuard =
      rawType.includes('agentguard') ||
      rawType.includes('zk_guard') ||
      rawType === 'zk' ||
      rawLabel.includes('agentguard') ||
      rawLabel.includes('zk guard') ||
      rawDesc.includes('agentguard') ||
      (lowerPrompt.includes('agentguard') && (
        rawLabel.includes('validate') ||
        rawLabel.includes('amount') ||
        rawLabel.includes('limit') ||
        rawLabel.includes('check') ||
        rawType === 'condition' ||
        rawType === 'action'
      ));

    if (isAgentGuard) {
      return {
        id: nodeId,
        position,
        type: 'agentGuard',
        label: 'AgentGuard ZK Node',
        data: {
          ...node.data,
          type: 'agentGuard',
          label: 'AgentGuard ZK Node',
          maxLimit: node.data?.maxLimit || parsedLimit || 10000,
          requestedAmount: node.data?.requestedAmount || parsedAmount || 4200,
          targetMerchantId: node.data?.targetMerchantId || 1,
          allowedMerchantId: node.data?.allowedMerchantId || 1,
        },
      };
    }

    // Check if node is a Razorpay payout node
    const isRazorpay =
      rawType.includes('razorpay') ||
      rawType.includes('payout') ||
      rawLabel.includes('razorpay') ||
      rawLabel.includes('payout') ||
      rawDesc.includes('razorpay') ||
      (lowerPrompt.includes('razorpay') && (
        rawLabel.includes('pay') ||
        rawLabel.includes('disburse') ||
        rawType === 'action'
      ));

    if (isRazorpay) {
      return {
        id: nodeId,
        position,
        type: 'razorpay',
        label: 'Razorpay Vendor Payout',
        data: {
          ...node.data,
          type: 'razorpay',
          label: 'Razorpay Vendor Payout',
          amount: node.data?.amount || parsedAmount || 4200,
          vendor: node.data?.vendor || 'AWS India',
          accountNumber: node.data?.accountNumber || '11214311215411',
          mode: node.data?.mode || 'NEFT',
        },
      };
    }

    // Check if node is a Gmail invoice reading node
    const isGmail =
      rawType === 'gmail' ||
      rawType === 'email' ||
      rawLabel.includes('gmail') ||
      rawLabel.includes('email') ||
      rawLabel.includes('invoice');

    if (isGmail) {
      const isReading = lowerPrompt.includes('read') || lowerPrompt.includes('fetch') || lowerPrompt.includes('receive');
      return {
        id: nodeId,
        position,
        type: 'gmail',
        label: isReading ? 'Read Invoice Emails' : (node.label || 'Send Email via Gmail'),
        data: {
          ...node.data,
          type: 'gmail',
          action: isReading ? 'read' : (node.data?.action || 'send'),
          label: isReading ? 'Read Invoice Emails' : (node.label || 'Send Email via Gmail'),
          subtitle: isReading ? 'Filter: invoice attachment' : node.data?.subtitle,
        },
      };
    }

    // Check if node is a LinkedIn node
    const isLinkedIn =
      rawType === 'linkedin' ||
      rawLabel.includes('linkedin') ||
      rawDesc.includes('linkedin') ||
      (lowerPrompt.includes('linkedin') && (
        rawLabel.includes('post') ||
        rawLabel.includes('share') ||
        rawType === 'action'
      ));

    if (isLinkedIn) {
      const postText = node.data?.text || node.data?.content || node.data?.message || prompt;
      return {
        id: nodeId,
        position,
        type: 'linkedin',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Post to LinkedIn',
        data: {
          ...node.data,
          type: 'linkedin',
          action: node.data?.action || 'post',
          label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Post to LinkedIn',
          text: postText,
          content: postText,
        },
      };
    }

    // Check if node is a Twitter / X node
    const isTwitter =
      rawType === 'twitter' || rawType === 'tweet' || rawType === 'x' ||
      rawLabel.includes('twitter') || rawLabel.includes('tweet') ||
      (lowerPrompt.includes('twitter') && (rawLabel.includes('post') || rawType === 'action'));

    if (isTwitter) {
      const tweetText = node.data?.text || node.data?.content || node.data?.message || prompt;
      return {
        id: nodeId,
        position,
        type: 'twitter',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Post Tweet',
        data: {
          ...node.data,
          type: 'twitter',
          action: 'tweet',
          label: 'Post Tweet',
          text: tweetText.slice(0, 280),
        },
      };
    }

    // Check if node is a YouTube node
    const isYouTube =
      rawType === 'youtube' || rawLabel.includes('youtube') ||
      (lowerPrompt.includes('youtube') && (rawLabel.includes('search') || rawLabel.includes('video') || rawType === 'action'));

    if (isYouTube) {
      const query = node.data?.query || node.data?.searchQuery || prompt.replace(/youtube/gi, '').trim() || 'trending';
      return {
        id: nodeId,
        position,
        type: 'youtube',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Search YouTube',
        data: {
          ...node.data,
          type: 'youtube',
          action: 'search',
          label: 'Search YouTube',
          query,
        },
      };
    }

    // Check if node is a Facebook node
    const isFacebook =
      rawType === 'facebook' || rawType === 'fb' || rawLabel.includes('facebook') ||
      (lowerPrompt.includes('facebook') && (rawLabel.includes('post') || rawType === 'action'));

    if (isFacebook) {
      const postText = node.data?.message || node.data?.text || node.data?.content || prompt;
      return {
        id: nodeId,
        position,
        type: 'facebook',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Post to Facebook',
        data: {
          ...node.data,
          type: 'facebook',
          action: 'post',
          label: 'Post to Facebook',
          message: postText,
        },
      };
    }

    // Check if node is an Instagram node
    const isInstagram =
      rawType === 'instagram' || rawType === 'ig' || rawLabel.includes('instagram') ||
      (lowerPrompt.includes('instagram') && (rawLabel.includes('post') || rawType === 'action'));

    if (isInstagram) {
      const caption = node.data?.caption || node.data?.text || prompt;
      return {
        id: nodeId,
        position,
        type: 'instagram',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Post to Instagram',
        data: {
          ...node.data,
          type: 'instagram',
          action: 'post',
          label: 'Post to Instagram',
          caption,
        },
      };
    }

    // Check if node is a Slack node
    const isSlack =
      rawType === 'slack' || rawLabel.includes('slack') ||
      (lowerPrompt.includes('slack') && (rawLabel.includes('message') || rawLabel.includes('post') || rawType === 'action'));

    if (isSlack) {
      const msg = node.data?.message || node.data?.text || prompt;
      return {
        id: nodeId,
        position,
        type: 'slack',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Post to Slack',
        data: {
          ...node.data,
          type: 'slack',
          action: 'postMessage',
          channel: node.data?.channel || '#general',
          message: msg,
          label: 'Post to Slack',
        },
      };
    }

    // Check if node is a Discord node
    const isDiscord =
      rawType === 'discord' || rawLabel.includes('discord') ||
      (lowerPrompt.includes('discord') && (rawLabel.includes('message') || rawLabel.includes('post') || rawType === 'action'));

    if (isDiscord) {
      const msg = node.data?.message || node.data?.text || prompt;
      return {
        id: nodeId,
        position,
        type: 'discord',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Post to Discord',
        data: {
          ...node.data,
          type: 'discord',
          action: 'postMessage',
          channelId: node.data?.channelId || '',
          message: msg,
          label: 'Post to Discord',
        },
      };
    }

    // Check if node is a Google Sheets node
    const isGoogleSheets =
      rawType === 'google-sheets' || rawType === 'sheets' || rawType === 'spreadsheet' ||
      rawLabel.includes('sheet') || rawLabel.includes('spreadsheet') ||
      (lowerPrompt.includes('sheet') && (rawLabel.includes('append') || rawLabel.includes('row') || rawType === 'action'));

    if (isGoogleSheets) {
      return {
        id: nodeId,
        position,
        type: 'google-sheets',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'Append Row to Sheet',
        data: {
          ...node.data,
          type: 'google-sheets',
          action: node.data?.action || 'appendRow',
          spreadsheetId: node.data?.spreadsheetId || '',
          range: node.data?.range || 'Sheet1!A:Z',
          label: 'Google Sheets',
        },
      };
    }

    // Check if node is an AI / LLM node
    const isAI =
      rawType === 'ai' || rawType === 'llm' ||
      rawLabel.includes('ai') || rawLabel.includes('llm') || rawLabel.includes('generate content') ||
      (lowerPrompt.includes('generate') && rawType === 'action' && !lowerPrompt.includes('workflow'));

    if (isAI) {
      return {
        id: nodeId,
        position,
        type: 'ai',
        label: node.label && !node.label.toLowerCase().includes('step') ? node.label : 'AI Content Generator',
        data: {
          ...node.data,
          type: 'ai',
          prompt: node.data?.prompt || prompt,
          label: 'AI Content Generator',
        },
      };
    }

    // Check if node is a Trigger node
    const isTrigger = rawType === 'trigger' || rawType === 'manual' || rawType === 'start' || rawLabel.includes('trigger') || rawLabel.includes('start');
    if (isTrigger) {
      const label = getMeaningfulLabel(node, 'trigger', prompt);
      return {
        id: nodeId,
        position,
        type: 'trigger',
        label,
        data: {
          ...node.data,
          type: 'manual',
          label,
        },
      };
    }

    // Check if node is a Notification node
    const isNotification = rawType === 'notification' || rawType === 'notify' || rawLabel.includes('notification') || rawLabel.includes('notify');
    if (isNotification) {
      const label = getMeaningfulLabel(node, 'notification', prompt);
      return {
        id: nodeId,
        position,
        type: 'notification',
        label,
        data: {
          ...node.data,
          type: 'notification',
          label,
        },
      };
    }

    const resolvedType = node.type || 'action';
    const finalLabel = getMeaningfulLabel(node, resolvedType, prompt);
    return {
      id: nodeId,
      position,
      type: resolvedType,
      label: finalLabel,
      data: {
        ...node.data,
        type: resolvedType,
        label: finalLabel,
      },
    };
  });

  // GUARANTEE VALID EDGES WITH IDS, SOURCE, AND TARGET
  if (!Array.isArray(workflow.edges) || workflow.edges.length === 0) {
    workflow.edges = [];
    for (let i = 0; i < workflow.nodes.length - 1; i++) {
      workflow.edges.push({
        id: `e-${workflow.nodes[i].id}-${workflow.nodes[i + 1].id}`,
        source: workflow.nodes[i].id,
        target: workflow.nodes[i + 1].id,
        animated: true,
        type: 'smoothstep',
      });
    }
  } else {
    workflow.edges = workflow.edges.map((edge, idx) => ({
      id: edge.id || `e-${edge.source || idx}-${edge.target || idx + 1}`,
      source: edge.source || workflow.nodes[idx]?.id || 'node-1',
      target: edge.target || workflow.nodes[idx + 1]?.id || 'node-2',
      animated: edge.animated !== false,
      type: edge.type || 'smoothstep',
    }));
  }

  return workflow;
}

// ─── Deterministic rule-based workflow builder ─────────────────────────────
function buildRuleBasedWorkflow(prompt) {
  const lower = prompt.toLowerCase();

  // AgentGuard + Razorpay / Invoice Payout Workflow
  if (
    lower.includes('agentguard') ||
    (lower.includes('razorpay') && (lower.includes('guard') || lower.includes('zk') || lower.includes('invoice') || lower.includes('under')))
  ) {
    const limitMatch = prompt.match(/(?:under|<|max|limit\s*of|upto|up\s*to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
    const parsedLimit = limitMatch ? Number(limitMatch[1].replace(/,/g, '')) : 10000;

    return {
      name: 'Invoice Payout Automation with AgentGuard ZK',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        {
          id: 'gmail-1',
          type: 'gmail',
          label: 'Read Invoice Emails',
          position: { x: 100, y: 200 },
          data: {
            action: 'read',
            label: 'Read Invoice Emails',
            subtitle: 'Filter: has:attachment invoice',
          },
        },
        {
          id: 'agentguard-1',
          type: 'agentGuard',
          label: 'AgentGuard ZK Node',
          position: { x: 450, y: 200 },
          data: {
            maxLimit: parsedLimit || 10000,
            requestedAmount: 4200,
            targetMerchantId: 1,
            allowedMerchantId: 1,
            label: 'AgentGuard ZK Node',
          },
        },
        {
          id: 'razorpay-1',
          type: 'razorpay',
          label: 'Razorpay Vendor Payout',
          position: { x: 800, y: 200 },
          data: {
            amount: 4200,
            vendor: 'AWS India',
            accountNumber: '11214311215411',
            mode: 'NEFT',
            label: 'Razorpay Vendor Payout',
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'gmail-1', target: 'agentguard-1', animated: true },
        { id: 'e2-3', source: 'agentguard-1', target: 'razorpay-1', animated: true },
      ],
    };
  }

  // Gmail / send email
  if (lower.includes('email') || lower.includes('gmail') || lower.includes('mail')) {
    const toMatch = prompt.match(/to\s+([\w.+-]+@[\w-]+\.[\w.]+)/i);
    const subjectMatch = prompt.match(/subject\s+["']?([^"',]+)["']?/i);
    const bodyMatch = prompt.match(/body\s+["']([^"']+)["']/i);
    const emailTo = toMatch?.[1] || '';
    const emailSubject = subjectMatch?.[1]?.trim() || '';
    const emailBody = bodyMatch?.[1]?.trim() || '';

    return {
      name: 'Send Email Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          label: 'Manual Trigger',
          position: { x: 100, y: 200 },
          data: { type: 'manual', description: 'Workflow starts manually' },
        },
        {
          id: 'gmail-1',
          type: 'gmail',
          label: 'Send Email via Gmail',
          position: { x: 450, y: 200 },
          data: {
            action: 'send',
            to: emailTo,
            subject: emailSubject,
            body: emailBody,
            subtitle: emailTo ? `To: ${emailTo}` : 'Configure recipient',
          },
        },
        {
          id: 'notify-1',
          type: 'notification',
          label: 'Email Sent',
          position: { x: 800, y: 200 },
          data: { message: 'Email sent successfully', subtitle: 'Workflow complete' },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'gmail-1', animated: true },
        { id: 'e2-3', source: 'gmail-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // Slack
  if (lower.includes('slack')) {
    return {
      name: 'Slack Notification Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'slack-1', type: 'slack', label: 'Post to Slack', position: { x: 450, y: 200 }, data: { action: 'postMessage', channel: '#general', message: '' } },
        { id: 'log-1', type: 'log', label: 'Log Result', position: { x: 800, y: 200 }, data: { message: 'Slack message sent' } },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'slack-1', animated: true },
        { id: 'e2-3', source: 'slack-1', target: 'log-1', animated: true },
      ],
    };
  }

  // Discord
  if (lower.includes('discord')) {
    return {
      name: 'Discord Notification Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'discord-1', type: 'discord', label: 'Post to Discord', position: { x: 450, y: 200 }, data: { action: 'postMessage', channelId: '', message: '' } },
        { id: 'log-1', type: 'log', label: 'Log Result', position: { x: 800, y: 200 }, data: {} },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'discord-1', animated: true },
        { id: 'e2-3', source: 'discord-1', target: 'log-1', animated: true },
      ],
    };
  }

  // Google Sheets
  if (lower.includes('sheet') || lower.includes('spreadsheet') || lower.includes('google sheet')) {
    return {
      name: 'Google Sheets Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'sheets-1', type: 'google-sheets', label: 'Append Row', position: { x: 450, y: 200 }, data: { action: 'appendRow', spreadsheetId: '', range: 'Sheet1!A:Z', values: [] } },
        { id: 'notify-1', type: 'notification', label: 'Done', position: { x: 800, y: 200 }, data: {} },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'sheets-1', animated: true },
        { id: 'e2-3', source: 'sheets-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // Invoice routing
  if (lower.includes('invoice') || lower.includes('routing') || lower.includes('approval')) {
    return {
      name: 'Invoice Routing Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Receive Invoice', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'condition-1', type: 'condition', label: 'Amount Check', position: { x: 450, y: 200 }, data: { field: 'amount', operator: 'gt', value: 1000 } },
        { id: 'gmail-1', type: 'gmail', label: 'Email Manager', position: { x: 800, y: 100 }, data: { action: 'send', subject: 'Invoice Approval Required' } },
        { id: 'sheets-1', type: 'google-sheets', label: 'Log to Sheet', position: { x: 800, y: 300 }, data: { action: 'appendRow' } },
        { id: 'notify-1', type: 'notification', label: 'Notify Done', position: { x: 1150, y: 200 }, data: {} },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'condition-1', animated: true },
        { id: 'e2-3', source: 'condition-1', target: 'gmail-1', animated: true, label: 'high' },
        { id: 'e2-4', source: 'condition-1', target: 'sheets-1', animated: true, label: 'low' },
        { id: 'e3-5', source: 'gmail-1', target: 'notify-1', animated: true },
        { id: 'e4-5', source: 'sheets-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // Twitter / X
  if (lower.includes('twitter') || lower.includes('tweet') || lower.includes('post to x')) {
    const text = `Latest updates on ${prompt.replace(/(?:twitter|tweet|x|post|create|workflow)\s*/gi, '').trim() || 'AI & tech'}! #Tech #Innovation`;
    return {
      name: 'Twitter Post Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'twitter-1', type: 'twitter', label: 'Post Tweet', position: { x: 450, y: 200 }, data: { action: 'tweet', text, label: 'Post Tweet', type: 'twitter' } },
        { id: 'notify-1', type: 'notification', label: 'Tweet Published', position: { x: 800, y: 200 }, data: { message: 'Tweet successfully published!' } },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'twitter-1', animated: true },
        { id: 'e2-3', source: 'twitter-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // YouTube
  if (lower.includes('youtube')) {
    const query = prompt.replace(/(?:youtube|search|find|videos|video|about)\s*/gi, '').trim() || 'Generative AI';
    return {
      name: 'YouTube Search Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'youtube-1', type: 'youtube', label: 'Search YouTube', position: { x: 450, y: 200 }, data: { action: 'search', query, label: 'Search YouTube', type: 'youtube' } },
        { id: 'notify-1', type: 'notification', label: 'Search Complete', position: { x: 800, y: 200 }, data: { message: 'YouTube search finished!' } },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'youtube-1', animated: true },
        { id: 'e2-3', source: 'youtube-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // Facebook
  if (lower.includes('facebook')) {
    return {
      name: 'Facebook Post Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'facebook-1', type: 'facebook', label: 'Post to Facebook', position: { x: 450, y: 200 }, data: { action: 'post', message: prompt, label: 'Post to Facebook', type: 'facebook' } },
        { id: 'notify-1', type: 'notification', label: 'Post Published', position: { x: 800, y: 200 }, data: { message: 'Published to Facebook page!' } },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'facebook-1', animated: true },
        { id: 'e2-3', source: 'facebook-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // Instagram
  if (lower.includes('instagram')) {
    return {
      name: 'Instagram Post Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'instagram-1', type: 'instagram', label: 'Post to Instagram', position: { x: 450, y: 200 }, data: { action: 'post', caption: prompt, label: 'Post to Instagram', type: 'instagram' } },
        { id: 'notify-1', type: 'notification', label: 'Post Published', position: { x: 800, y: 200 }, data: { message: 'Published to Instagram!' } },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'instagram-1', animated: true },
        { id: 'e2-3', source: 'instagram-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // LinkedIn
  if (lower.includes('linkedin')) {
    const defaultText = 'Excited to share latest insights on the continuous evolution of Generative AI! How it is transforming industries and workflows day by day. #GenerativeAI #AI #Innovation';
    return {
      name: 'LinkedIn Post Workflow',
      description: prompt,
      provider: 'rule-based',
      nodes: [
        { id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 100, y: 200 }, data: { type: 'manual' } },
        { id: 'linkedin-1', type: 'linkedin', label: 'Post to LinkedIn', position: { x: 450, y: 200 }, data: { action: 'post', text: defaultText, label: 'Post to LinkedIn', type: 'linkedin' } },
        { id: 'notify-1', type: 'notification', label: 'Post Published', position: { x: 800, y: 200 }, data: { message: 'Successfully published post to LinkedIn!' } },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'linkedin-1', animated: true },
        { id: 'e2-3', source: 'linkedin-1', target: 'notify-1', animated: true },
      ],
    };
  }

  // Generic fallback
  return {
    name: 'Custom Workflow',
    description: prompt,
    provider: 'rule-based',
    nodes: [
      { id: 'trigger-1', type: 'trigger', label: 'Start', position: { x: 100, y: 200 }, data: { type: 'manual' } },
      { id: 'action-1', type: 'action', label: 'Process', position: { x: 450, y: 200 }, data: { description: prompt } },
      { id: 'end-1', type: 'notification', label: 'Complete', position: { x: 800, y: 200 }, data: {} },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'action-1', animated: true },
      { id: 'e2-3', source: 'action-1', target: 'end-1', animated: true },
    ],
  };
}

const PLATFORM_NODES_PROMPT = `AVAILABLE PLATFORM NODE TYPES:
1. "trigger": Starting event (manual, schedule, webhook).
2. "linkedin": LinkedIn post to feed / commentary. MUST BE USED when the prompt mentions LinkedIn. (Data: { action: "post", text: "Text content for the LinkedIn post", label: "Post to LinkedIn" })
3. "twitter": Twitter/X tweet. MUST BE USED when the prompt mentions Twitter, Tweet, or X. (Data: { action: "tweet", text: "Tweet content (max 280 chars)", label: "Post Tweet" })
4. "facebook": Facebook page post. MUST BE USED when the prompt mentions Facebook. (Data: { action: "post", message: "Facebook post message", label: "Post to Facebook" })
5. "instagram": Instagram photo/caption. MUST BE USED when the prompt mentions Instagram. (Data: { action: "post", caption: "Caption text", label: "Post to Instagram" })
6. "youtube": YouTube search / stats. MUST BE USED when the prompt mentions YouTube. (Data: { action: "search", query: "Search keywords", label: "Search YouTube" })
7. "gmail": Read invoice emails or send email messages. (Data: { action: "read"|"send", to: "...", subject: "...", body: "...", label: "Gmail" })
8. "slack": Slack channel messages. (Data: { action: "postMessage", channel: "#general", message: "...", label: "Post to Slack" })
9. "discord": Discord channel messages. (Data: { action: "postMessage", message: "...", label: "Post to Discord" })
10. "google-sheets": Spreadsheet append or read. (Data: { action: "appendRow", spreadsheetId: "...", range: "Sheet1!A:Z", values: [...], label: "Google Sheets" })
11. "agentGuard": Zero-Knowledge spending verification & whitelist guardrail. MUST BE USED when prompt mentions AgentGuard, ZK guard, verifying limits (e.g. under ₹10,000). (Data: { maxLimit: 10000, requestedAmount: 4200, targetMerchantId: 1, allowedMerchantId: 1, label: "AgentGuard ZK Node" })
12. "razorpay": Razorpay automated vendor payout. MUST BE USED when prompt mentions Razorpay or vendor payout. (Data: { amount: 4200, vendor: "AWS India", accountNumber: "11214311215411", mode: "NEFT", label: "Razorpay Vendor Payout" })
13. "ai": LLM AI transformation / text generation. (Data: { prompt: "...", task: "generate"|"summarize"|"extract", label: "AI Content Generator" })
14. "condition": Branching logic. (Data: { field: "...", operator: "gt"|"lt"|"eq"|"contains", value: "...", label: "Condition" })
15. "notification": In-app notification. (Data: { message: "...", label: "Notify" })
16. "log": Timeline logging. (Data: { message: "...", label: "Log Event" })
17. "action": Generic task only when no specific platform node applies.

CRITICAL NAMING RULE:
- NEVER give nodes generic names like "Step", "Node", "Task", or "Action".
- EVERY node MUST have a meaningful, self-explanatory "label" describing what it does (e.g. "Start Workflow", "Post to LinkedIn", "Send Slack Notification", "Read Invoice Emails", "AgentGuard ZK Guard", "Razorpay Vendor Payout", "Send Notification").`;

// ─── Gemini AI workflow generation ────────────────────────────────────────────
async function generateWithGemini(prompt) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `You are a workflow automation expert for Agentflow_AI. Given a user's automation request, generate an executable visual workflow in JSON format.

${PLATFORM_NODES_PROMPT}

REQUIRED JSON STRUCTURE:
{
  "name": "Descriptive Workflow Name",
  "description": "Short explanation",
  "nodes": [
    {
      "id": "node-id-1",
      "type": "gmail|agentGuard|razorpay|linkedin|twitter|facebook|instagram|youtube|trigger|slack|discord|google-sheets|condition|action|notification|log|ai",
      "label": "Node Title",
      "position": { "x": 100, "y": 200 },
      "data": { ... }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-id-1",
      "target": "node-id-2",
      "animated": true
    }
  ]
}

CRITICAL RULES:
- NEVER use generic "action" when a specific platform exists (linkedin, twitter, facebook, instagram, youtube, gmail, slack, discord, google-sheets, agentGuard, razorpay).
- If user requests reading invoice emails from Gmail, checking under ₹10,000 using AgentGuard, and paying via Razorpay:
  Generate exactly 3 nodes:
  1. id: "gmail-1", type: "gmail", label: "Read Invoice Emails", position: { x: 100, y: 200 }, data: { action: "read", label: "Read Invoice Emails" }
  2. id: "agentguard-1", type: "agentGuard", label: "AgentGuard ZK Node", position: { x: 450, y: 200 }, data: { maxLimit: 10000, requestedAmount: 4200, targetMerchantId: 1, allowedMerchantId: 1, label: "AgentGuard ZK Node" }
  3. id: "razorpay-1", type: "razorpay", label: "Razorpay Vendor Payout", position: { x: 800, y: 200 }, data: { amount: 4200, vendor: "AWS India", accountNumber: "11214311215411", mode: "NEFT", label: "Razorpay Vendor Payout" }
  Edges: gmail-1 -> agentguard-1 -> razorpay-1
- Space nodes 350px apart horizontally on y: 200.
- Return ONLY raw JSON, with no markdown codeblocks, no explanations.

User prompt: ${prompt}`;

  const result = await model.generateContent(systemPrompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response');

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.provider = 'gemini';
  return sanitizeWorkflow(parsed, prompt);
}

// ─── OpenRouter AI workflow generation ───────────────────────────────────────
async function generateWithOpenRouter(prompt) {
  const OpenAI = require('openai');
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a workflow automation expert for Agentflow_AI. Return ONLY valid JSON with name, description, nodes[], edges[].

${PLATFORM_NODES_PROMPT}

CRITICAL RULES:
- ALWAYS use the specific platform node type (e.g. linkedin, twitter, facebook, instagram, youtube, gmail, slack, discord, google-sheets, agentGuard, razorpay) instead of generic "action".
- Space nodes 350px apart horizontally on y: 200. Return raw JSON ONLY.`,
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = completion.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in OpenRouter response');

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.provider = 'openrouter';
  return sanitizeWorkflow(parsed, prompt);
}

// ─── Main entry — tries OpenRouter → Gemini → rule-based ─────────────────────
async function generateWorkflow(prompt) {
  if (env.OPENROUTER_API_KEY) {
    try {
      console.log('🤖 Generating workflow via OpenRouter...');
      return await generateWithOpenRouter(prompt);
    } catch (err) {
      console.warn('⚠️  OpenRouter failed:', err.message, '— trying Gemini...');
    }
  }

  if (env.GEMINI_API_KEY) {
    try {
      console.log('🤖 Generating workflow via Gemini...');
      return await generateWithGemini(prompt);
    } catch (err) {
      console.warn('⚠️  Gemini failed:', err.message, '— using deterministic fallback...');
    }
  }

  console.log('🔧 Using deterministic rule-based workflow builder...');
  const ruleBuilt = buildRuleBasedWorkflow(prompt);
  return sanitizeWorkflow(ruleBuilt, prompt);
}

module.exports = { generateWorkflow };
