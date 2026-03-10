"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Github } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">GitCMS</h1>
          <p className="mt-2 text-gray-600">
            Sign in with your GitHub account to manage your content
          </p>
        </div>
        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white transition hover:bg-gray-800"
        >
          <Github size={20} />
          Sign in with GitHub
        </button>
        <p className="text-center text-xs text-gray-500">
          GitCMS uses GitHub OAuth. We request access to your repositories to
          read and write content files.
        </p>
      </div>
    </div>
  );
}
