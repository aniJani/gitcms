import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Site",
  description: "A site powered by GitCMS",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="border-b border-gray-200">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              My Site
            </Link>
            <nav className="flex items-center gap-5 text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900">
                Posts
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
        <footer className="mx-auto max-w-3xl border-t border-gray-200 px-6 py-8 text-sm text-gray-500">
          Powered by GitCMS
        </footer>
      </body>
    </html>
  );
}
