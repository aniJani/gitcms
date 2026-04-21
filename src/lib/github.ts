import { Octokit } from "@octokit/rest";
import { ContentItem, RepoInfo, GitHubFileInfo, TemplateFile } from "./types";
import { hasConfig } from "./gitcms-config";

// Repos named any of these are never shown as connectable sites, even if
// they happen to contain a .gitcms/config.json. Belt-and-braces against
// pointing GitCMS at its own source.
const DENYLIST = new Set(["gitcms"]);

export function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function listUserRepos(
  octokit: Octokit
): Promise<RepoInfo[]> {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 50,
  });

  return data.map((repo) => ({
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    url: repo.html_url,
    defaultBranch: repo.default_branch,
  }));
}

export async function listConnectedRepos(
  octokit: Octokit,
): Promise<RepoInfo[]> {
  const all = await listUserRepos(octokit);
  const candidates = all.filter((r) => !DENYLIST.has(r.name.toLowerCase()));

  const checks = await Promise.allSettled(
    candidates.map((r) => hasConfig(octokit, r.owner, r.name)),
  );

  return candidates.filter((_, i) => {
    const result = checks[i];
    return result.status === "fulfilled" && result.value === true;
  });
}

export async function listContentByType(
  octokit: Octokit,
  owner: string,
  repo: string,
  type: string
): Promise<GitHubFileInfo[]> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: `content/${type}`,
    });

    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item.name.endsWith(".json"))
      .map((item) => ({
        name: item.name.replace(".json", ""),
        path: item.path,
        sha: item.sha,
        size: item.size ?? 0,
        type: item.type as "file" | "dir",
      }));
  } catch {
    return [];
  }
}

export async function getContentItem(
  octokit: Octokit,
  owner: string,
  repo: string,
  type: string,
  slug: string
): Promise<ContentItem | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: `content/${type}/${slug}.json`,
    });

    if (Array.isArray(data) || data.type !== "file") return null;

    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = JSON.parse(content);

    return {
      ...parsed,
      slug,
      type,
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

export async function saveContentItem(
  octokit: Octokit,
  owner: string,
  repo: string,
  item: ContentItem
): Promise<{ success: boolean; sha?: string }> {
  const path = `content/${item.type}/${item.slug}.json`;

  const contentToSave = {
    title: item.title,
    body: item.body,
    excerpt: item.excerpt || "",
    coverImage: item.coverImage || "",
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: new Date().toISOString(),
    author: item.author || "",
  };

  const encodedContent = Buffer.from(
    JSON.stringify(contentToSave, null, 2)
  ).toString("base64");

  try {
    // If we have a SHA, this is an update
    const params: any = {
      owner,
      repo,
      path,
      message: `Update ${item.type}: ${item.title}`,
      content: encodedContent,
    };

    if (item.sha) {
      params.sha = item.sha;
    } else {
      params.message = `Create ${item.type}: ${item.title}`;
    }

    const { data } = await octokit.repos.createOrUpdateFileContents(params);

    return { success: true, sha: data.content?.sha };
  } catch (error) {
    console.error("Failed to save content:", error);
    return { success: false };
  }
}

export async function createRepoWithTemplate(
  octokit: Octokit,
  opts: {
    name: string;
    description?: string;
    private?: boolean;
    files: TemplateFile[];
  },
): Promise<RepoInfo> {
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;

  // auto_init=true is required: the Git Data API (createBlob etc.) 409s on a
  // repo with no commits, so we let GitHub create the initial README commit,
  // then chain our scaffold commit as its child and fast-forward the branch.
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name: opts.name,
    description: opts.description,
    private: opts.private ?? false,
    auto_init: true,
  });

  const branch = repo.default_branch;

  // Brief retry on getRef: GitHub sometimes returns 404 for a beat after
  // auto_init before the ref is readable.
  let parentSha: string | null = null;
  for (let attempt = 0; attempt < 5 && !parentSha; attempt++) {
    try {
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo: opts.name,
        ref: `heads/${branch}`,
      });
      parentSha = ref.object.sha;
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status?: number }).status
          : undefined;
      if (status !== 404) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  if (!parentSha) {
    throw new Error("Timed out waiting for initial commit after auto_init");
  }

  const blobs = await Promise.all(
    opts.files.map(async (f) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo: opts.name,
        content: Buffer.from(f.content, "utf-8").toString("base64"),
        encoding: "base64",
      });
      return { path: f.path, sha: data.sha };
    }),
  );

  // Building the tree without base_tree means our scaffold fully replaces the
  // auto-init README — the user sees exactly the template layout at HEAD.
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo: opts.name,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644",
      type: "blob",
      sha: b.sha,
    })),
  });

  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo: opts.name,
    message: "Scaffold site from GitCMS template",
    tree: tree.sha,
    parents: [parentSha],
  });

  await octokit.git.updateRef({
    owner,
    repo: opts.name,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });

  return {
    owner,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    url: repo.html_url,
    defaultBranch: branch,
  };
}

export async function getRawFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(data) || data.type !== "file") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export async function deleteContentItem(
  octokit: Octokit,
  owner: string,
  repo: string,
  type: string,
  slug: string,
  sha: string
): Promise<boolean> {
  try {
    await octokit.repos.deleteFile({
      owner,
      repo,
      path: `content/${type}/${slug}.json`,
      message: `Delete ${type}: ${slug}`,
      sha,
    });
    return true;
  } catch {
    return false;
  }
}
