const express = require('express');
const agentGuardService = require('../services/agentGuardService');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/agentguard/verify
 * Verifies a Groth16 ZK proof against public signals.
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { proof, publicSignals } = req.body;
    if (!proof || !publicSignals) {
      return res.status(400).json({
        success: false,
        message: 'Missing "proof" or "publicSignals" in request body.',
      });
    }

    const isValid = await agentGuardService.verifyProof(proof, publicSignals);
    res.json({
      success: true,
      isValid,
      message: isValid
        ? 'ZK Proof Verified. Financial constraint bounded and safe.'
        : 'ZK Verification Failed. Proof does not satisfy circuit constraints.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agentguard/prove
 * Generates a Groth16 proof for given spend parameters.
 */
router.post('/prove', async (req, res, next) => {
  try {
    const {
      requestedAmount,
      maxAllowedSpend,
      targetMerchantId,
      allowedMerchantId,
      privateAuthSecret,
    } = req.body;

    const result = await agentGuardService.generateProof({
      requestedAmount,
      maxAllowedSpend,
      targetMerchantId,
      allowedMerchantId,
      privateAuthSecret,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: `ZK Proof generation failed: ${result.error}`,
      });
    }

    res.json({
      success: true,
      proof: result.proof,
      publicSignals: result.publicSignals,
      message: 'ZK Proof generated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agentguard/check
 * Performs full end-to-end check: generate proof + verify constraints.
 */
router.post('/check', async (req, res, next) => {
  try {
    const {
      requestedAmount,
      maxLimit,
      targetMerchantId,
      allowedMerchantId,
      proof,
      publicSignals,
    } = req.body;

    const checkResult = await agentGuardService.verifySpend({
      requestedAmount,
      maxLimit,
      targetMerchantId,
      allowedMerchantId,
      proof,
      publicSignals,
    });

    res.json({
      success: checkResult.isValid,
      status: checkResult.isValid ? 'PROOF_VALID' : 'ZK_REJECTED',
      data: checkResult,
      message: checkResult.isValid
        ? 'ZK Proof Verified. Financial execution bounded and safe.'
        : `Spending limit violated or proof invalid: Requested ₹${requestedAmount} vs Max ₹${maxLimit}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
