"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Github,
  FileText,
  Edit3,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  GitBranch,
} from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <GitBranch size={20} className="text-blue-600" />
            <span className="text-lg font-semibold tracking-tight">
              GitCMS
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              How it works
            </a>
            <Link
              href={session ? "/dashboard" : "/login"}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {session ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          }}
        />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/[0.08] blur-[120px]" />
        <div className="pointer-events-none absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-violet-400/[0.06] blur-[100px]" />

        {/* Badge */}
        <div className="relative mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Built for developers, powered by GitHub
        </div>

        {/* Headline */}
        <h1 className="relative max-w-4xl text-center text-5xl font-bold leading-[1.1] tracking-tight sm:text-7xl">
          Your content,{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)",
              backgroundSize: "200% 200%",
              animation: "gradient-shift 4s ease infinite",
            }}
          >
            version controlled
          </span>
        </h1>

        {/* Subtitle */}
        <p className="relative mt-6 max-w-2xl text-center text-lg leading-relaxed text-gray-500 sm:text-xl">
          A headless CMS that stores content in GitHub repositories.
          Every edit is a commit. Full history comes free.
        </p>

        {/* CTAs */}
        <div className="relative mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href={session ? "/dashboard" : "/login"}
            className="group flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-gray-900/10 transition hover:bg-gray-800"
          >
            <Github size={18} />
            {session ? "Go to Dashboard" : "Get Started"}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Learn More
          </a>
        </div>

        {/* Mockup preview */}
        <div className="relative mt-20 w-full max-w-4xl">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="ml-4 flex-1 rounded-md bg-gray-200/60 px-3 py-1 text-xs text-gray-400">
                localhost:3000/dashboard
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="flex min-h-[300px]">
              {/* Sidebar */}
              <div className="w-56 border-r border-gray-100 bg-gray-50/50 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <GitBranch size={14} className="text-blue-600" />
                  Repositories
                </div>
                <div className="space-y-1.5">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                    my-blog
                  </div>
                  <div className="rounded-lg px-3 py-2 text-sm text-gray-400">
                    docs-site
                  </div>
                  <div className="rounded-lg px-3 py-2 text-sm text-gray-400">
                    portfolio
                  </div>
                </div>
              </div>
              {/* Content area */}
              <div className="flex-1 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Posts
                  </span>
                  <div className="rounded-md bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    + New
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    "Getting Started with GitCMS",
                    "Why Version Control Matters",
                    "Building a Modern Blog",
                  ].map((title) => (
                    <div
                      key={title}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 transition hover:bg-gray-50"
                    >
                      <FileText size={14} className="text-gray-300" />
                      <span className="text-sm text-gray-700">{title}</span>
                      <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        published
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Features
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you need to{" "}
              <span className="text-gray-400">ship content</span>
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Github,
                title: "GitHub-Native Storage",
                description:
                  "Content lives in repos you own. Every edit is a commit with full history, diffs, and rollbacks.",
                accent: "group-hover:bg-blue-100",
                iconAccent: "text-blue-600",
              },
              {
                icon: Edit3,
                title: "Rich Text Editor",
                description:
                  "TipTap-powered editor with bold, italic, headings, lists, blockquotes, and code blocks.",
                accent: "group-hover:bg-violet-100",
                iconAccent: "text-violet-600",
              },
              {
                icon: Zap,
                title: "Headless API",
                description:
                  "RESTful endpoints to fetch content from any frontend. Next.js, Astro, Gatsby - you choose.",
                accent: "group-hover:bg-amber-100",
                iconAccent: "text-amber-600",
              },
              {
                icon: FileText,
                title: "Structured Content",
                description:
                  "Define content types with JSON schemas. Posts, pages, products - model anything.",
                accent: "group-hover:bg-emerald-100",
                iconAccent: "text-emerald-600",
              },
              {
                icon: Shield,
                title: "GitHub Auth",
                description:
                  "OAuth-based sign-in. No separate accounts. Manage content in repos you already own.",
                accent: "group-hover:bg-rose-100",
                iconAccent: "text-rose-600",
              },
              {
                icon: Globe,
                title: "Open Source",
                description:
                  "Next.js, TypeScript, Tailwind CSS. Fully open source, self-hostable, no vendor lock-in.",
                accent: "group-hover:bg-cyan-100",
                iconAccent: "text-cyan-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100"
              >
                <div className="relative">
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 transition ${feature.accent}`}
                  >
                    <feature.icon
                      size={20}
                      className={`${feature.iconAccent}`}
                    />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative bg-gray-50 px-6 py-32">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
              How it works
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Three steps to{" "}
              <span className="text-gray-400">publishing</span>
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Connect your GitHub",
                description:
                  "Sign in with GitHub OAuth. GitCMS gets access to your repositories - no new accounts, no passwords to remember.",
              },
              {
                step: "02",
                title: "Write in the editor",
                description:
                  "Pick a repo, create or edit content using the rich text editor. Add titles, excerpts, cover images, and format your body text.",
              },
              {
                step: "03",
                title: "Publish with a commit",
                description:
                  "Hit publish and your content is committed directly to GitHub as a JSON file. Instant version history, instant rollback capability.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-t border-gray-200 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              "Next.js",
              "TypeScript",
              "Tailwind CSS",
              "NextAuth.js",
              "Octokit",
              "TipTap",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-600"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/[0.05] blur-[120px]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to start?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Connect your GitHub and publish your first piece of content in under
            a minute.
          </p>
          <Link
            href={session ? "/dashboard" : "/login"}
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-gray-900/10 transition hover:bg-gray-800"
          >
            <Github size={18} />
            {session ? "Go to Dashboard" : "Get Started for Free"}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <GitBranch size={14} />
            GitCMS
          </div>
          <p className="text-sm text-gray-400">
            A headless CMS powered by GitHub
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
