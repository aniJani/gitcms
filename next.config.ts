import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the template source ships with the serverless bundle on Vercel; the
  // scaffold route reads from templates/next-blog/ at runtime via fs.
  outputFileTracingIncludes: {
    "/api/repos/scaffold": ["./templates/next-blog/**/*"],
  },
};

export default nextConfig;
