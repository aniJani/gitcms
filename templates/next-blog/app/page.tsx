import Link from "next/link";
import { listContent } from "@/lib/content";

// Re-read content/*.json on every request so edits from GitCMS show up without a dev-server restart.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  const posts = listContent("posts");

  return (
    <div>
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Posts</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">
          No published posts yet. Create one in GitCMS.
        </p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="group block rounded-lg border border-transparent p-4 transition hover:border-gray-200 hover:bg-gray-50"
              >
                <h2 className="text-xl font-semibold group-hover:text-blue-600">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-1 text-gray-600">{post.excerpt}</p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
