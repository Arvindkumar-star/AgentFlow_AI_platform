pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";

template SpendGuard() {
    // Private Inputs (Only known locally to the execution session)
    signal input privateAuthSecret;
    signal input maxAllowedSpend;

    // Public Inputs (Exposed to Express Verifier & Logs)
    signal input requestedAmount;
    signal input targetMerchantId;
    signal input allowedMerchantId;

    // Output Signal
    signal output isVerified;

    // Constraint 1: Requested Amount <= Max Allowed Spend Limit (64-bit comparison)
    component compLess = LessEqThan(64);
    compLess.in[0] <== requestedAmount;
    compLess.in[1] <== maxAllowedSpend;

    // Constraint 2: Merchant ID Match
    component compMerchant = IsEqual();
    compMerchant.in[0] <== targetMerchantId;
    compMerchant.in[1] <== allowedMerchantId;

    // Combined Check
    isVerified <== compLess.out * compMerchant.out;
    isVerified === 1;
}

component main {public [requestedAmount, targetMerchantId, allowedMerchantId]} = SpendGuard();
