"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  GitBranch,
  FileText,
  Plus,
  ChevronRight,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";
import type { RepoInfo, GitHubFileInfo } from "@/lib/types";

const CONTENT_TYPES = ["posts", "pages"];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoInfo | null>(null);
  const [contentItems, setContentItems] = useState<
    Record<string, GitHubFileInfo[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/repos/connected")
      .then((r) => r.json())
      .then((data) => {
        setRepos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  const selectRepo = async (repo: RepoInfo) => {
    setSelectedRepo(repo);
    setLoadingContent(true);
    const items: Record<string, GitHubFileInfo[]> = {};

    for (const type of CONTENT_TYPES) {
      try {
        const res = await fetch(
          `/api/content/${type}?owner=${repo.owner}&repo=${repo.name}`
        );
        if (res.ok) {
          items[type] = await res.json();
        }
      } catch {
        items[type] = [];
      }
    }

    setContentItems(items);
    setLoadingContent(false);
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Repo List */}
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Your Repositories
            </h2>
            <div className="space-y-2">
              {repos.map((repo) => (
                <button
                  key={repo.fullName}
                  onClick={() => selectRepo(repo)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                    selectedRepo?.fullName === repo.fullName
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {repo.private ? (
                    <Lock size={16} className="text-gray-400" />
                  ) : (
                    <Globe size={16} className="text-gray-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {repo.name}
                    </p>
                    {repo.description && (
                      <p className="truncate text-sm text-gray-500">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
              {repos.length === 0 && (
                <p className="text-sm text-gray-500">No repositories found.</p>
              )}
            </div>
          </div>

          {/* Content List */}
          <div className="lg:col-span-2">
            {selectedRepo ? (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <GitBranch size={18} className="text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedRepo.fullName}
                  </h2>
                </div>

                {loadingContent ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {CONTENT_TYPES.map((type) => (
                      <div key={type}>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                            {type}
                          </h3>
                          <button
                            onClick={() =>
                              router.push(
                                `/editor/${type}/new?owner=${selectedRepo.owner}&repo=${selectedRepo.name}`
                              )
                            }
                            className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                          >
                            <Plus size={14} />
                            New
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(contentItems[type] || []).map((item) => (
                            <button
                              key={item.path}
                              onClick={() =>
                                router.push(
                                  `/editor/${type}/${item.name}?owner=${selectedRepo.owner}&repo=${selectedRepo.name}`
                                )
                              }
                              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
                            >
                              <FileText
                                size={18}
                                className="text-gray-400"
                              />
                              <span className="font-medium text-gray-900">
                                {item.name}
                              </span>
                              <ChevronRight
                                size={16}
                                className="ml-auto text-gray-400"
                              />
                            </button>
                          ))}
                          {(!contentItems[type] ||
                            contentItems[type].length === 0) && (
                            <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                              No {type} yet. Create your first one!
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <p>Select a repository to view its content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
