/**
 * Get the repo the crew will read: a shallow clone of the last commit into a
 * temp folder. Cloning means the researcher sees only committed files, so a
 * local .env, untracked notes or build output never reach it.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const git = promisify(execFile);

export interface Source {
  dir: string;
  name: string;
  /** Public https URL of the repo on GitHub, or null if it has none. */
  repoUrl: string | null;
  commit: string;
  cleanup(): Promise<void>;
}

const GITHUB = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;

export async function prepareSource(target: string): Promise<Source> {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "launch-crew-src-"));
  const dir = path.join(tmp, "repo");
  const cleanup = () => rm(tmp, { recursive: true, force: true });
  try {
    let repoUrl: string | null;
    if (GITHUB.test(target)) {
      repoUrl = publicRepoUrl(target);
      await git("git", ["clone", "--quiet", "--depth", "1", target, dir]);
    } else {
      const abs = path.resolve(target);
      if (!existsSync(abs)) throw new Error(`no such folder: ${target}`);
      const top = (await git("git", ["-C", abs, "rev-parse", "--show-toplevel"])).stdout.trim();
      const origin = await git("git", ["-C", top, "remote", "get-url", "origin"]).then((r) => r.stdout.trim(), () => "");
      repoUrl = publicRepoUrl(origin);
      await git("git", ["clone", "--quiet", "--depth", "1", `file://${top}`, dir]);
    }
    const commit = (await git("git", ["-C", dir, "rev-parse", "--short", "HEAD"])).stdout.trim();
    // The researcher reads files, not history.
    await rm(path.join(dir, ".git"), { recursive: true, force: true });
    const name = repoUrl ? repoUrl.split("/").pop()! : path.basename(path.resolve(target));
    return { dir, name, repoUrl, commit, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}

/**
 * The repo's public URL, or null. Remotes can carry credentials
 * (https://user:token@github.com/...) or be SSH; only owner and name are kept.
 */
export function publicRepoUrl(remote: string): string | null {
  const ssh = remote.match(/^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (ssh) return `https://github.com/${ssh[1]}/${ssh[2]}`;
  let u: URL;
  try {
    u = new URL(remote);
  } catch {
    return null;
  }
  if (u.hostname !== "github.com") return null;
  const m = u.pathname.match(/^\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  return m ? `https://github.com/${m[1]}/${m[2]}` : null;
}
