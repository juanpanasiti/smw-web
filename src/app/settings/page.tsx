"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Tags } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import SidebarLayout from "@/components/SidebarLayout";
import ProfileSettings from "@/features/settings/components/ProfileSettings";
import CategoriesSettings from "@/features/settings/components/CategoriesSettings";

type Tab = "profile" | "categories";

export default function SettingsPage() {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, router, isLoading]);

  if (isLoading || !user) {
    return null;
  }

  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "categories" as Tab, label: "Categories", icon: Tags },
  ];

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage your account and application preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "categories" && <CategoriesSettings />}
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
