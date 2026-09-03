const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

const vKeyPath = path.join(__dirname, '../keys/verification_key.json');
const wasmPath = path.join(__dirname, '../keys/spend_guard.wasm');
const zkeyPath = path.join(__dirname, '../keys/spend_guard_final.zkey');

class AgentGuardService {
  /**
   * Verify an existing Groth16 proof against public signals using the verification key.
   */
  async verifyProof(proof, publicSignals) {
    try {
      if (!proof || !publicSignals) {
        return false;
      }
      if (!fs.existsSync(vKeyPath)) {
        throw new Error('Verification key missing. Run compile.sh first.');
      }
      const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
      const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      return isValid;
    } catch (error) {
      console.error('AgentGuard ZK Verification Failed:', error.message);
      return false;
    }
  }

  /**
   * Generate a real zero-knowledge Groth16 proof using the compiled circuit WASM and zkey.
   */
  async generateProof({
    privateAuthSecret = 123456,
    maxAllowedSpend,
    requestedAmount,
    targetMerchantId = 1,
    allowedMerchantId = 1,
  }) {
    try {
      if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
        throw new Error('Circuit WASM or zkey missing. Run compile.sh first.');
      }

      const circuitInputs = {
        privateAuthSecret: String(privateAuthSecret || 123456),
        maxAllowedSpend: String(maxAllowedSpend),
        requestedAmount: String(requestedAmount),
        targetMerchantId: String(targetMerchantId || 1),
        allowedMerchantId: String(allowedMerchantId || 1),
      };

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        wasmPath,
        zkeyPath
      );

      return { success: true, proof, publicSignals };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper to format expected public signals array: [requestedAmount, targetMerchantId, allowedMerchantId, isVerified]
   */
  generatePublicSignals(requestedAmount, targetMerchant = 1, allowedMerchant = 1, isPassing = true) {
    return [
      requestedAmount.toString(),
      targetMerchant.toString(),
      allowedMerchant.toString(),
      isPassing ? '1' : '0',
    ];
  }

  /**
   * Comprehensive spend verification: generates or verifies proof and checks constraints.
   */
  async verifySpend({
    requestedAmount,
    maxLimit,
    targetMerchantId = 1,
    allowedMerchantId = 1,
    privateAuthSecret = 123456,
    proof = null,
    publicSignals = null,
  }) {
    const reqAmt = Number(requestedAmount) || 0;
    const maxAmt = Number(maxLimit) || 0;
    const isPassing = reqAmt <= maxAmt && targetMerchantId === allowedMerchantId;

    let zkProof = proof;
    let zkSignals = publicSignals;

    // If proof not provided, attempt generating one
    if (!zkProof && fs.existsSync(wasmPath) && fs.existsSync(zkeyPath)) {
      const genResult = await this.generateProof({
        privateAuthSecret,
        maxAllowedSpend: maxAmt,
        requestedAmount: reqAmt,
        targetMerchantId,
        allowedMerchantId,
      });
      if (genResult.success) {
        zkProof = genResult.proof;
        zkSignals = genResult.publicSignals;
      }
    }

    let isValidProof = false;
    if (zkProof && zkSignals) {
      isValidProof = await this.verifyProof(zkProof, zkSignals);
    }

    return {
      isValid: isValidProof && isPassing,
      proof: zkProof,
      publicSignals: zkSignals,
      requestedAmount: reqAmt,
      maxLimit: maxAmt,
      targetMerchantId,
      allowedMerchantId,
      isPassing,
      isValidProof,
    };
  }
}

module.exports = new AgentGuardService();
