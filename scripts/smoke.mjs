// Production smoke test for the built site in dist/.
//
// Serves dist/ with Node's built-in http server (no dependencies), then checks
// that the app shell, PWA manifest, service worker, icons and lazy chunks are
// all present and reachable - i.e. everything needed for an offline install.
//
// Usage: npm run build && npm run smoke
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");

if (!existsSync(root)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (path === "/" || path.endsWith("/")) path += "index.html";
    const filePath = normalize(join(root, path));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    const info = await stat(filePath).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404).end("not found");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath)] || "application/octet-stream",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const failures = [];
const results = [];

async function check(path, { expectType, mustContain, optional } = {}) {
  let res;
  try {
    res = await fetch(base + path);
  } catch (err) {
    if (optional) return null;
    failures.push(`${path} -> request failed: ${err.message}`);
    return null;
  }
  if (res.status !== 200) {
    if (optional && res.status === 404) return null;
    failures.push(`${path} -> HTTP ${res.status}`);
    return null;
  }
  const type = res.headers.get("content-type") || "";
  if (expectType && !type.includes(expectType)) {
    failures.push(`${path} -> content-type "${type}" missing "${expectType}"`);
  }
  const text = await res.text();
  if (mustContain && !text.includes(mustContain)) {
    failures.push(`${path} -> does not contain "${mustContain}"`);
  }
  results.push(`${path} -> 200 ${type}`);
  return text;
}

// Core shell + PWA assets.
const indexHtml = await check("/", { expectType: "text/html", mustContain: 'id="root"' });
await check("/index.html", { expectType: "text/html" });
await check("/favicon.svg", { expectType: "svg" });
await check("/manifest.webmanifest", { expectType: "manifest+json" });
await check("/icons/icon-192.png", { expectType: "image/png" });
await check("/icons/icon-512.png", { expectType: "image/png" });
await check("/icons/icon-maskable-512.png", { expectType: "image/png" });
await check("/icons/apple-touch-icon.png", { expectType: "image/png" });

// Service worker + registration.
const sw = await check("/sw.js", { mustContain: "precache" });
await check("/registerSW.js", { optional: true });

// Sanity-check the manifest structure.
try {
  const manifest = JSON.parse(await readFile(join(root, "manifest.webmanifest"), "utf8"));
  for (const key of ["name", "short_name", "start_url", "display", "icons"]) {
    if (!(key in manifest)) failures.push(`manifest.webmanifest missing "${key}"`);
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
    failures.push("manifest.webmanifest should declare at least 2 icons");
  }
} catch (err) {
  failures.push(`manifest.webmanifest is not valid JSON: ${err.message}`);
}

// Confirm the lazy WebLLM runtime + worker chunk are precached for offline AI.
if (sw) {
  for (const needle of ["index.html", "webllm", "worker"]) {
    if (!sw.includes(needle)) {
      failures.push(`sw.js precache does not reference "${needle}"`);
    }
  }
}

// Every script/link referenced by index.html must resolve (no broken bundles).
if (indexHtml) {
  const refs = [
    ...indexHtml.matchAll(/(?:src|href)="(\/[^"]+)"/g),
  ].map((m) => m[1]);
  for (const ref of new Set(refs)) {
    if (/\.(js|css)$/.test(ref)) await check(ref);
  }
  if (/https?:\/\//.test(indexHtml.replace(/https?:\/\/www\.w3\.org[^"]*/g, ""))) {
    failures.push("index.html references an external origin (expected none)");
  }
}

server.close();

console.log("Smoke test results:");
for (const line of results) console.log("  ok  " + line);

if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error("  x   " + f);
  process.exit(1);
}
console.log(`\nAll checks passed (${results.length} requests).`);
