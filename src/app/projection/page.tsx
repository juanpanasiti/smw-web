"use client";

import SidebarLayout from "@/components/SidebarLayout";
import { useAuthContext } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePeriods } from "@/features/projection/hooks/usePeriods";
import PeriodDetail from "@/features/projection/components/PeriodDetail";

export default function ProjectionPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const { data: periods, isLoading } = usePeriods(12);
  const [openPeriodId, setOpenPeriodId] = useState<string | null>(null);

  // Load open period from localStorage on mount
  useEffect(() => {
    const savedPeriodId = localStorage.getItem("smw:openPeriodId");
    if (savedPeriodId) {
      setOpenPeriodId(savedPeriodId);
    }
  }, []);

  // Save open period to localStorage when it changes
  useEffect(() => {
    if (openPeriodId) {
      localStorage.setItem("smw:openPeriodId", openPeriodId);
    } else {
      localStorage.removeItem("smw:openPeriodId");
    }
  }, [openPeriodId]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  const handleTogglePeriod = (periodId: string) => {
    setOpenPeriodId(prev => prev === periodId ? null : periodId);
  };

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Projection</p>
          <h1 className="text-3xl font-semibold text-white">Monthly periods</h1>
        </div>

        {isLoading && (
          <p className="text-sm text-slate-400">Loading periods...</p>
        )}

        {!isLoading && periods && periods.length === 0 && (
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-slate-200">
            <p className="text-sm text-slate-300">No periods available yet.</p>
          </div>
        )}

        {!isLoading && periods && periods.length > 0 && (
          <div className="space-y-3">
            {periods.map((period) => (
              <PeriodDetail 
                key={period.id} 
                period={period}
                isOpen={openPeriodId === period.id}
                onToggle={() => handleTogglePeriod(period.id)}
              />
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
