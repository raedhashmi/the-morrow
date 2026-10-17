// Production entry: `npm start -- --port 3010`
// Loads .env from the project root, honours --port/-p, then boots the standalone server.
import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

const root = path.resolve(import.meta.dirname, "..");
config({ path: path.join(root, ".env"), quiet: true });

const args = process.argv.slice(2);
const i = args.findIndex((a) => a === "--port" || a === "-p");
if (i >= 0 && args[i + 1]) process.env.PORT = args[i + 1];
process.env.PORT ||= "3010";
process.env.HOSTNAME ||= "127.0.0.1";
process.env.NODE_ENV = "production";

const server = path.join(root, ".next/standalone/server.js");
if (!existsSync(server)) {
  console.error("No build found — run `npm run build` first.");
  process.exit(1);
}
console.log(`The Morrow starting on http://${process.env.HOSTNAME}:${process.env.PORT}`);
await import(server);
