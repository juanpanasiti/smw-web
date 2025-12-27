"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { LayoutDashboard, Receipt, TrendingUp, Menu, X, Settings, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConfirmDialog from "./ConfirmDialog";
import { useAuthContext } from "@/providers/AuthProvider";

const mainSections = [
  { label: "Dashboard", href: "/dashboard", accent: "bg-slate-500/40", icon: LayoutDashboard },
  { label: "Expenses", href: "/expenses", accent: "bg-emerald-500/40", icon: Receipt },
  { label: "Projection", href: "/projection", accent: "bg-violet-500/40", icon: TrendingUp },
];

const bottomSections = [
  { label: "Settings", href: "/settings", accent: "bg-slate-500/40", icon: Settings },
];

type SidebarLayoutProps = {
  children: ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const current = useMemo(() => {
    const allSections = [...mainSections, ...bottomSections];
    return allSections.find((section) => pathname.startsWith(section.href));
  }, [pathname]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirm(false);
    router.push("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="relative flex min-h-screen flex-col md:flex-row">
        <aside
          className={`fixed inset-y-0 left-0 z-20 flex h-screen w-full flex-col overflow-y-auto border-b border-slate-200 bg-slate-50/80 p-4 backdrop-blur transition-transform duration-300 dark:border-white/5 dark:bg-slate-900/80 md:w-64 md:border-r md:border-b-0 ${
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between md:hidden">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Menu</p>
            <button
              className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-900 dark:bg-white/10 dark:text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>

          {/* User Info at Top */}
          {user && (
            <div className="mb-4 mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-slate-800/50">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{user.username}</p>
              <p className="truncate text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
            </div>
          )}

          {/* Separator line */}
          {user && <div className="mb-4 border-t border-slate-200 dark:border-white/5" />}

          <nav className="flex min-h-0 flex-1 flex-col gap-2">{mainSections.map((section) => {
              const isActive = pathname.startsWith(section.href);
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "border-slate-300 bg-slate-200 text-slate-900 dark:border-white/5 dark:bg-white/10 dark:text-white"
                      : "border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-white/5 dark:text-slate-300 dark:hover:border-transparent dark:hover:bg-white/10"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`} />
                  {section.label}
                </Link>
              );
            })}

            {/* Spacer to push bottom items to the bottom */}
            <div className="flex-1" />

            <div className="my-2 border-t border-slate-200 dark:border-white/5" />

            {bottomSections.map((section) => {
              const isActive = pathname.startsWith(section.href);
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "border-slate-300 bg-slate-200 text-slate-900 dark:border-white/5 dark:bg-white/10 dark:text-white"
                      : "border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-white/5 dark:text-slate-300 dark:hover:border-transparent dark:hover:bg-white/10"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`} />
                  {section.label}
                </Link>
              );
            })}

            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-white/5 dark:text-rose-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col md:ml-64">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/5 dark:bg-slate-950/90">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Section</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{current?.label ?? "Welcome"}</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 dark:border-white/10 dark:text-white md:hidden"
                onClick={() => setOpen((prev) => !prev)}
              >
                <Menu className="h-3.5 w-3.5" />
                Menu
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 md:p-10">
            {children}
          </main>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  );
}
