import path from "path";
import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  // Evitamos auto-registro para no depender de pages/_document en App Router
  register: false,
  skipWaiting: true,
  // Temporalmente desactivado para evitar interferencias en build/SSR
  disable: true,
});

const nextConfig = {
  // Ayuda a Next a resolver la raíz correcta del proyecto cuando hay múltiples lockfiles
  outputFileTracingRoot: path.join(process.cwd()),
};

export default withPWA(nextConfig);
