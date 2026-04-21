import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";

// Re-read content/*.json on every request so edits from GitCMS show up without a dev-server restart.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getContent("pages", slug);

  const allowDrafts = process.env.GITCMS_PREVIEW === "1";
  if (!page || (!allowDrafts && page.status !== "published")) notFound();

  return (
    <article>
      <h1 className="mb-8 text-4xl font-bold tracking-tight">{page.title}</h1>
      {/* TODO(v2): sanitize with isomorphic-dompurify once multi-author/PR flows land. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: page.body }} />
    </article>
  );
}
