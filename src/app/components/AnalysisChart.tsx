// components/AnalysisChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AnalysisChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function AnalysisChart({ data }: AnalysisChartProps) {
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#8884d8" />
    </BarChart>
  );
}