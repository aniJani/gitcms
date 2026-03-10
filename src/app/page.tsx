"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Github, FileText, Edit3, Zap, Shield, Globe } from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <>
      <Navbar />
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white px-4 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-gray-900">
          Your Content,{" "}
          <span className="text-blue-600">Version Controlled</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          GitCMS is a headless content management system that uses GitHub
          repositories as its storage backend. Write, edit, and publish content
          with full version history.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href={session ? "/dashboard" : "/login"}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white shadow-lg transition hover:bg-blue-700"
          >
            <Github size={20} />
            {session ? "Go to Dashboard" : "Get Started with GitHub"}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Why GitCMS?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Github,
              title: "GitHub-Native Storage",
              description:
                "Your content lives in GitHub repositories. Every edit is a commit. Full version history comes free.",
            },
            {
              icon: Edit3,
              title: "Rich Text Editor",
              description:
                "Beautiful TipTap-powered editor with formatting toolbar. Write content as easily as in any CMS.",
            },
            {
              icon: Zap,
              title: "Headless API",
              description:
                "Fetch your content via API from any frontend framework. Next.js, Astro, Gatsby - you choose.",
            },
            {
              icon: FileText,
              title: "Structured Content",
              description:
                "Define content types with JSON schemas. Posts, pages, products - model anything you need.",
            },
            {
              icon: Shield,
              title: "GitHub Auth",
              description:
                "No separate accounts needed. Sign in with GitHub and manage content in repos you own.",
            },
            {
              icon: Globe,
              title: "Open Source",
              description:
                "Built with Next.js, TypeScript, and Tailwind CSS. Fully open source and self-hostable.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <feature.icon className="mb-4 h-10 w-10 text-blue-600" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gray-50 px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Ready to manage your content?
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Connect your GitHub account and start publishing in minutes.
        </p>
        <Link
          href={session ? "/dashboard" : "/login"}
          className="mt-8 inline-block rounded-lg bg-gray-900 px-8 py-3 text-lg font-medium text-white transition hover:bg-gray-800"
        >
          {session ? "Go to Dashboard" : "Sign In with GitHub"}
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        <p>GitCMS - A headless CMS powered by GitHub</p>
      </footer>
    </>
  );
}
