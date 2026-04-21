"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, X, GitBranch } from "lucide-react";
import type { RepoInfo } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (repo: RepoInfo) => void;
}

const NAME_RE = /^[a-zA-Z0-9._-]+$/;

export default function NewSiteDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      // Defer focus so the element is mounted when we grab it.
      queueMicrotask(() => inputRef.current?.focus());
    } else {
      setName("");
      setIsPrivate(false);
      setSubmitting(false);
      submittingRef.current = false;
      returnFocusRef.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submittingRef.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const nameError = (() => {
    if (!name) return null;
    if (!NAME_RE.test(name)) return "Only letters, digits, . _ - allowed";
    if (name.length > 100) return "Must be 100 characters or fewer";
    if (/^[.-]/.test(name)) return "Cannot start with . or -";
    if (/\.git$/i.test(name)) return "Cannot end with .git";
    return null;
  })();

  const submit = async () => {
    if (submittingRef.current) return;
    if (!name || nameError) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/repos/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, private: isPrivate }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        const message =
          data.error ??
          (res.status === 409
            ? "A repository with that name already exists"
            : `Failed (${res.status})`);
        toast.error(message);
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      const repo = (await res.json()) as RepoInfo;
      toast.success(`Created ${repo.fullName}`);
      onCreated(repo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-site-title"
      aria-describedby="new-site-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-600">
              <GitBranch size={14} />
              New site
            </div>
            <h2
              id="new-site-title"
              className="text-xl font-semibold text-gray-900"
            >
              Scaffold a new repo
            </h2>
            <p id="new-site-desc" className="mt-1 text-sm text-gray-500">
              GitCMS will create a fresh GitHub repo under your account with a
              Next.js starter ready to edit.
            </p>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            aria-label="Close dialog"
            className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <label
          htmlFor="new-site-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Repository name
        </label>
        <input
          id="new-site-name"
          ref={inputRef}
          type="text"
          value={name}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "new-site-name-error" : undefined}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="my-blog"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={submitting}
        />
        {nameError && (
          <p
            id="new-site-name-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {nameError}
          </p>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            disabled={submitting}
            className="rounded"
          />
          Private repository
        </label>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !name || !!nameError}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Creating…" : "Create site"}
          </button>
        </div>
      </div>
    </div>
  );
}
