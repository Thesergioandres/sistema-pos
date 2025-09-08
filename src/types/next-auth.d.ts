import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: number;
      rol: string;
      nombre: string;
      sucursalId?: number;
      permisos?: Record<string, boolean>;
    } & DefaultSession["user"];
  }
  interface User {
    id: number;
    rol: string;
    nombre: string;
    sucursalId?: number;
    permisos?: Record<string, boolean>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    rol: string;
    nombre: string;
    sucursalId?: number;
    accessToken?: string;
    sessionToken?: string;
    permisos?: Record<string, boolean>;
  }
}
