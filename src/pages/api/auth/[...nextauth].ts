import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { randomUUID } from "crypto";

type UserWithSession = {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  sucursalId?: number;
  sessionToken?: string;
  permisos?: Record<string, boolean>;
};

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials): Promise<UserWithSession | null> {
        if (!credentials?.email || !credentials?.password) return null;
        const user = (await prisma.usuario.findUnique({
          where: { email: credentials.email },
        })) as {
          id: number;
          email: string;
          nombre: string;
          rol: string;
          sucursalId: number | null;
          password: string;
          permisos: unknown;
        } | null;
        if (!user) return null;
        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;
        // Generar un token de sesión único
        const sessionToken = randomUUID();
        // Guardar o actualizar el token en la tabla ActiveSession
        await prisma.activeSession.upsert({
          where: { userId: user.id },
          update: { sessionToken },
          create: { userId: user.id, sessionToken },
        });
        const rawPerms = user.permisos;
        const permisos =
          rawPerms && typeof rawPerms === "object"
            ? (rawPerms as Record<string, boolean>)
            : undefined;
        return {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          sucursalId: user.sucursalId === null ? undefined : user.sucursalId,
          sessionToken,
          permisos,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Al iniciar sesión, guardar el sessionToken en el JWT
      if (user) {
        const u = user as Partial<UserWithSession>;
        token.id = Number(user.id);
        token.rol = user.rol;
        token.nombre = user.nombre;
        // Corregir: convertir null a undefined para sucursalId
        token.sucursalId =
          user.sucursalId === null ? undefined : user.sucursalId;
        // Guardar el sessionToken como accessToken utilizable por el cliente
        token.sessionToken = u.sessionToken as string | undefined;
        token.accessToken = u.sessionToken as string | undefined;
        // Permisos
        (token as unknown as { permisos?: Record<string, boolean> }).permisos =
          (u.permisos as Record<string, boolean> | undefined) ?? {};
      }
      // Validar sesión única y refrescar datos del usuario (sucursalId y permisos) en cada solicitud
      if (token.id && !user) {
        const dbSession = await prisma.activeSession.findUnique({
          where: { userId: Number(token.id) },
        });
        if (!dbSession || dbSession.sessionToken !== token.sessionToken) {
          // Token inválido, forzar signOut borrando el JWT
          token.id = 0;
          token.rol = "";
          token.nombre = "";
          token.sessionToken = "";
          token.accessToken = "";
        } else {
          // Refrescar sucursalId y permisos desde la base de datos
          const dbUser = await prisma.usuario.findUnique({
            where: { id: Number(token.id) },
          });
          token.sucursalId =
            dbUser?.sucursalId === null ? undefined : dbUser?.sucursalId;
          // Actualizar permisos dinámicamente sin requerir re-login
          const rawPerms = (dbUser as unknown as { permisos?: unknown })
            ?.permisos;
          const permisos =
            rawPerms && typeof rawPerms === "object"
              ? (rawPerms as Record<string, boolean>)
              : {};
          (
            token as unknown as { permisos?: Record<string, boolean> }
          ).permisos = permisos;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Propagar accessToken al objeto de sesión para el cliente
        // (tipado extendido en src/types/next-auth.d.ts)
        (session as unknown as { accessToken?: string }).accessToken = (
          token as unknown as { accessToken?: string }
        ).accessToken;
        session.user.id = token.id;
        session.user.rol = token.rol;
        session.user.nombre = token.nombre;
        if ("sucursalId" in token) {
          session.user.sucursalId = token.sucursalId;
        }
        (
          session.user as unknown as { permisos?: Record<string, boolean> }
        ).permisos = (
          token as unknown as { permisos?: Record<string, boolean> }
        ).permisos;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
