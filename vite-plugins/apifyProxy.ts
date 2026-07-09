import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

/* ===========================================================================
 * SocialGraph — local "serverless" ingest endpoint.
 * ---------------------------------------------------------------------------
 * Exposes GET /api/profile?handle=<username> during `vite dev`. It calls an
 * Apify Instagram actor SERVER-SIDE (so the APIFY_TOKEN never reaches the
 * browser), normalizes the public profile header, and returns clean JSON.
 *
 * Everything it does is narrated to the terminal with a timestamped, colorized
 * trace — this is meant to be shown live: it proves the data is really being
 * pulled from Instagram via Apify, not faked in the browser.
 * ======================================================================== */

// --- tiny ANSI palette (no dependency) -------------------------------------
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function ts(): string {
  // HH:MM:SS.mmm — wall clock for the demo trace.
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(
    d.getMilliseconds(),
    3
  )}`;
}

type LineKind = "req" | "cfg" | "out" | "ok" | "info" | "warn" | "err" | "res";

const GLYPH: Record<LineKind, string> = {
  req: "→",
  cfg: "⚙",
  out: "↗",
  ok: "✓",
  info: "◆",
  warn: "▲",
  err: "✗",
  res: "←",
};

const COLOR: Record<LineKind, string> = {
  req: C.cyan,
  cfg: C.blue,
  out: C.blue,
  ok: C.green,
  info: C.magenta,
  warn: C.yellow,
  err: C.red,
  res: C.cyan,
};

function line(kind: LineKind, label: string, detail = ""): void {
  const g = `${COLOR[kind]}${GLYPH[kind]}${C.reset}`;
  const lbl = `${COLOR[kind]}${label.padEnd(16)}${C.reset}`;
  // eslint-disable-next-line no-console
  console.log(`${C.gray}${ts()}${C.reset}  ${g}  ${lbl}${C.dim}${detail}${C.reset}`);
}

function banner(subtitle: string): void {
  const w = 60;
  const top = "╭" + "─".repeat(w) + "╮";
  const bot = "╰" + "─".repeat(w) + "╯";
  const title = `  ⬡ SOCIALGRAPH ENGINE ${C.dim}· ${subtitle}${C.reset}`;
  // eslint-disable-next-line no-console
  console.log(`\n${C.cyan}${top}${C.reset}`);
  // eslint-disable-next-line no-console
  console.log(`${C.cyan}│${C.reset}${C.bold}${title}${C.reset}`);
  // eslint-disable-next-line no-console
  console.log(`${C.cyan}${bot}${C.reset}`);
}

// --- helpers ---------------------------------------------------------------

// Accepts "@handle", "handle", or a full instagram.com/handle URL.
function cleanHandle(raw: string): string {
  let h = (raw || "").trim();
  const urlMatch = h.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (urlMatch) h = urlMatch[1];
  h = h.replace(/^@/, "").replace(/\/+$/, "");
  return h;
}

function firstDefined<T>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null) return v as T;
  return undefined;
}

interface NormalizedProfile {
  handle: string;
  fullName: string;
  biography: string;
  followers: number;
  following: number;
  posts: number;
  verified: boolean;
  isPrivate: boolean;
  avatarUrl: string | null;
  source: "apify";
}

// Map whatever field shape the actor returns into our normalized profile.
function normalize(handle: string, item: Record<string, unknown>): NormalizedProfile {
  const num = (v: unknown): number => {
    const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? n : 0;
  };
  const edge = (v: unknown): number | undefined =>
    v && typeof v === "object" && "count" in (v as object)
      ? num((v as { count: unknown }).count)
      : undefined;

  return {
    handle,
    fullName:
      (firstDefined(item.fullName, item.full_name, item.name) as string) || handle,
    biography: (firstDefined(item.biography, item.bio) as string) || "",
    followers: num(
      firstDefined(item.followersCount, item.followers, edge(item.edge_followed_by))
    ),
    following: num(
      firstDefined(
        item.followsCount,
        item.followingCount,
        item.follows,
        edge(item.edge_follow)
      )
    ),
    posts: num(
      firstDefined(
        item.postsCount,
        item.postsCount,
        edge(item.edge_owner_to_timeline_media)
      )
    ),
    verified: Boolean(firstDefined(item.verified, item.is_verified, false)),
    isPrivate: Boolean(firstDefined(item.private, item.is_private, false)),
    avatarUrl:
      (firstDefined(
        item.profilePicUrlHD,
        item.profilePicUrl,
        item.profile_pic_url_hd,
        item.profile_pic_url
      ) as string) || null,
    source: "apify",
  };
}

// --- the actor call --------------------------------------------------------

async function fetchFromApify(
  handle: string,
  token: string,
  actor: string
): Promise<NormalizedProfile> {
  const actorPath = actor.replace("/", "~"); // apify/x -> apify~x for the URL
  const url = `https://api.apify.com/v2/acts/${actorPath}/run-sync-get-dataset-items?token=${token}`;

  const input = {
    usernames: [handle],
    // Fallbacks for actors that key off URLs instead of usernames:
    directUrls: [`https://www.instagram.com/${handle}/`],
    resultsType: "details",
    resultsLimit: 1,
  };

  line("out", "dispatch", `run-sync-get-dataset-items · actor=${actor}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const ms = Date.now() - started;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      line("err", "actor.http", `${res.status} ${res.statusText} · ${ms}ms`);
      throw new Error(`Apify actor returned ${res.status}: ${body.slice(0, 200)}`);
    }
    const items = (await res.json()) as Record<string, unknown>[];
    line("ok", "actor.finished", `${ms}ms · ${items.length} item(s)`);
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Actor returned no items (profile may not exist).");
    }
    return normalize(handle, items[0]);
  } finally {
    clearTimeout(timeout);
  }
}

// --- request body / response helpers ---------------------------------------

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(body);
  const kb = (Buffer.byteLength(body) / 1024).toFixed(1);
  line(
    status < 400 ? "res" : "err",
    `response ${status}`,
    `${kb}kb`
  );
}

export function apifyProxy(env: Record<string, string>): Plugin {
  const token = env.APIFY_TOKEN || env.VITE_APIFY_TOKEN || "";
  const actor = env.APIFY_ACTOR || "apify/instagram-profile-scraper";

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const started = Date.now();
    const url = new URL(req.url || "", "http://localhost");
    const rawHandle = url.searchParams.get("handle") || "";
    const handle = cleanHandle(rawHandle);

    banner("live profile ingest");
    line("req", "request", `handle=@${handle || "(empty)"}`);

    if (!handle) {
      line("warn", "validation", "missing or invalid handle");
      return sendJson(res, 400, { error: "Missing ?handle= parameter." });
    }
    if (!token) {
      line("err", "config", "APIFY_TOKEN not set in .env — cannot reach Apify");
      return sendJson(res, 500, {
        error: "Server missing APIFY_TOKEN. Add it to .env and restart.",
      });
    }

    line("cfg", "apify.actor", actor);

    try {
      const profile = await fetchFromApify(handle, token, actor);

      const ratio = profile.following > 0 ? profile.followers / profile.following : profile.followers;
      const archetype =
        ratio > 5 ? "Creator" : ratio < 0.6 ? "Explorer" : "Connector";

      line(
        "info",
        "profile",
        `${profile.fullName} · @${profile.handle} · ${profile.isPrivate ? "🔒 private" : "🌐 public"}${profile.verified ? " · ✔ verified" : ""}`
      );
      line(
        "info",
        "metrics",
        `followers=${profile.followers} following=${profile.following} posts=${profile.posts}`
      );
      line("info", "archetype", `${archetype} (ratio ${ratio.toFixed(2)})`);

      // Route the avatar through our own /api/avatar so the browser loads it
      // same-origin — Instagram's CDN blocks hotlinked <img>/<image> requests.
      const proxiedAvatar = profile.avatarUrl
        ? `/api/avatar?url=${encodeURIComponent(profile.avatarUrl)}`
        : null;

      sendJson(res, 200, {
        profile: { ...profile, avatarUrl: proxiedAvatar },
        derived: { ratio, archetype },
        elapsedMs: Date.now() - started,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      line("err", "ingest.failed", msg);
      line("warn", "fallback", "client will synthesize a modeled profile");
      sendJson(res, 502, { error: msg });
    }
  };

  // --- avatar image proxy ---------------------------------------------------
  // Streams an Instagram CDN image back through our own origin so the browser
  // isn't blocked by the CDN's hotlink/referrer protection. SSRF-guarded to
  // Instagram / Facebook CDN hosts only.
  const avatarHandler = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "", "http://localhost");
    const target = url.searchParams.get("url") || "";
    const allowed = /^https:\/\/[a-z0-9.-]*(cdninstagram\.com|fbcdn\.net)\//i.test(target);
    if (!allowed) {
      res.statusCode = 400;
      res.end("Invalid or disallowed image url.");
      return;
    }
    try {
      const upstream = await fetch(target); // server-side: no hotlink block
      if (!upstream.ok) {
        line("warn", "avatar.http", `${upstream.status} upstream`);
        res.statusCode = upstream.status;
        res.end("Upstream image error.");
        return;
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = 200;
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.end(buf);
      line("ok", "avatar.proxy", `${(buf.length / 1024).toFixed(1)}kb`);
    } catch (e) {
      line("err", "avatar.failed", e instanceof Error ? e.message : String(e));
      res.statusCode = 502;
      res.end("Image fetch failed.");
    }
  };

  const mount = (server: { middlewares: { use: (path: string, fn: (req: IncomingMessage, res: ServerResponse) => void) => void } }) => {
    server.middlewares.use("/api/profile", (req, res) => {
      handler(req, res).catch((e) => {
        line("err", "unhandled", e instanceof Error ? e.message : String(e));
        if (!res.headersSent) sendJson(res, 500, { error: "Internal error." });
      });
    });
    server.middlewares.use("/api/avatar", (req, res) => {
      avatarHandler(req, res).catch((e) => {
        line("err", "unhandled", e instanceof Error ? e.message : String(e));
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal error.");
        }
      });
    });
  };

  return {
    name: "socialgraph-apify-proxy",
    configureServer(server) {
      mount(server);
      if (!token) {
        // eslint-disable-next-line no-console
        console.log(
          `${C.yellow}⚠ SocialGraph: APIFY_TOKEN not found in .env — /api/profile will return 500 until you add it.${C.reset}`
        );
      }
    },
    // Mirror the endpoints for `vite preview` so a production preview demo works too.
    configurePreviewServer(server) {
      mount(server);
    },
  };
}
