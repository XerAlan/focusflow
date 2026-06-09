// 启动 electron-builder（清理 ELECTRON_RUN_AS_NODE）
const { spawn } = require('child_process');
const path = require('path');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const isWin = process.platform === 'win32';
const cmd = isWin ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['electron-builder', '--win', '--x64'], {
  env,
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

child.on('exit', (code) => process.exit(code || 0));
