"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// HOC de permisos por áreas (keys de permisos)
export function withPermission<P extends object = object>(
  Component: React.ComponentType<P>,
  requiredKeys: string[]
) {
  return function Wrapper(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === "loading") return;
      const user = session?.user as unknown as
        | {
            permisos?: Record<string, boolean>;
            rol?: string;
          }
        | undefined;
      const p = user?.permisos || {};
      const isAdmin = user?.rol === "admin";
      const allowed = isAdmin || requiredKeys.every((k) => p[k]);
      if (!session?.user) {
        router.replace("/login");
      } else if (!allowed) {
        router.replace("/");
      }
    }, [session, status, router]);

    const typedUser = session?.user as unknown as
      | {
          permisos?: Record<string, boolean>;
          rol?: string;
        }
      | undefined;
    const p = typedUser?.permisos || {};
    const isAdmin = typedUser?.rol === "admin";
    const allowed = isAdmin || requiredKeys.every((k) => p[k]);
    if (status === "loading" || !session?.user || !allowed) {
      return <div className="p-8 text-center">Cargando...</div>;
    }
    return <Component {...props} />;
  };
}
