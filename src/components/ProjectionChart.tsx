"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Period } from "@/lib/models/period";

type ProjectionChartProps = {
  periods: Period[];
  monthlyLimit?: number | null;
};

type ChartDataPoint = {
  period: string;
  purchase: number;
  subscription: number;
  total: number;
};

export default function ProjectionChart({ periods, monthlyLimit }: ProjectionChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    // Convert periods to chart data
    return periods.map((period) => {
      // Group payments by expense type
      const grouped = period.payments.reduce((acc, payment) => {
        if (payment.expenseType === 'purchase') {
          acc.purchase += payment.amount;
        } else if (payment.expenseType === 'subscription') {
          acc.subscription += payment.amount;
        }
        return acc;
      }, { purchase: 0, subscription: 0 });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[period.month - 1];
      const yearShort = period.year.toString().slice(2);

      return {
        period: `${monthName} ${yearShort}`,
        purchase: grouped.purchase,
        subscription: grouped.subscription,
        total: grouped.purchase + grouped.subscription,
      };
    });
  }, [periods]);

  // Calculate max value for Y axis to ensure monthly limit is visible
  const maxValue = useMemo(() => {
    const maxTotal = Math.max(...chartData.map(d => d.total), 0);
    if (monthlyLimit && monthlyLimit > 0) {
      // Ensure the chart shows at least up to the monthly limit + 10% margin
      return Math.max(maxTotal, monthlyLimit) * 1.1;
    }
    return maxTotal * 1.1;
  }, [chartData, monthlyLimit]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-slate-900/40">
        <p className="text-sm text-slate-500 dark:text-slate-400">No data available for projections</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900/40">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Monthly Projections</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Expenses by period with monthly limit reference
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="currentColor"
            className="text-slate-200 dark:text-white/10"
          />
          <XAxis 
            dataKey="period" 
            stroke="currentColor"
            className="text-slate-600 dark:text-slate-400"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="currentColor"
            className="text-slate-600 dark:text-slate-400"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            domain={[0, maxValue]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(30 41 59)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
            }}
            formatter={(value: number) => `$${value.toLocaleString('es-AR')}`}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '12px',
            }}
          />
          
          {/* Monthly limit reference line - only if set and > 0 */}
          {monthlyLimit && monthlyLimit > 0 && (
            <ReferenceLine 
              y={monthlyLimit} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: `Limit: $${monthlyLimit.toLocaleString('es-AR')}`, 
                position: 'top',
                fill: '#ef4444',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          )}
          
          {/* Stacked bars with conditional red border */}
          <Bar 
            dataKey="purchase" 
            stackId="a" 
            fill="#3b82f6"
            name="Purchases"
            radius={[0, 0, 4, 4]}
            activeBar={{ strokeWidth: 0.5, stroke: 'rgba(255, 255, 255, 0.3)' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-purchase-${index}`}
                stroke={monthlyLimit && monthlyLimit > 0 && entry.total > monthlyLimit ? '#ef4444' : undefined}
                strokeWidth={monthlyLimit && monthlyLimit > 0 && entry.total > monthlyLimit ? 3 : 0}
              />
            ))}
          </Bar>
          <Bar 
            dataKey="subscription" 
            stackId="a" 
            fill="#10b981"
            name="Subscriptions"
            radius={[4, 4, 0, 0]}
            activeBar={{ strokeWidth: 0.5, stroke: 'rgba(255, 255, 255, 0.3)' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-subscription-${index}`}
                stroke={monthlyLimit && monthlyLimit > 0 && entry.total > monthlyLimit ? '#ef4444' : undefined}
                strokeWidth={monthlyLimit && monthlyLimit > 0 && entry.total > monthlyLimit ? 3 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
