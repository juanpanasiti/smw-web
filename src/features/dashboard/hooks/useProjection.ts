import { useQuery } from '@tanstack/react-query'
import { getProjectionWithOpenPeriods } from '@/lib/api/periods'

export function useProjection(monthsAhead: number = 12) {
  return useQuery({
    queryKey: ['projection', monthsAhead],
    queryFn: () => getProjectionWithOpenPeriods(monthsAhead),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false,
  })
}
