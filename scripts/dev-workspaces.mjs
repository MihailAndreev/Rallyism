import { spawn, spawnSync } from "node:child_process";

const workspaces = ["rallyism-web", "rallyism-mobile"];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const children = workspaces.map((workspace) => {
  const child = spawn(npmCommand, ["--workspace", workspace, "run", "dev"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => shutdown(signal ? 1 : code ?? 0));

  return child;
});

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (child.killed) {
      continue;
    }

    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
