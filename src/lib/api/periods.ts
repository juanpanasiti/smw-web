import apiClient from './client'
import type { Period } from '../models/period'
import { parsePeriodFromApi } from '../parsers/period'

export async function getProjection(monthsAhead: number = 12): Promise<Period[]> {
  const response = await apiClient.get('/api/v3/periods/projection', {
    params: { months_ahead: monthsAhead },
  })
  return response.data.map(parsePeriodFromApi)
}

export async function getPeriod(month: number, year: number): Promise<Period> {
  const response = await apiClient.get(`/api/v3/periods/${month}/${year}`)
  return parsePeriodFromApi(response.data)
}

// Helper to get previous month/year
function getPreviousMonthYear(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 }
  }
  return { month: month - 1, year }
}

export async function getProjectionWithOpenPeriods(monthsAhead: number = 12): Promise<Period[]> {
  // Get initial projection
  const periods = await getProjection(monthsAhead)
  
  if (periods.length === 0) {
    return periods
  }

  // Check if first period is open
  const firstPeriod = periods[0]
  if (!firstPeriod.isOpen) {
    return periods
  }

  // Fetch previous open periods recursively
  const previousPeriods: Period[] = []
  let { month, year } = getPreviousMonthYear(firstPeriod.month, firstPeriod.year)
  
  // Keep fetching previous periods while they are open
  for (let i = 0; i < 24; i++) { // Safety limit of 24 months backwards
    try {
      const prevPeriod = await getPeriod(month, year)
      
      if (!prevPeriod.isOpen) {
        // Stop searching when we find a closed period
        break
      }
      
      // Add to beginning of array (we're going backwards)
      previousPeriods.unshift(prevPeriod)
      
      // Move to previous month
      const prev = getPreviousMonthYear(month, year)
      month = prev.month
      year = prev.year
    } catch {
      // Stop if period doesn't exist or error occurs
      break
    }
  }
  
  // Combine previous periods with original projection
  return [...previousPeriods, ...periods]
}

