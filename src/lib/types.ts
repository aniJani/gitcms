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
  sha?: string; // GitHub file SHA for updates
}

export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export interface GitHubFileInfo {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
}

export interface ContentSchema {
  name: string;
  pluralName: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: "string" | "richtext" | "image" | "date" | "boolean" | "select";
  required?: boolean;
  label?: string;
  options?: string[];
}
