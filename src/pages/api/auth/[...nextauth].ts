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
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
        });
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
        return {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          sucursalId: user.sucursalId === null ? undefined : user.sucursalId,
          sessionToken,
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
        token.id = Number(user.id);
        token.rol = user.rol;
        token.nombre = user.nombre;
        // Corregir: convertir null a undefined para sucursalId
        token.sucursalId =
          user.sucursalId === null ? undefined : user.sucursalId;
        // @ts-expect-error: sessionToken is not definido en el tipo Token
        token.sessionToken = user.sessionToken;
      }
      // Validar sesión única: si no es login, comprobar que el token sigue siendo válido
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
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.rol = token.rol;
        session.user.nombre = token.nombre;
        if ("sucursalId" in token) {
          session.user.sucursalId = token.sucursalId;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
