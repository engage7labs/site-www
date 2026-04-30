import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
let appVersion = pkg.version;
try {
  appVersion = readFileSync("../VERSION", "utf-8").trim().replace(/^v/, "");
} catch {
  appVersion = pkg.version;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
};

export default nextConfig;
