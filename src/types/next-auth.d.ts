import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      rol: string;
      nombre: string;
      sucursalId?: number;
    } & DefaultSession["user"];
  }
  interface User {
    id: number;
    rol: string;
    nombre: string;
    sucursalId?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    rol: string;
    nombre: string;
    sucursalId?: number;
  }
}
