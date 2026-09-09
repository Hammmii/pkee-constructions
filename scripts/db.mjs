#!/usr/bin/env node
/**
 * Project-local Postgres for development — no system install required.
 * Data lives in ./pgdata (gitignored); binaries ship in
 * @embedded-postgres/<platform>. We drive pg_ctl directly (the
 * embedded-postgres JS start() hangs on Node 25).
 *
 * Auth: password is supplied via the PGPASSWORD env var (set it in your
 * untracked .env). Never hard-code or commit credentials.
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
const password = process.env.PGPASSWORD;

const run = (args, opts = {}) =>
  spawnSync(pgCtl, args, {
    stdio: "inherit",
    env: { ...process.env, ...(password ? { PGPASSWORD: password } : {}) },
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
      if (!password) {
        console.error("PGPASSWORD env var is required to initialise the cluster.");
        process.exit(1);
      }
      execFileSync(
        path.join(binDir, "initdb"),
        ["-D", dataDir, "-U", "postgres", "--pwfile=/dev/stdin"],
        {
          stdio: ["pipe", "inherit", "inherit"],
          input: `${password}\n`,
        },
      );
      console.log("Cluster initialised.");
    }
    run(["-D", dataDir, "-l", path.join(dataDir, "server.log"), "-o", `-p ${port}`, "-w", "start"]);
    // ensure the app database exists (pg client ships with @payloadcms/db-postgres)
    if (password) {
      try {
        const { Client } = await import("pg");
        const client = new Client({
          host: "127.0.0.1",
          port: Number(port),
          user: "postgres",
          password,
        });
        await client.connect();
        await client.query("CREATE DATABASE pkee").catch(() => {});
        await client.end();
      } catch {
        /* database already exists or pg unavailable — dev server will surface it */
      }
    }
    console.log("Postgres ready on 127.0.0.1:%s (data: %s)", port, dataDir);
    console.log(
      "DATABASE_URL=postgres://127.0.0.1:%s/pkee  (credentials via PGPASSWORD env)",
      port,
    );
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
