import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { DataRow } from '../types';
import { Search, Download } from 'lucide-react';

interface DataTableProps {
  data: DataRow[];
  threshold: number;
  showHighlight: boolean;
}

interface PivotData {
  [jobDescription: string]: {
    [empName: string]: {
      [checkDate: string]: number;
    };
  };
}

export function DataTable({ data, threshold, showHighlight }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const pivotedData = useMemo(() => {
    const pivot: PivotData = {};
    
    console.log('Processing data in DataTable:', data.slice(0, 5));
    
    data.forEach((row) => {
      const jobDescription = String(row.JobDescription || 'Unknown');
      const empName = String(row.EmpName || 'Unknown');
      const checkDate = String(row.CheckDate || 'Unknown');
      const sickHours = Number(row.ESSickHours) || 0;
      const waliHours = Number(row.EWALIWALIHours) || 0;
      const totalHours = sickHours + waliHours;

      if (!pivot[jobDescription]) {
        pivot[jobDescription] = {};
      }
      if (!pivot[jobDescription][empName]) {
        pivot[jobDescription][empName] = {};
      }
      if (!pivot[jobDescription][empName][checkDate]) {
        pivot[jobDescription][empName][checkDate] = 0;
      }

      pivot[jobDescription][empName][checkDate] += totalHours;
    });

    return pivot;
  }, [data]);

  const allCheckDates = useMemo(() => {
    const uniqueDates = new Set<string>();
    data.forEach(row => {
      if (row.CheckDate) {
        uniqueDates.add(String(row.CheckDate));
      }
    });
    return Array.from(uniqueDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [data]);

  const filteredJobDescriptions = Object.keys(pivotedData).filter((jobDesc) =>
    jobDesc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getThresholdCount = (jobDescription: string, date: string): number => {
    return Object.values(pivotedData[jobDescription]).reduce((count, dates) => {
      const hours = dates[date] || 0;
      return count + (hours >= threshold ? 1 : 0);
    }, 0);
  };

  const exportToExcel = () => {
    const flattenedData: any[] = [];

    Object.entries(pivotedData).forEach(([jobDescription, employees]) => {
      Object.entries(employees).forEach(([empName, dates]) => {
        const row: any = { JobDescription: jobDescription, Employee: empName };
        allCheckDates.forEach(date => {
          row[date] = dates[date] || 0;
        });
        flattenedData.push(row);
      });

      // Add the count row for this JobDescription group
      const countRow: any = { JobDescription: `COUNT ≥ ${threshold} HRS`, Employee: '' };
      allCheckDates.forEach(date => {
        countRow[date] = getThresholdCount(jobDescription, date);
      });
      flattenedData.push(countRow);

      // Add a blank row for spacing
      flattenedData.push({});
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Hours');

    XLSX.writeFile(workbook, 'Employee_Hours_Report.xlsx');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search job descriptions..."
              className="pl-8 pr-3 py-1.5 w-64 text-sm border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          <Download className="h-4 w-4 mr-1.5" />
          Export to Excel
        </button>
      </div>

      {filteredJobDescriptions.map((jobDescription) => (
        <div key={jobDescription} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">{jobDescription}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  {allCheckDates.map((date) => (
                    <th
                      key={date}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(pivotedData[jobDescription]).map(([empName, dates]) => (
                  <tr key={empName} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {empName}
                    </td>
                    {allCheckDates.map((date) => {
                      const totalHours = dates[date] || 0;
                      const isHighlighted = showHighlight && totalHours >= threshold;
                      
                      return (
                        <td
                          key={date}
                          className={`px-4 py-2 whitespace-nowrap text-xs text-gray-500 ${
                            isHighlighted ? 'bg-green-100' : ''
                          }`}
                        >
                          {totalHours.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-4 py-2 whitespace-nowrap text-xs font-medium bg-black text-white rounded-sm uppercase">
                    COUNT ≥ {threshold} HRS
                  </td>
                  {allCheckDates.map((date) => {
                    const count = getThresholdCount(jobDescription, date);
                    return (
                      <td
                        key={date}
                        className={`px-4 py-2 whitespace-nowrap text-xs font-medium ${
                          count > 0 ? 'text-green-600 font-bold' : 'text-gray-400'
                        }`}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
