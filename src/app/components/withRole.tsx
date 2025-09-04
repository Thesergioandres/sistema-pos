"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withRole<P extends object>(
  Component: React.ComponentType<React.PropsWithChildren<P>>,
  allowedRoles: string[]
) {
  return function Wrapper(props: React.PropsWithChildren<P>) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === "loading") return;
      if (!session?.user) {
        router.replace("/login");
      } else if (!allowedRoles.includes(session.user.rol)) {
        router.replace("/");
      }
    }, [session, status, router]);

    if (
      status === "loading" ||
      !session?.user ||
      !allowedRoles.includes(session.user.rol)
    ) {
      return <div className="p-8 text-center">Cargando...</div>;
    }
    return <Component {...props} />;
  };
}
