#!/bin/bash
set -e

mkdir -p build
circom spend_guard.circom -l ../node_modules -l ../../node_modules --r1cs --wasm --sym -o build/

cd build
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Agentflow Setup" -v -e="entropy_1"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

snarkjs groth16 setup spend_guard.r1cs pot12_final.ptau spend_guard_0000.zkey
snarkjs zkey contribute spend_guard_0000.zkey spend_guard_final.zkey --name="Agentflow Contrib" -v -e="entropy_2"
snarkjs zkey export verificationkey spend_guard_final.zkey verification_key.json

mkdir -p ../../src/keys
cp verification_key.json ../../src/keys/
cp spend_guard_js/spend_guard.wasm ../../src/keys/
cp spend_guard_final.zkey ../../src/keys/

echo "ZK Circuit compiled successfully and keys copied to server/src/keys/"
