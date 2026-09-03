const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const circuitsDir = path.join(__dirname);
const binDir = path.join(circuitsDir, 'bin');
const buildDir = path.join(circuitsDir, 'build');
const keysDir = path.join(__dirname, '../src/keys');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    const file = fs.createWriteStream(dest);
    const get = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          get(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: status ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    };
    get(url);
  });
}

async function getCircomBinary() {
  // Check if circom is in PATH
  try {
    execSync('circom --version', { stdio: 'pipe' });
    return 'circom';
  } catch (_) {}

  // Check local bin
  const localCircom = process.platform === 'win32'
    ? path.join(binDir, 'circom.exe')
    : path.join(binDir, 'circom');

  if (fs.existsSync(localCircom)) {
    return `"${localCircom}"`;
  }

  ensureDir(binDir);
  console.log('Circom not found in PATH. Fetching prebuilt binary for', process.platform);

  let downloadUrl = '';
  if (process.platform === 'win32') {
    downloadUrl = 'https://github.com/iden3/circom/releases/download/v2.2.3/circom-windows-amd64.exe';
  } else if (process.platform === 'darwin') {
    downloadUrl = 'https://github.com/iden3/circom/releases/download/v2.2.3/circom-macos-amd64';
  } else {
    downloadUrl = 'https://github.com/iden3/circom/releases/download/v2.2.3/circom-linux-amd64';
  }

  await downloadFile(downloadUrl, localCircom);
  if (process.platform !== 'win32') {
    fs.chmodSync(localCircom, 0o755);
  }
  return `"${localCircom}"`;
}

async function main() {
  ensureDir(buildDir);
  ensureDir(keysDir);

  const circomCmd = await getCircomBinary();
  console.log('Using circom binary:', circomCmd);

  // 1. Compile circom circuit
  const nodeModulesPath = path.resolve(__dirname, '../node_modules');
  console.log('Compiling spend_guard.circom with circomlib from:', nodeModulesPath);
  execSync(`${circomCmd} spend_guard.circom -l "${nodeModulesPath}" --r1cs --wasm --sym -o "${buildDir}"`, {
    cwd: circuitsDir,
    stdio: 'inherit',
  });

  // 2. SnarkJS powers of tau & Groth16 setup using CLI
  console.log('Generating zk keys using npx snarkjs CLI...');

  const runSnark = (cmd) => {
    console.log(`Running: npx snarkjs ${cmd}`);
    execSync(`npx snarkjs ${cmd}`, { cwd: buildDir, stdio: 'inherit' });
  };

  const potFinal = path.join(buildDir, 'pot12_final.ptau');
  if (!fs.existsSync(potFinal)) {
    if (!fs.existsSync(path.join(buildDir, 'pot12_0000.ptau'))) {
      runSnark('powersoftau new bn128 12 pot12_0000.ptau -v');
    }
    runSnark('powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Agentflow Setup" -v -e="entropy_1"');
    runSnark('powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v');
  }

  runSnark('groth16 setup spend_guard.r1cs pot12_final.ptau spend_guard_0000.zkey');
  runSnark('zkey contribute spend_guard_0000.zkey spend_guard_final.zkey --name="Agentflow Contrib" -v -e="entropy_2"');
  runSnark('zkey export verificationkey spend_guard_final.zkey verification_key.json');

  // Copy to server/src/keys
  const vkeySrc = path.join(buildDir, 'verification_key.json');
  const vkeyDest = path.join(keysDir, 'verification_key.json');
  fs.copyFileSync(vkeySrc, vkeyDest);
  console.log('Copied verification_key.json to src/keys/');

  const wasmSrc = path.join(buildDir, 'spend_guard_js', 'spend_guard.wasm');
  const wasmDest = path.join(keysDir, 'spend_guard.wasm');
  if (fs.existsSync(wasmSrc)) {
    fs.copyFileSync(wasmSrc, wasmDest);
    console.log('Copied spend_guard.wasm to src/keys/');
  }

  const zkeySrc = path.join(buildDir, 'spend_guard_final.zkey');
  const zkeyDest = path.join(keysDir, 'spend_guard_final.zkey');
  if (fs.existsSync(zkeySrc)) {
    fs.copyFileSync(zkeySrc, zkeyDest);
    console.log('Copied spend_guard_final.zkey to src/keys/');
  }

  console.log('✅ ZK Circuit setup complete! verification_key.json and spend_guard.wasm are ready in server/src/keys/');
}

main().catch(err => {
  console.error('Compilation failed:', err);
  process.exit(1);
});
