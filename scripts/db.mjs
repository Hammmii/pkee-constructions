#!/usr/bin/env node
/**
 * Project-local Postgres for development — no system install required.
 * Data lives in ./pgdata (gitignored); binaries ship in
 * @embedded-postgres/darwin-arm64. We drive pg_ctl directly (the
 * embedded-postgres JS start() hangs on Node 25).
 *
 * Usage: node scripts/db.mjs start | stop | status
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "pgdata");
const binDir = path.join(
  root,
  "node_modules",
  "@embedded-postgres",
  `${process.platform}-${process.arch}`,
  "native",
  "bin",
);
const pgCtl = path.join(binDir, "pg_ctl");
const port = process.env.PGPORT || "5432";

const run = (args, opts = {}) =>
  spawnSync(pgCtl, args, {
    stdio: "inherit",
    env: { ...process.env, PGPASSWORD: "postgres" },
    ...opts,
  });

const isRunning = () => {
  try {
    execFileSync(pgCtl, ["-D", dataDir, "status"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
};

const command = process.argv[2];

switch (command) {
  case "start": {
    if (isRunning()) {
      console.log("Postgres already running on 127.0.0.1:%s", port);
      break;
    }
    if (!fs.existsSync(dataDir)) {
      execFileSync(
        path.join(binDir, "initdb"),
        ["-D", dataDir, "-U", "postgres", "--pwfile=/dev/stdin"],
        {
          stdio: ["pipe", "inherit", "inherit"],
          input: "postgres\n",
        },
      );
      console.log("Cluster initialised.");
    }
    run(["-D", dataDir, "-l", path.join(dataDir, "server.log"), "-o", `-p ${port}`, "-w", "start"]);
    // ensure the app database exists
    try {
      execFileSync(
        path.join(binDir, "createdb"),
        ["-h", "127.0.0.1", "-p", port, "-U", "postgres", "pkee"],
        {
          stdio: "pipe",
          env: { ...process.env, PGPASSWORD: "postgres" },
        },
      );
    } catch {
      /* database already exists */
    }
    console.log("Postgres ready on 127.0.0.1:%s (data: %s)", port, dataDir);
    console.log("DATABASE_URL=postgres://127.0.0.1:%s/pkee", port);
    break;
  }
  case "stop": {
    if (!isRunning()) {
      console.log("Nothing to stop.");
      break;
    }
    run(["-D", dataDir, "-m", "fast", "stop"]);
    console.log("Postgres stopped.");
    break;
  }
  case "status": {
    console.log(isRunning() ? "running" : "stopped");
    break;
  }
  default:
    console.log("Usage: node scripts/db.mjs start|stop|status");
    process.exit(1);
}
