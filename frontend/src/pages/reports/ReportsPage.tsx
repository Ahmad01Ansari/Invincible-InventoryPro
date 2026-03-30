import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter, Loader2, TableProperties } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { downloadCSV } from '@/utils/csvExport';

type ReportType = 'sales' | 'purchases' | 'inventory' | 'stock-logs';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  
  // Quick date selector or custom
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Automatically calculate dates when clicking pre-sets
  const handleDatePreset = (preset: string) => {
    setDateRange(preset);
    const end = new Date();
    const start = new Date();
    
    if (preset === '7days') start.setDate(end.getDate() - 7);
    else if (preset === '30days') start.setDate(end.getDate() - 30);
    else if (preset === 'thisMonth') start.setDate(1);
    
    // Custom means user inputs it manually, skip auto formatting
    if (preset !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  // On mount, set default to 30days
  if (!startDate && dateRange === '30days') handleDatePreset('30days');

  // React Query fetch logic
  const { data: reportData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report', reportType, startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (reportType !== 'inventory') { // Inventory is always real-time snapshot
        if (startDate) params.startDate = new Date(startDate).toISOString();
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          params.endDate = end.toISOString();
        }
      }
      const res = await api.get(`/reports/${reportType}`, { params });
      return res.data;
    },
    enabled: true, // Auto fetch
  });

  const handleExport = () => {
    if (!reportData || reportData.length === 0) {
      return toast.error('No data available to export');
    }
    downloadCSV(reportData, `${reportType}_report`);
    toast.success(`Exported ${reportData.length} records!`);
  };

  // Grab headers for dynamic preview table
  const headers = reportData && reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Exports</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate deep analytical insights and download raw CSV data.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" /> Report Parameters
          </CardTitle>
          <CardDescription>Select the data entity and apply filtering boundaries.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Data Entity</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={reportType}
                onChange={e => setReportType(e.target.value as ReportType)}
              >
                <option value="sales">Sales & Revenue</option>
                <option value="purchases">Purchasing & Vendor Spends</option>
                <option value="inventory">Current Inventory Valuations</option>
                <option value="stock-logs">Physical Stock Movement Audit</option>
              </select>
            </div>

            {reportType !== 'inventory' && (
              <>
                <div className="space-y-2">
                  <Label>Date Preset</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={dateRange}
                    onChange={e => handleDatePreset(e.target.value)}
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="thisMonth">This Month</option>
                    <option value="custom">Custom Range...</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setDateRange('custom'); }} />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setDateRange('custom'); }} />
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button onClick={() => refetch()} disabled={isFetching} variant="secondary">
              {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Apply Filters
            </Button>
            <Button onClick={handleExport} disabled={!reportData || reportData.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Raw Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2"><TableProperties className="w-5 h-5 text-muted-foreground" /> Data Preview</span>
            <span className="text-sm font-normal text-muted-foreground border px-2 py-0.5 rounded-full bg-muted/50">
              {reportData?.length || 0} Records
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="overflow-x-auto">
            {isFetching ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                Generating comprehensive report...
              </div>
            ) : reportData && reportData.length > 0 ? (
              <table className="w-full text-sm font-mono whitespace-nowrap">
                <thead className="bg-muted/50">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left tracking-tight border-b text-muted-foreground uppercase text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Limit preview to 50 items so DOM doesn't freeze on massive reports */}
                  {reportData.slice(0, 50).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      {headers.map((h, j) => (
                        <td key={j} className="px-4 py-2 border-r last:border-r-0 max-w-[200px] truncate">
                          {row[h] === null || row[h] === undefined ? '-' : String(row[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <TableProperties className="w-8 h-8 opacity-50" />
                </div>
                <p>No mathematical data bound within this boundary query.</p>
              </div>
            )}
            {reportData?.length > 50 && (
              <div className="bg-muted/50 p-3 text-center text-xs text-muted-foreground border-t">
                Showing first 50 rows. Export to CSV to see all {reportData.length} records.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
