"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { WebContainer, FileSystemTree } from "@webcontainer/api";
import BootLog from "./BootLog";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

export interface PreviewPaneHandle {
  writeFile: (path: string, content: string) => Promise<void>;
}

type Status =
  | "loading-bundle"
  | "booting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

interface Props {
  owner: string;
  repo: string;
  /** Optional path inside the previewed site, e.g. "posts/hello-world". */
  path?: string;
}

// WebContainer.boot() is a singleton per page. Beyond that, the entire
// fetch → mount → install → dev pipeline must not run twice (React StrictMode
// double-invokes effects in dev, and a second `next dev` collides on port
// 3000 and drifts to 3001 with a dead iframe URL). We cache the full pipeline
// at module scope keyed by owner/repo.
interface PipelineHandle {
  container: WebContainer;
  logBuffer: string[];
  subscribers: Set<(chunk: string) => void>;
  readyUrlPromise: Promise<string>;
}

const pipelines = new Map<string, Promise<PipelineHandle>>();
let currentKey: string | null = null;

const LOG_BUFFER_CAP = 2000;

async function getPipeline(owner: string, repo: string): Promise<PipelineHandle> {
  const key = `${owner}/${repo}`;
  const existing = pipelines.get(key);
  if (existing) return existing;

  // WebContainer.boot() throws if another instance is live. When the user
  // switches between repos, tear the previous pipeline down before booting
  // a new one.
  if (currentKey && currentKey !== key) {
    const stale = pipelines.get(currentKey);
    pipelines.delete(currentKey);
    if (stale) {
      try {
        const handle = await stale;
        handle.subscribers.clear();
        handle.container.teardown();
      } catch {
        /* previous pipeline failed; nothing to tear down */
      }
    }
  }
  currentKey = key;

  const promise = (async () => {
    const logBuffer: string[] = [];
    const subscribers = new Set<(chunk: string) => void>();
    const broadcast = (chunk: string) => {
      logBuffer.push(chunk);
      if (logBuffer.length > LOG_BUFFER_CAP) {
        logBuffer.splice(0, logBuffer.length - LOG_BUFFER_CAP);
      }
      for (const sub of subscribers) sub(chunk);
    };

    const res = await fetch(
      `/api/webcontainer-bundle?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? `Bundle fetch failed (${res.status})`);
    }
    const { tree } = (await res.json()) as { tree: FileSystemTree };

    const { WebContainer } = await import("@webcontainer/api");
    const container = await WebContainer.boot();

    let resolveReady!: (url: string) => void;
    let rejectReady!: (err: Error) => void;
    const readyUrlPromise = new Promise<string>((res, rej) => {
      resolveReady = res;
      rejectReady = rej;
    });
    container.on("server-ready", (_port, url) => resolveReady(url));

    await container.mount(tree);

    broadcast("$ npm install\n");
    const install = await container.spawn("npm", ["install"]);
    install.output.pipeTo(
      new WritableStream({ write: (chunk) => broadcast(chunk) }),
    );
    const installExit = await install.exit;
    if (installExit !== 0) {
      const err = new Error(`npm install failed with exit code ${installExit}`);
      rejectReady(err);
      throw err;
    }

    broadcast("\n$ npm run dev\n");
    const dev = await container.spawn("npm", ["run", "dev"], {
      // The template gates draft visibility on this env var so unpublished
      // content renders in the CMS preview but 404s on a production deploy.
      env: { GITCMS_PREVIEW: "1" },
    });
    dev.output.pipeTo(
      new WritableStream({ write: (chunk) => broadcast(chunk) }),
    );

    return { container, logBuffer, subscribers, readyUrlPromise };
  })();

  pipelines.set(key, promise);
  // If it rejects, let the next mount retry — drop from cache.
  promise.catch(() => {
    pipelines.delete(key);
    if (currentKey === key) currentKey = null;
  });
  return promise;
}

function unsupportedReason(): string | null {
  if (typeof window === "undefined") return "Server-side render";
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  if (isSafari) {
    return "Live preview requires Chrome or Firefox (Safari lacks the threading primitives WebContainer needs).";
  }
  if (!window.crossOriginIsolated) {
    return "Cross-origin isolation failed. Check that all sub-resources send Cross-Origin-Resource-Policy — reload after a config fix.";
  }
  return null;
}

const PreviewPane = forwardRef<PreviewPaneHandle, Props>(function PreviewPane(
  { owner, repo, path: previewPath },
  ref,
) {
  const [status, setStatus] = useState<Status>("loading-bundle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [iframeNonce, setIframeNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Per-path write queue so `mkdir → writeFile` for the same file can't
  // interleave with a subsequent call and end up with stale bytes winning.
  const writeChainsRef = useRef<Map<string, Promise<void>>>(new Map());

  useImperativeHandle(
    ref,
    () => ({
      writeFile: async (filePath: string, content: string) => {
        const pipeline = pipelines.get(`${owner}/${repo}`);
        if (!pipeline) return;
        const handle = await pipeline;
        const prev = writeChainsRef.current.get(filePath) ?? Promise.resolve();
        const next = prev
          .catch(() => undefined)
          .then(async () => {
            const dir = filePath.includes("/")
              ? filePath.replace(/\/[^/]+$/, "")
              : "";
            if (dir) {
              await handle.container.fs.mkdir(dir, { recursive: true });
            }
            await handle.container.fs.writeFile(filePath, content);
            setIframeNonce((n) => n + 1);
          });
        writeChainsRef.current.set(filePath, next);
        await next;
      },
    }),
    [owner, repo],
  );

  useEffect(() => {
    let cancelled = false;

    const reason = unsupportedReason();
    if (reason) {
      setStatus("error");
      setError(reason);
      return;
    }

    const appendChunk = (chunk: string) => {
      if (cancelled) return;
      const parts = chunk.split(/\r?\n/);
      setLogs((prev) => {
        const next = prev.slice();
        if (next.length > 0 && parts[0] !== "") {
          next[next.length - 1] += parts.shift() ?? "";
        } else {
          parts.shift();
        }
        for (const p of parts) next.push(p);
        return next.length > 500 ? next.slice(-500) : next;
      });
    };

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        setStatus("booting");
        const handle = await getPipeline(owner, repo);
        if (cancelled) return;

        // Replay cached log history for remounts, then subscribe to new chunks.
        setLogs(
          handle.logBuffer
            .join("")
            .split(/\r?\n/)
            .slice(-500),
        );
        handle.subscribers.add(appendChunk);
        unsubscribe = () => handle.subscribers.delete(appendChunk);

        setStatus("installing");
        const url = await handle.readyUrlPromise;
        if (cancelled) return;
        setPreviewUrl(url);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Preview failed");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [owner, repo]);

  const statusLabel: Record<Status, string> = {
    "loading-bundle": "Fetching content from GitHub…",
    booting: "Booting Node.js in your browser…",
    installing: "Installing + starting dev server…",
    starting: "Starting dev server…",
    ready: "Ready",
    error: "Preview unavailable",
  };

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {status === "error" ? (
          <AlertTriangle size={14} className="text-red-500" />
        ) : status === "ready" ? (
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        ) : (
          <Loader2 size={14} className="animate-spin text-gray-400" />
        )}
        <span>{statusLabel[status]}</span>
        {previewUrl && (
          <>
            <button
              onClick={() => setIframeNonce((n) => n + 1)}
              className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
              title="Reload preview"
            >
              <RefreshCw size={12} />
              Reload
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Open in new tab ↗
            </a>
          </>
        )}
      </div>

      {status === "error" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : status === "ready" && previewUrl ? (
        <div className="flex flex-1 flex-col gap-2 overflow-hidden">
          <iframe
            ref={iframeRef}
            key={iframeNonce}
            src={
              previewPath
                ? `${previewUrl.replace(/\/$/, "")}/${previewPath}`
                : previewUrl
            }
            title="Live preview"
            className="min-h-[400px] w-full flex-1 rounded-lg border border-gray-200 bg-white"
          />
          <details className="shrink-0">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Dev server log
            </summary>
            <BootLog lines={logs} className="mt-1 max-h-40" />
          </details>
        </div>
      ) : (
        <BootLog lines={logs} className="h-full min-h-[240px] flex-1" />
      )}
    </div>
  );
});

export default PreviewPane;
