"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuthContext } from "@/providers/AuthProvider";
import SidebarLayout from "@/components/SidebarLayout";
import { useUpdateUser } from "@/features/auth/hooks/useUpdateUser";
import type { UpdateUserData } from "@/lib/models/user";

export default function ProfilePage() {
  const { user, isLoading, refreshUserData } = useAuthContext();
  const router = useRouter();
  const updateMutation = useUpdateUser();

  const [formData, setFormData] = useState(() => ({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    birthdate: "",
    monthlySpendingLimit: "",
  }));

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, router, isLoading]);

  // Update form when user data loads
  useEffect(() => {
    if (user && user.profile !== undefined) {
      Promise.resolve().then(() => {
        setFormData({
          username: user.username || "",
          email: user.email || "",
          password: "",
          firstName: user.profile?.firstName || "",
          lastName: user.profile?.lastName || "",
          birthdate: user.profile?.birthdate || "",
          monthlySpendingLimit: user.profile?.preferences?.monthlySpendingLimit?.toString() || "",
        });
      });
    }
  }, [user]);

  if (isLoading || !user) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: UpdateUserData = {};

    // Only include changed fields
    if (formData.username && formData.username !== user.username) {
      updateData.username = formData.username;
    }
    if (formData.email && formData.email !== user.email) {
      updateData.email = formData.email;
    }
    if (formData.password) {
      updateData.password = formData.password;
    }

    // Profile data
    const hasProfileChanges =
      (formData.firstName && formData.firstName !== user.profile?.firstName) ||
      (formData.lastName && formData.lastName !== user.profile?.lastName) ||
      (formData.birthdate && formData.birthdate !== user.profile?.birthdate) ||
      (formData.monthlySpendingLimit &&
        parseFloat(formData.monthlySpendingLimit) !== user.profile?.preferences?.monthlySpendingLimit);

    if (hasProfileChanges) {
      updateData.profile = {};

      if (formData.firstName) {
        updateData.profile.firstName = formData.firstName;
      }
      if (formData.lastName) {
        updateData.profile.lastName = formData.lastName;
      }
      if (formData.birthdate) {
        updateData.profile.birthdate = formData.birthdate;
      }
      if (formData.monthlySpendingLimit) {
        updateData.profile.preferences = {
          monthlySpendingLimit: parseFloat(formData.monthlySpendingLimit),
        };
      }
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 0) {
      toast.error("No changes to save");
      return;
    }

    updateMutation.mutate(
      { userId: user.id, data: updateData },
      {
        onSuccess: async () => {
          toast.success("Profile updated successfully");
          // Refresh user data from server
          await refreshUserData();
          // Clear password field
          setFormData((prev) => ({ ...prev, password: "" }));
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to update profile";
          toast.error(message);
        },
      }
    );
  };

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage your account information and preferences
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900/40"
        >
          {/* Account Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account Information</h2>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password (leave empty to keep current)
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-white/5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Birthdate
              </label>
              <input
                type="date"
                id="birthdate"
                value={formData.birthdate}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthdate: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-white/5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preferences</h2>

            <div>
              <label
                htmlFor="monthlySpendingLimit"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Monthly Spending Limit (ARS)
              </label>
              <input
                type="number"
                id="monthlySpendingLimit"
                value={formData.monthlySpendingLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, monthlySpendingLimit: e.target.value }))}
                placeholder="150000"
                step="1000"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/5">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-2xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.form>
      </div>
    </SidebarLayout>
  );
}
