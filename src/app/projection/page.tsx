"use client";

import SidebarLayout from "@/components/SidebarLayout";
import { useAuthContext } from "@/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { usePeriods } from "@/features/projection/hooks/usePeriods";
import PeriodDetail from "@/features/projection/components/PeriodDetail";
import { RefreshCw, EyeOff, Eye } from "lucide-react";

export default function ProjectionPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: periods, isLoading, refetch, isRefetching } = usePeriods(12);
  const [showFinished, setShowFinished] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("projection.showFinished") === "true";
    }
    return false;
  });

  const toggleShowFinished = () => {
    setShowFinished((prev) => {
      const next = !prev;
      localStorage.setItem("projection.showFinished", String(next));
      return next;
    });
  };
  
  // Get the open period from URL query param
  const openPeriodId = searchParams.get("period");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  const handleTogglePeriod = useCallback((periodId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (openPeriodId === periodId) {
      // Close the period - remove the query param
      params.delete("period");
    } else {
      // Open the period - set the query param
      params.set("period", periodId);
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : "/projection";
    router.replace(newUrl, { scroll: false });
  }, [openPeriodId, router, searchParams]);

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Projection</p>
            <h1 className="text-3xl font-semibold text-white">Monthly periods</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleShowFinished}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              title={showFinished ? "Hide finished periods" : "Show finished periods"}
            >
              {showFinished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showFinished ? "Hide Finished" : "Show Finished"}
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              title="Refresh all periods"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
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
            {periods
              .filter((period) => showFinished || period.status !== "finished")
              .map((period) => (
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
