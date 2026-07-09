// Personalized graph synthesis — "Mode B".
// ---------------------------------------------------------------------------
// Instagram private accounts expose their profile HEADER (photo, name, bio,
// follower/following/post COUNTS, verified) but never their edges. So we place
// the REAL, ingested profile at the centre and model a representative network
// around it, scaled and shaped by those real numbers.
//
// The neighbours are intentionally ANONYMOUS / stylized — we never invent fake
// identities. The graph is deterministic per handle (seeded RNG), so the same
// handle always yields the same network — it feels stable and real, and the
// friend-recommendation algorithm has a genuine 2-hop structure to run on.

import { SocialGraph } from "./graph";

export interface InstagramProfile {
  handle: string;
  fullName: string;
  biography: string;
  followers: number;
  following: number;
  posts: number;
  verified: boolean;
  isPrivate: boolean;
  avatarUrl: string | null;
  /** "apify" for live ingest, "modeled" when the client had to synthesize it. */
  source: "apify" | "modeled";
}

export type Archetype = "Creator" | "Connector" | "Explorer";

export interface PersonalizedGraph {
  graph: SocialGraph;
  centerId: string;
  archetype: Archetype;
  ratio: number;
  seedHex: string;
  visibleNodes: number;
  visibleEdges: number;
}

// --- deterministic RNG (mulberry32) ----------------------------------------
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function classify(followers: number, following: number): { ratio: number; archetype: Archetype } {
  const ratio = following > 0 ? followers / following : followers;
  const archetype: Archetype = ratio > 5 ? "Creator" : ratio < 0.6 ? "Explorer" : "Connector";
  return { ratio, archetype };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Build a representative, deterministic network for a real profile.
 * Node counts are derived (log-scaled) from the real follower/following counts
 * so the shape reflects the account without trying to render thousands of dots.
 */
export function buildPersonalizedGraph(profile: InstagramProfile): PersonalizedGraph {
  const seed = hashSeed(profile.handle.toLowerCase());
  const rand = mulberry32(seed);
  const { ratio, archetype } = classify(profile.followers, profile.following);

  const graph = new SocialGraph();

  // --- centre: the real, ingested profile ---
  const center = graph.addUser(profile.fullName || profile.handle, {
    handle: profile.handle,
    avatarUrl: profile.avatarUrl,
    verified: profile.verified,
    isCenter: true,
  });

  // --- direct connections (distance 1): log-scaled from `following` ---
  const directCount = Math.round(
    clamp(6 + Math.log10(Math.max(1, profile.following)) * 4, 6, 18)
  );

  // Archetype tunes topology:
  //  Creator   -> hub-like, sparse mutuals among followers
  //  Connector -> dense, lots of triangles (mutual friends)
  //  Explorer  -> broad reach, more second-degree spread
  const mutualDensity =
    archetype === "Connector" ? 0.55 : archetype === "Creator" ? 0.25 : 0.4;
  const fofPerDirect =
    archetype === "Explorer" ? 3 : archetype === "Connector" ? 2 : 2;

  const directIds: string[] = [];
  for (let i = 0; i < directCount; i++) {
    const u = graph.addUser(`Connection ${i + 1}`, { stylized: true });
    graph.addFriendship(center.id, u.id);
    directIds.push(u.id);
  }

  // Interconnect direct friends into triangles (creates mutual-friend signal).
  for (let i = 0; i < directIds.length; i++) {
    for (let j = i + 1; j < directIds.length; j++) {
      if (rand() < mutualDensity * 0.4) {
        graph.addFriendship(directIds[i], directIds[j]);
      }
    }
  }

  // --- second-degree nodes (distance 2): these become recommendations ---
  // A shared pool of "friend-of-friend" nodes, each linked to a few direct
  // friends so the ranking-by-mutual-count produces a meaningful ordering.
  const fofCount = Math.round(
    clamp(directCount * fofPerDirect, 8, 42)
  );
  const fofIds: string[] = [];
  for (let i = 0; i < fofCount; i++) {
    const u = graph.addUser(`Suggested ${i + 1}`, { stylized: true });
    fofIds.push(u.id);
  }

  // Wire second-degree nodes to a random subset of direct friends. Nodes that
  // happen to connect to MORE direct friends will rank higher as recommendations
  // — exactly what the mutual-friend algorithm rewards.
  for (const fof of fofIds) {
    const links = 1 + Math.floor(rand() * Math.min(4, directIds.length));
    const shuffled = [...directIds].sort(() => rand() - 0.5).slice(0, links);
    for (const d of shuffled) graph.addFriendship(d, fof);
    // Occasionally connect second-degree nodes to each other for texture.
    if (rand() < 0.2 && fofIds.length > 1) {
      const other = fofIds[Math.floor(rand() * fofIds.length)];
      if (other !== fof) graph.addFriendship(fof, other);
    }
  }

  const size = graph.getSize();
  return {
    graph,
    centerId: center.id,
    archetype,
    ratio,
    seedHex: "0x" + seed.toString(16).slice(0, 6),
    visibleNodes: size.users,
    visibleEdges: size.edges,
  };
}

// ---------------------------------------------------------------------------
// Client-side fallback: if the live Apify ingest fails (network, rate limit,
// nonexistent handle), synthesize a plausible, deterministic profile from the
// handle so the demo NEVER dies. Clearly marked source: "modeled".
// ---------------------------------------------------------------------------
export function synthesizeProfile(rawHandle: string): InstagramProfile {
  const handle = rawHandle.trim().replace(/^@/, "").toLowerCase() || "guest";
  const rand = mulberry32(hashSeed(handle));
  const followers = Math.round(120 + rand() * 4800);
  const following = Math.round(80 + rand() * 900);
  return {
    handle,
    fullName: handle
      .replace(/[._]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim(),
    biography: "",
    followers,
    following,
    posts: Math.round(10 + rand() * 300),
    verified: false,
    isPrivate: true,
    avatarUrl: null,
    source: "modeled",
  };
}
