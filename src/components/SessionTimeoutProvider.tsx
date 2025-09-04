"use client";
import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const TIMEOUT_MINUTES = 15; // Cambia a lo que desees
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

export default function SessionTimeoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return <>{children}</>;
}
