import React from 'react';
import { DataRow, ChartData } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardProps {
  data: DataRow[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function Dashboard({ data }: DashboardProps) {
  if (!data.length) return null;

  // Get numeric columns for visualization
  const numericColumns = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] === 'number'
  );

  if (!numericColumns.length) return null;

  // Prepare data for the first numeric column
  const primaryMetric = numericColumns[0];
  
  // Filter out entries with null or undefined values
  const validData = data.filter(
    (row) => row[Object.keys(row)[0]] != null && row[primaryMetric] != null
  );

  // Group and aggregate the data
  const aggregatedData = Object.entries(
    validData.reduce((acc: { [key: string]: number }, row) => {
      const key = String(row[Object.keys(row)[0]]);
      acc[key] = (acc[key] || 0) + Number(row[primaryMetric]);
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .slice(0, 5);

  if (!aggregatedData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-gray-500 text-center">
          No valid numeric data available for visualization
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Bar Chart</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aggregatedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Pie Chart</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={aggregatedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {aggregatedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}