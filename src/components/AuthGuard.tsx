"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/providers/AuthProvider";

const publicRoutes = ["/login", "/register"];

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 dark:border-slate-800 dark:border-t-blue-400"></div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Cargando...</p>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isAuthRoute = pathname === "/login" || pathname === "/register";
    const isRoot = pathname === "/";

    // Si no hay usuario y la ruta no es pública, redirigir a login
    if (!user && !isPublicRoute) {
      console.log("[AuthGuard] No user, redirecting to login from:", pathname);
      router.replace("/login");
      return;
    }

    // Si hay usuario y está en una ruta de autenticación o en la raíz, ir al dashboard
    if (user && (isAuthRoute || isRoot)) {
      console.log("[AuthGuard] User logged in, redirecting to dashboard from:", pathname);
      router.replace("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  // Mostrar loading mientras se está cargando
  if (isLoading) {
    return <FullScreenLoader />;
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  if (!user && !isPublicRoute) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
