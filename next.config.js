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
  env: {
    // Aseguramos disponibilidad en el cliente en tiempo de build
    NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
};

export default withPWA(nextConfig);
