import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOctokit, createRepoWithTemplate } from "@/lib/github";
import { loadTemplate } from "@/lib/scaffold";
import { CONFIG_PATH, defaultConfig } from "@/lib/gitcms-config";

const REPO_NAME_RE = /^[a-zA-Z0-9._-]+$/;

function validateName(name: string): string | null {
  if (!REPO_NAME_RE.test(name)) return "Only letters, digits, . _ - allowed";
  if (name.length > 100) return "Name must be 100 characters or fewer";
  if (/^[.-]/.test(name)) return "Name may not start with . or -";
  if (/\.git$/i.test(name)) return "Name may not end with .git";
  if (name === "." || name === "..") return "Invalid name";
  return null;
}

function statusCode(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; description?: string; private?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const nameError = validateName(body.name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const octokit = createOctokit(token);

  const config = defaultConfig("next-blog");
  const files = [
    ...loadTemplate(),
    { path: CONFIG_PATH, content: JSON.stringify(config, null, 2) + "\n" },
  ];

  try {
    const repo = await createRepoWithTemplate(octokit, {
      name: body.name,
      description: body.description ?? "Site scaffolded by GitCMS",
      private: body.private ?? false,
      files,
    });
    return NextResponse.json(repo);
  } catch (err) {
    const status = statusCode(err);
    if (status === 422) {
      return NextResponse.json(
        { error: "A repository with that name already exists" },
        { status: 409 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to scaffold repo";
    // Known limitation: if blob/tree/commit/ref creation fails mid-flight, the
    // empty repo is left behind. Rollback requires the `delete_repo` OAuth scope
    // which we haven't widened to yet. Surface clearly in logs so users can clean up.
    console.error("scaffold failed (repo may be orphaned):", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
