import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Puedes personalizar más opciones aquí
});

export default withPWA;
