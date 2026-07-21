import { spawn } from 'node:child_process';
import { join } from 'node:path';

const command = process.argv[2] === 'start' ? 'start' : 'dev';
const pythonCommand = process.env.PYTHON || (process.platform === 'win32' ? 'python.exe' : 'python3');
const nextCli = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

const flask = spawn(pythonCommand, ['app.py'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '8080' },
});

// Calling the installed CLI with Node works on Windows without spawning npx.cmd,
// which Node 24 rejects with EINVAL when shell mode is disabled.
const next = spawn(process.execPath, [nextCli, command, '-p', '3000'], {
  stdio: 'inherit',
  env: { ...process.env, ARETE_SAPIENS_ORIGIN: 'http://127.0.0.1:8080' },
});

function stop(exitCode = 0) {
  flask.kill();
  next.kill();
  process.exit(exitCode);
}

flask.on('error', (error) => {
  console.error(`Could not start the Python service (${pythonCommand}): ${error.message}`);
  console.error('Install Python 3.11+ and project requirements, or set PYTHON to its executable path.');
  stop(1);
});

next.on('error', (error) => {
  console.error(`Could not start Next.js: ${error.message}`);
  stop(1);
});

flask.on('exit', (code) => {
  if (code && !next.killed) stop(code);
});

next.on('exit', (code) => {
  if (code && !flask.killed) stop(code);
});

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
