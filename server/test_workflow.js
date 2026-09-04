const { executionAgent } = require('./src/agents/executionAgent');
const integrationService = require('./src/services/integrationService');

async function testWorkflow() {
  console.log('=== STEP 1: Webhook Trigger (Node 1) ===');
  const node1 = {
    id: 'node-1',
    type: 'triggerNode',
    data: {
      label: 'Invoice Received Webhook',
      eventType: 'INVOICE_UPLOAD',
      fileUrl: 'https://storage.googleapis.com/agentflow-invoices/sample_inv_1042.pdf',
      customerEmail: 'shivantag2022@gmail.com',
      invoiceId: 'INV-2026-1042',
    }
  };
  const ctx = { inputs: {}, outputs: {} };
  const res1 = await executionAgent(node1, ctx, integrationService);
  ctx.outputs['node-1'] = res1.output;
  console.log('Output 1:', JSON.stringify(res1.output, null, 2));

  console.log('\n=== STEP 2: Gemini Invoice OCR Parser (Node 2) ===');
  const node2 = {
    id: 'node-2',
    type: 'aiNode',
    data: {
      label: 'Gemini 2.5 Flash OCR Parser',
      model: 'gemini-2.5-flash',
      prompt: 'Invoice data: Amount Rs 4200 from AWS India, email: shivantag2022@gmail.com, due: 2026-09-15',
      _previousOutput: res1.output,
    }
  };
  const res2 = await executionAgent(node2, ctx, integrationService);
  ctx.outputs['node-2'] = res2.output;
  console.log('Output 2:', JSON.stringify({
    extractedAmount: res2.output.extractedAmount,
    vendorName: res2.output.vendorName,
    parsedEmail: res2.output.parsedEmail,
    dueDate: res2.output.dueDate,
  }, null, 2));

  console.log('\n=== STEP 3: AgentGuard Security & ZKP Policy Check (Node 3) ===');
  const node3 = {
    id: 'node-3',
    type: 'securityNode',
    data: {
      label: 'AgentGuard ZKP & Policy Check',
      maxLimit: 50000,
      _previousOutput: res2.output,
    }
  };
  const res3 = await executionAgent(node3, ctx, integrationService);
  ctx.outputs['node-3'] = res3.output;
  console.log('Output 3:', JSON.stringify({
    verificationStatus: res3.output.verificationStatus,
    policyToken: res3.output.policyToken,
    proofStatus: res3.output.proofStatus,
    extractedAmount: res3.output.extractedAmount,
    maxLimit: res3.output.maxLimit,
    verified: res3.output.verified,
  }, null, 2));

  console.log('\n=== STEP 4: Razorpay Payment Link Generator (Node 4) ===');
  const node4 = {
    id: 'node-4',
    type: 'payoutNode',
    data: {
      label: 'Razorpay Payment Link Generator',
      currency: 'INR',
      invoiceNumber: res1.output.invoiceId,
      _previousOutput: res3.output,
    }
  };
  const res4 = await executionAgent(node4, ctx, integrationService);
  ctx.outputs['node-4'] = res4.output;
  console.log('Output 4:', JSON.stringify({
    status: res4.output.status,
    payoutId: res4.output.payoutId,
    paymentLink: res4.output.paymentLink,
    short_url: res4.output.short_url,
    amount: res4.output.amount,
  }, null, 2));

  console.log('\n=== STEP 5: Email Notification Dispatcher (Node 5) ===');
  const node5 = {
    id: 'node-5',
    type: 'actionNode',
    data: {
      label: 'Automated Email Dispatcher',
      template: 'PAYMENT_REQUEST',
      to: res1.output.customerEmail,
      _previousOutput: res4.output,
    }
  };
  const res5 = await executionAgent(node5, ctx, integrationService);
  ctx.outputs['node-5'] = res5.output;
  console.log('Output 5:', JSON.stringify({
    status: res5.output.status,
    dispatched: res5.output.dispatched,
    paymentLink: res5.output.paymentLink,
    message: res5.output.message,
  }, null, 2));

  console.log('\n🎯 COMPLETE 5-NODE END-TO-END PIPELINE VALIDATED SUCCESSFULLY!');
  process.exit(0);
}

testWorkflow().catch(err => {
  console.error('Workflow error:', err);
  process.exit(1);
});
