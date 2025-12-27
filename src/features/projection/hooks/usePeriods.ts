"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectionWithOpenPeriods } from "@/lib/api/periods";

export function usePeriods(monthsAhead: number = 12) {
  return useQuery({
    queryKey: ["periods", monthsAhead],
    queryFn: () => getProjectionWithOpenPeriods(monthsAhead),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
