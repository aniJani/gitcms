"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Github, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              GitCMS
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="flex items-center gap-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                <Github size={16} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
