"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthContext } from "@/providers/AuthProvider";
import ConfirmDialog from "./ConfirmDialog";

export default function UserMenu() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

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

  const handleProfile = () => {
    router.push("/profile");
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="User menu"
          >
            <User className="h-5 w-5" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-sm"
            sideOffset={8}
            align="end"
          >
            <div className="border-b border-white/10 px-3 py-2">
              <p className="text-sm font-semibold text-white">{user.username}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>

            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-white outline-none transition hover:bg-white/10 focus:bg-white/10"
              onSelect={handleProfile}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-white/10" />

            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-400 outline-none transition hover:bg-rose-500/10 focus:bg-rose-500/10"
              onSelect={handleLogoutClick}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}
