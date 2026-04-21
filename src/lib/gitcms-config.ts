import { Octokit } from "@octokit/rest";
import type { GitCMSConfig } from "./types";

export const CONFIG_PATH = ".gitcms/config.json";

export function defaultConfig(template: string): GitCMSConfig {
  return {
    version: 1,
    template,
    contentTypes: ["posts", "pages"],
    createdAt: new Date().toISOString(),
  };
}

export async function hasConfig(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<boolean> {
  try {
    await octokit.repos.getContent({ owner, repo, path: CONFIG_PATH });
    return true;
  } catch (err) {
    // Only "not found" means no config. Any other failure (401, 5xx) should
    // propagate so the dashboard doesn't silently hide repos on a transient error.
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 404
    ) {
      return false;
    }
    throw err;
  }
}
