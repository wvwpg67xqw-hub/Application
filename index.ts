import { spawn, execSync, type ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const COLORS = {
  api: "\x1b[36m",
  web: "\x1b[35m",
};

function prefix(label: keyof typeof COLORS, line: string): string {
  return `${BOLD}${COLORS[label]}[${label}]${RESET} ${line}`;
}

function installDeps(label: keyof typeof COLORS, cwd: string): void {
  const fullCwd = path.join(__dirname, cwd);
  process.stdout.write(prefix(label, `Installing dependencies in ${cwd}...\n`));
  try {
    execSync("npm install", { cwd: fullCwd, stdio: "inherit" });
    process.stdout.write(prefix(label, `Dependencies installed.\n`));
  } catch (err) {
    process.stderr.write(prefix(label, `npm install failed: ${err}\n`));
    process.exit(1);
  }
}

function spawnService(label: keyof typeof COLORS, cwd: string, script: string): ChildProcess {
  const proc = spawn("npm", ["run", script], {
    cwd: path.join(__dirname, cwd),
    shell: true,
    env: { ...process.env },
  });

  proc.stdout?.on("data", (data: Buffer) => {
    data.toString().split("\n").filter(Boolean).forEach((line) => {
      process.stdout.write(prefix(label, line) + "\n");
    });
  });

  proc.stderr?.on("data", (data: Buffer) => {
    data.toString().split("\n").filter(Boolean).forEach((line) => {
      process.stderr.write(prefix(label, line) + "\n");
    });
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(prefix(label, `exited with code ${code}`));
    }
  });

  return proc;
}

console.log(`${BOLD}Starting Plain Promotions Staff App...${RESET}\n`);

installDeps("api", "artifacts/api-server");
installDeps("web", "artifacts/staff-app");

const api = spawnService("api", "artifacts/api-server", "dev");
const web = spawnService("web", "artifacts/staff-app", "dev");

function shutdown() {
  console.log("\nShutting down...");
  api.kill("SIGTERM");
  web.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
