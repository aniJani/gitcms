import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the template source ships with the serverless bundle on Vercel; the
  // scaffold route reads from templates/next-blog/ at runtime via fs.
  outputFileTracingIncludes: {
    "/api/repos/scaffold": ["./templates/next-blog/**/*"],
  },

  // Cross-origin isolation is required for @webcontainer/api (SharedArrayBuffer,
  // WASM threads). Scope strictly to /editor/* so NextAuth's OAuth redirect and
  // anything that embeds external origins stays unaffected.
  async headers() {
    return [
      {
        source: "/editor/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      // Sub-resources must advertise a Cross-Origin-Resource-Policy for
      // crossOriginIsolated to evaluate true on pages that load them,
      // otherwise the browser silently downgrades. Next's static assets and
      // our own API/image routes need this for the /editor/* COI to hold.
      {
        source: "/_next/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
