import type { NextConfig } from "next";

interface ImageRemotePattern {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
}

function parseImageHost(entry: string): ImageRemotePattern {
  const trimmed = entry.trim();
  const isLocal =
    trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1");

  const protocol = isLocal ? "http" : "https";

  if (trimmed.includes(":")) {
    const [hostname, port] = trimmed.split(":");
    return {
      protocol,
      hostname,
      port,
      pathname: "/**",
    };
  }

  return {
    protocol,
    hostname: trimmed,
    pathname: "/**",
  };
}

const imageHosts = (
  process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES ??
  "localhost:9000,127.0.0.1:9000,localhost:8000,127.0.0.1:8000,res.cloudinary.com"
)
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const remotePatterns: ImageRemotePattern[] = imageHosts.map(parseImageHost);

// AWS S3 wildcard host pattern
remotePatterns.push({
  protocol: "https",
  hostname: "**.amazonaws.com",
  pathname: "/**",
});

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ecommerce/types"],
  images: {
    remotePatterns,
    // In Docker, the Next server cannot reach MinIO at localhost:9000 on the host.
    // Unoptimized lets the browser load images directly from the mapped MinIO port.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "true",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
