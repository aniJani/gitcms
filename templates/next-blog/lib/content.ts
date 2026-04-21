import fs from "node:fs";
import path from "node:path";

export interface ContentItem {
  slug: string;
  type: string;
  title: string;
  body: string;
  excerpt?: string;
  coverImage?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  author?: string;
}

const CONTENT_ROOT = path.join(process.cwd(), "content");

function contentDir(type: string): string {
  return path.join(CONTENT_ROOT, type);
}

function normalize(
  raw: unknown,
  slug: string,
  type: string,
): ContentItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string" || typeof r.body !== "string") return null;
  const status = r.status === "published" ? "published" : "draft";
  return {
    slug,
    type,
    title: r.title,
    body: r.body,
    excerpt: typeof r.excerpt === "string" ? r.excerpt : undefined,
    coverImage: typeof r.coverImage === "string" ? r.coverImage : undefined,
    status,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",
    author: typeof r.author === "string" ? r.author : undefined,
  };
}

function readItem(type: string, file: string): ContentItem | null {
  const slug = file.replace(/\.json$/, "");
  try {
    const raw = fs.readFileSync(path.join(contentDir(type), file), "utf-8");
    return normalize(JSON.parse(raw), slug, type);
  } catch {
    return null;
  }
}

export function listContent(type: string): ContentItem[] {
  const dir = contentDir(type);
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("."));

  return files
    .map((file) => readItem(type, file))
    .filter((item): item is ContentItem => item !== null)
    .filter((item) => item.status === "published")
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function getContent(type: string, slug: string): ContentItem | null {
  const file = path.join(contentDir(type), `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return readItem(type, `${slug}.json`);
}
