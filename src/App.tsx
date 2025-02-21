import React, { useState } from 'react';
import Papa from 'papaparse';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { Dashboard } from './components/Dashboard';
import { DataRow } from './types';
import { LayoutDashboard, Table, Play } from 'lucide-react';

function App() {
  const [data, setData] = useState<DataRow[]>([]);
  const [view, setView] = useState<'dashboard' | 'table'>('table');
  const [threshold, setThreshold] = useState<number>(40);
  const [showHighlight, setShowHighlight] = useState(false);

  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const parsedData = results.data as DataRow[];
        
        // Get unique CheckDates and sort them chronologically
        const uniqueDates = [...new Set(parsedData.map(row => row.CheckDate))]
          .filter(date => date) // Remove null/undefined values
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        console.log('Raw data sample:', parsedData.slice(0, 5));
        console.log('All unique CheckDates found in CSV:', uniqueDates);
        console.log('Total number of rows:', parsedData.length);
        
        // Log all unique values in the CheckDate column
        const allCheckDates = parsedData.map(row => row.CheckDate);
        console.log('All CheckDate values (including duplicates):', allCheckDates);
        
        setData(parsedData);
        setShowHighlight(false);
      },
    });
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(0, Number(e.target.value)), 80);
    setThreshold(value);
    setShowHighlight(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Employee Hours Report
          </h1>
          <FileUpload onFileUpload={handleFileUpload} />
        </div>

        {data.length > 0 && (
          <>
            <div className="mb-4 flex items-center space-x-3">
              <button
                className={`flex items-center px-3 py-1.5 text-sm rounded-lg ${
                  view === 'table'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setView('table')}
              >
                <Table className="h-4 w-4 mr-1.5" />
                Table View
              </button>
{/*               <button
                className={`flex items-center px-3 py-1.5 text-sm rounded-lg ${
                  view === 'dashboard'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setView('dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Dashboard
              </button> */}
              <div className="flex items-center space-x-2 ml-2">
                <label htmlFor="threshold" className="text-xs font-medium text-gray-700">
                  Hours Threshold:
                </label>
                <input
                  type="number"
                  id="threshold"
                  min="0"
                  max="80"
                  value={threshold}
                  onChange={handleThresholdChange}
                  className="w-16 px-2 py-1 text-sm border rounded-md"
                />
                <button
                  onClick={() => setShowHighlight(true)}
                  className="flex items-center px-3 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600"
                >
                  <Play className="h-4 w-4 mr-1.5" />
                  Process
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {view === 'table' ? (
                <DataTable 
                  data={data} 
                  threshold={threshold}
                  showHighlight={showHighlight}
                />
              ) : (
                <Dashboard data={data} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
