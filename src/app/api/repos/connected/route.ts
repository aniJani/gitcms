import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOctokit, listConnectedRepos } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const octokit = createOctokit(token);
    const repos = await listConnectedRepos(octokit);
    return NextResponse.json(repos);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list repos";
    console.error("listConnectedRepos failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
