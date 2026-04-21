import { notFound } from "next/navigation";
import Link from "next/link";
import { getContent } from "@/lib/content";

// Re-read content/*.json on every request so edits from GitCMS show up without a dev-server restart.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getContent("posts", slug);

  if (!post || post.status !== "published") notFound();

  return (
    <article>
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-900"
      >
        ← All posts
      </Link>
      <h1 className="mb-2 text-4xl font-bold tracking-tight">{post.title}</h1>
      <p className="mb-8 text-sm text-gray-400">
        {new Date(post.createdAt).toLocaleDateString()}
      </p>
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          className="mb-8 w-full rounded-lg border border-gray-200"
        />
      )}
      {/* TODO(v2): sanitize with isomorphic-dompurify once multi-author/PR flows land. */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
