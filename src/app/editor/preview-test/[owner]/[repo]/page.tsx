"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import PreviewPane from "@/components/PreviewPane";

// Temporary route for testing WebContainer boot in isolation. Task 7 will
// inline PreviewPane into /editor/[type]/[slug] and delete this page.
export default function PreviewTestPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status !== "authenticated") return null;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900">
            WebContainer preview — {owner}/{repo}
          </h1>
          <p className="text-sm text-gray-500">
            Standalone boot test. Expect ~30–60s on first install.
          </p>
        </div>
        <div className="h-[75vh]">
          <PreviewPane owner={owner} repo={repo} />
        </div>
      </div>
    </>
  );
}
