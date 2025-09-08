export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico|login|register).*)"],
};
