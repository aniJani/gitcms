export interface FileEntry {
  path: string;
  content: string;
}

// Shape-compatible with @webcontainer/api's FileSystemTree, but defined here so
// nothing in the server bundle has to import the browser-only WebContainer API.
export interface FileNode {
  file: { contents: string };
}
export interface DirNode {
  directory: FileSystemTree;
}
export type FileSystemTree = { [name: string]: FileNode | DirNode };

export function buildTree(files: FileEntry[]): FileSystemTree {
  const root: FileSystemTree = {};
  for (const { path, content } of files) {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    let cur: FileSystemTree = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      const existing = cur[seg];
      if (!existing) {
        const dir: DirNode = { directory: {} };
        cur[seg] = dir;
        cur = dir.directory;
      } else if ("directory" in existing) {
        cur = existing.directory;
      } else {
        throw new Error(
          `Path collides with an existing file at ${parts.slice(0, i + 1).join("/")}`,
        );
      }
    }
    cur[parts[parts.length - 1]] = { file: { contents: content } };
  }
  return root;
}
