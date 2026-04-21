import fs from "node:fs";
import path from "node:path";
import type { TemplateFile } from "./types";

export type { TemplateFile };

const TEMPLATE_ROOT = path.join(process.cwd(), "templates", "next-blog");

const IGNORE_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  "build",
  ".vercel",
  ".DS_Store",
  "next-env.d.ts",
]);

const IGNORE_SUFFIXES = [".log", ".tsbuildinfo"];

// File extensions that are always text and safe to normalize line endings on.
// Anything else is passed through unchanged (future-proofs against binary assets).
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".html",
  ".txt",
  ".yml",
  ".yaml",
  ".gitignore",
  ".gitkeep",
  ".gitattributes",
]);

function shouldIgnore(name: string): boolean {
  if (IGNORE_NAMES.has(name)) return true;
  return IGNORE_SUFFIXES.some((s) => name.endsWith(s));
}

function isTextFile(name: string): boolean {
  // Dotfiles like .gitignore match by full name.
  if (TEXT_EXTENSIONS.has(name)) return true;
  const ext = path.extname(name).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, "\n");
}

function walk(absDir: string, relDir: string, out: TemplateFile[]): void {
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (shouldIgnore(entry.name)) continue;
    const abs = path.join(absDir, entry.name);
    const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      walk(abs, rel, out);
    } else if (entry.isFile()) {
      const raw = fs.readFileSync(abs, "utf-8");
      const content = isTextFile(entry.name)
        ? normalizeLineEndings(raw)
        : raw;
      out.push({ path: rel, content });
    }
  }
}

let cache: TemplateFile[] | null = null;

export function loadTemplate(): TemplateFile[] {
  if (cache) return cache;
  if (!fs.existsSync(TEMPLATE_ROOT)) {
    throw new Error(`Template not found at ${TEMPLATE_ROOT}`);
  }
  const files: TemplateFile[] = [];
  walk(TEMPLATE_ROOT, "", files);
  cache = files;
  return files;
}
