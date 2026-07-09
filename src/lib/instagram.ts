// Frontend client for the local /api/profile ingest endpoint.
// Falls back to a modeled profile so the demo never hits a dead end.

import { InstagramProfile, synthesizeProfile } from "./personalizedGraph";

export interface IngestResult {
  profile: InstagramProfile;
  /** true when the profile came from the live Apify pull. */
  live: boolean;
  /** human-readable note for the UI when we had to fall back. */
  note?: string;
  elapsedMs: number;
}

export async function ingestProfile(rawHandle: string): Promise<IngestResult> {
  const started = performance.now();
  const handle = rawHandle.trim();

  try {
    const res = await fetch(`/api/profile?handle=${encodeURIComponent(handle)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.profile) {
      throw new Error(data?.error || `Ingest failed (${res.status})`);
    }

    return {
      profile: { ...data.profile, source: "apify" } as InstagramProfile,
      live: true,
      elapsedMs: Math.round(performance.now() - started),
    };
  } catch (err) {
    // Never fail the demo — model the profile locally instead.
    const note =
      err instanceof Error ? err.message : "Live ingest unavailable";
    return {
      profile: synthesizeProfile(handle),
      live: false,
      note,
      elapsedMs: Math.round(performance.now() - started),
    };
  }
}
