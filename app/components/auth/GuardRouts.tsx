"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SUPER_ADMIN_STORAGE_KEY } from "@/app/lib/super-admin-auth";

interface SuperAdminGuardProps {
  children: ReactNode;
}

export function GuardRoute({ children }: SuperAdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isLoggedIn = localStorage.getItem(SUPER_ADMIN_STORAGE_KEY) === "true";

    if (!isLoggedIn) {
      setAuthorized(false);
      router.replace("/login?next=" + encodeURIComponent(pathname));
    } else {
      setAuthorized(true);
    }

    setChecking(false);
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">Checking access…</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
