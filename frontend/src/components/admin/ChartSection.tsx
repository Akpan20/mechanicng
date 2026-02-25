// ChartSection.tsx (data optional)
import { FC } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export interface ChartDataPoint {
  date: string // e.g. "2025-03-01"
  impressions: number
  clicks: number
}

interface ChartSectionProps {
  data?: ChartDataPoint[]
  title?: string
}

export const ChartSection: FC<ChartSectionProps> = ({ data = [], title = 'Performance over time' }) => {
  const hasData = data.length > 0

  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {!hasData ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No chart data available yet.
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" tick={{ fill: '#aaa', fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="#888" tick={{ fill: '#aaa' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{ fill: '#aaa' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a27', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#ccc' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}