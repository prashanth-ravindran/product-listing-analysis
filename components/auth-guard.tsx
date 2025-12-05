'use client';

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "pla_auth_user";

export function setAuthUser(user: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, user);
}

export function clearAuthUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [router, user]);

  if (!user) {
    return (
      <main className="main">
        <div className="shell">
          <p className="note">Checking session...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
