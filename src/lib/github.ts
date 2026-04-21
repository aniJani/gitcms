import { Octokit } from "@octokit/rest";
import { ContentItem, RepoInfo, GitHubFileInfo, TemplateFile } from "./types";

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

  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name: opts.name,
    description: opts.description,
    private: opts.private ?? false,
    auto_init: false,
  });

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
    message: "Initial commit: scaffolded by GitCMS",
    tree: tree.sha,
    parents: [],
  });

  // default_branch is always populated on the create response; honor it
  // rather than overriding with a hardcoded name.
  await octokit.git.createRef({
    owner,
    repo: opts.name,
    ref: `refs/heads/${repo.default_branch}`,
    sha: commit.sha,
  });

  return {
    owner,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    url: repo.html_url,
    defaultBranch: repo.default_branch,
  };
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
