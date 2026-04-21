import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createOctokit,
  listContentByType,
  getRawFile,
} from "@/lib/github";
import { loadTemplate } from "@/lib/scaffold";
import { buildTree, type FileEntry } from "@/lib/bundle";

export const dynamic = "force-dynamic";

const CONTENT_TYPES = ["posts", "pages"] as const;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo" },
      { status: 400 },
    );
  }

  try {
    const octokit = createOctokit(token);

    // Template files are the baseline; user content overlays any colliding paths
    // so the user's committed JSON wins over the template's sample post.
    const files = new Map<string, string>();
    for (const f of loadTemplate()) {
      files.set(f.path, f.content);
    }

    for (const type of CONTENT_TYPES) {
      const items = await listContentByType(octokit, owner, repo, type);
      const contents = await Promise.all(
        items.map((item) => getRawFile(octokit, owner, repo, item.path)),
      );
      items.forEach((item, i) => {
        const content = contents[i];
        if (content !== null) files.set(item.path, content);
      });
    }

    const entries: FileEntry[] = Array.from(files, ([path, content]) => ({
      path,
      content,
    }));
    return NextResponse.json({ tree: buildTree(entries) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to build bundle";
    console.error("webcontainer-bundle failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
