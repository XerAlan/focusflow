// 启动 Electron 主进程（强制清理 ELECTRON_RUN_AS_NODE）
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
env.NODE_ENV = 'development';

// 直接调用 electron.exe（不用 .cmd shim，避免 Windows spawn EINVAL）
let electronExe;
if (process.platform === 'win32') {
  electronExe = path.join(
    __dirname,
    '..',
    'node_modules',
    'electron',
    'dist',
    'electron.exe'
  );
} else {
  electronExe = path.join(
    __dirname,
    '..',
    'node_modules',
    'electron',
    'dist',
    'electron'
  );
}

if (!fs.existsSync(electronExe)) {
  console.error('找不到 electron 可执行文件:', electronExe);
  process.exit(1);
}

console.log('启动:', electronExe, '(清理 ELECTRON_RUN_AS_NODE)');

const child = spawn(electronExe, ['.'], {
  env,
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  windowsHide: false
});

child.on('exit', (code) => process.exit(code || 0));
process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
