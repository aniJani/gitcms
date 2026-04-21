"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Editor from "@/components/Editor";
import MediaPicker from "@/components/MediaPicker";
import PreviewPane, {
  type PreviewPaneHandle,
} from "@/components/PreviewPane";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import type { ContentItem } from "@/lib/types";

export default function EditorPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const type = params.type as string;
  const slug = params.slug as string;
  const owner = searchParams.get("owner") || "";
  const repo = searchParams.get("repo") || "";
  const isNew = slug === "new";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [contentStatus, setContentStatus] = useState<"draft" | "published">(
    "draft",
  );
  const [sha, setSha] = useState<string | undefined>();
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [slugInput, setSlugInput] = useState(isNew ? "" : slug);

  const previewRef = useRef<PreviewPaneHandle | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!isNew && status === "authenticated" && owner && repo) {
      fetch(`/api/content/${type}/${slug}?owner=${owner}&repo=${repo}`)
        .then((r) => {
          if (!r.ok) throw new Error("Not found");
          return r.json();
        })
        .then((data: ContentItem) => {
          setTitle(data.title);
          setBody(data.body);
          setExcerpt(data.excerpt || "");
          setCoverImage(data.coverImage || "");
          setContentStatus(data.status);
          setSha(data.sha);
          setCreatedAt(data.createdAt ?? null);
          setLoading(false);
        })
        .catch(() => {
          toast.error("Failed to load content");
          setLoading(false);
        });
    }
  }, [isNew, status, owner, repo, type, slug]);

  // Live-sync editor state into the WebContainer preview. For a new post the
  // slug is whatever the user is typing; if it's empty or very short we don't
  // sync yet — otherwise every intermediate keystroke in the slug field
  // writes a junk file (m.json, my.json, my-p.json…) that becomes a routable
  // page until the container restarts.
  const syncSlug = isNew ? slugInput : slug;
  const shouldSync = !!owner && !!repo && syncSlug.length >= 3;
  useEffect(() => {
    if (!shouldSync) return;
    if (loading) return;
    const t = setTimeout(() => {
      const json =
        JSON.stringify(
          {
            title,
            body,
            excerpt,
            coverImage,
            status: contentStatus,
            createdAt: createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          null,
          2,
        ) + "\n";
      previewRef.current
        ?.writeFile(`content/${type}/${syncSlug}.json`, json)
        .catch(() => {
          /* preview may not be booted yet; next edit will retry */
        });
    }, 250);
    return () => clearTimeout(t);
  }, [
    title,
    body,
    excerpt,
    coverImage,
    contentStatus,
    createdAt,
    syncSlug,
    shouldSync,
    type,
    loading,
  ]);

  const handleSave = async () => {
    const finalSlug = isNew ? slugInput : slug;
    if (!finalSlug.trim()) {
      toast.error("Please enter a slug");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      const endpoint = `/api/content/${type}/${finalSlug}?owner=${owner}&repo=${repo}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          excerpt,
          coverImage,
          status: contentStatus,
          createdAt: createdAt ?? (isNew ? new Date().toISOString() : undefined),
          updatedAt: new Date().toISOString(),
          sha,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setSha(data.sha);
      if (!createdAt) setCreatedAt(new Date().toISOString());
      toast.success("Content saved and committed to GitHub!");

      if (isNew) {
        router.replace(
          `/editor/${type}/${finalSlug}?owner=${owner}&repo=${repo}`,
        );
      }
    } catch {
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sha) return;
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const res = await fetch(
        `/api/content/${type}/${slug}?owner=${owner}&repo=${repo}&sha=${sha}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Content deleted");
      router.push(`/dashboard`);
    } catch {
      toast.error("Failed to delete content");
    }
  };

  // Draggable split between editor (left) and preview (right).
  const [leftPct, setLeftPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const pct = (e.clientX / window.innerWidth) * 100;
      setLeftPct(Math.min(80, Math.max(25, pct)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

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
      <div className="flex h-[calc(100vh-4rem)] w-full">
        {/* Editor pane */}
        <div
          className="flex min-w-0 flex-col overflow-y-auto"
          style={{ width: `${leftPct}%` }}
        >
          <div className="mx-auto w-full max-w-3xl px-6 py-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <div className="flex items-center gap-2">
                {!isNew && sha && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <select
                  value={contentStatus}
                  onChange={(e) =>
                    setContentStatus(e.target.value as "draft" | "published")
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving..." : "Publish"}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {isNew && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) =>
                      setSlugInput(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-"),
                      )
                    }
                    placeholder="my-new-post"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {!slugInput && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a slug to start streaming this draft to the live
                      preview.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cover Image
                </label>
                <MediaPicker value={coverImage} onChange={setCoverImage} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Body
                </label>
                <Editor content={body} onChange={setBody} />
              </div>
            </div>
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={startDrag}
          className="w-1 shrink-0 cursor-col-resize bg-gray-200 transition hover:bg-blue-500"
          role="separator"
          aria-orientation="vertical"
        />

        {/* Preview pane. Disable pointer events on children while dragging so
            the iframe doesn't swallow mousemove and strand the divider. */}
        <div
          className={`flex min-w-0 flex-col overflow-hidden bg-gray-50 p-4 ${dragging ? "[&_*]:pointer-events-none" : ""}`}
          style={{ width: `${100 - leftPct}%` }}
        >
          {owner && repo ? (
            <PreviewPane
              ref={previewRef}
              owner={owner}
              repo={repo}
              path={syncSlug ? `${type}/${syncSlug}` : undefined}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
              Missing repo context
            </div>
          )}
        </div>
      </div>
    </>
  );
}
