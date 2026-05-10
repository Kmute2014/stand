import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import {
  FileText, Calendar, Users, Filter, X, Download, ChevronDown,
  ChevronUp, Activity, AlertTriangle, Smile, BarChart3
} from 'lucide-react';

interface ReportFilters {
  startDate: string;
  endDate: string;
  selectedUser: string;
}

export const ReportSidebar: React.FC = () => {
  const { responses, users } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    selectedUser: 'all'
  });

  // Calculate date range (last 30 days by default)
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Initialize with default date range
  React.useEffect(() => {
    const defaultRange = getDefaultDateRange();
    setFilters(prev => ({
      ...prev,
      ...defaultRange
    }));
  }, []);

  // Helper function to convert response date format to Date object
  const parseResponseDate = (dateString: string): Date => {
    if (!dateString) return new Date(0); // Return invalid date for empty strings

    // Response date format from form is like "May 4" (month day)
    // We need to add the current year to make it a valid date
    const currentYear = new Date().getFullYear();
    const parts = dateString.split(' ');

    if (parts.length === 2) {
      const [month, day] = parts; // Note: month comes first from the form
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(month);

      if (monthIndex !== -1 && !isNaN(parseInt(day))) {
        return new Date(currentYear, monthIndex, parseInt(day));
      }
    }

    // Fallback - try to parse as regular date
    const fallbackDate = new Date(dateString);
    return isNaN(fallbackDate.getTime()) ? new Date(0) : fallbackDate;
  };

  // Filter responses based on selected criteria
  const filteredResponses = useMemo(() => {
    let filtered = [...responses];

    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0); // Set to start of day

      filtered = filtered.filter(response => {
        const responseDate = parseResponseDate(response.date);
        return responseDate >= start;
      });
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      filtered = filtered.filter(response => {
        const responseDate = parseResponseDate(response.date);
        return responseDate <= end;
      });
    }

    // Filter by user
    if (filters.selectedUser !== 'all') {
      filtered = filtered.filter(response => response.userId === filters.selectedUser);
    }

    return filtered;
  }, [responses, filters.startDate, filters.endDate, filters.selectedUser]);

  // Generate report data
  const generateReportData = () => {
    const reportData = {
      title: 'Standup Responses Report',
      dateRange: `${filters.startDate} to ${filters.endDate}`,
      userFilter: filters.selectedUser === 'all' ? 'All Users' : users.find(u => u.id === filters.selectedUser)?.name,
      summary: {
        totalResponses: filteredResponses.length,
        averageMood: filteredResponses.length > 0
          ? (filteredResponses.reduce((sum, r) => sum + r.mood.score, 0) / filteredResponses.length).toFixed(1)
          : '0',
        totalBlockers: filteredResponses.filter(r => r.blockers.toLowerCase() !== 'no').length
      },
      responses: filteredResponses.map(response => {
        const user = users.find(u => u.id === response.userId);
        return {
          date: response.date,
          userName: user?.name || 'Unknown',
          time: response.time,
          yesterday: response.yesterday,
          today: response.today,
          blockers: response.blockers,
          moodScore: response.mood.score,
          moodEmoji: response.mood.emoji
        };
      })
    };

    return reportData;
  };

  // Export to PDF using html2canvas and jsPDF
  const exportToPDF = async () => {
    try {
      // Dynamically import jsPDF and html2canvas
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF();
      const reportData = generateReportData();

      // Add title
      pdf.setFontSize(20);
      pdf.text(reportData.title, 20, 20);

      // Add date range and filter info
      pdf.setFontSize(12);
      pdf.text(`Date Range: ${reportData.dateRange}`, 20, 35);
      pdf.text(`User Filter: ${reportData.userFilter}`, 20, 45);

      // Add summary
      pdf.setFontSize(14);
      pdf.text('Summary', 20, 60);
      pdf.setFontSize(10);
      pdf.text(`Total Responses: ${reportData.summary.totalResponses}`, 20, 70);
      pdf.text(`Average Mood: ${reportData.summary.averageMood}`, 20, 80);
      pdf.text(`Total Blockers: ${reportData.summary.totalBlockers}`, 20, 90);

      // Add responses table
      pdf.setFontSize(14);
      pdf.text('Responses', 20, 110);

      let yPosition = 120;
      pdf.setFontSize(8);

      // Table headers
      pdf.text('Date', 20, yPosition);
      pdf.text('User', 50, yPosition);
      pdf.text('Yesterday', 80, yPosition);
      pdf.text('Today', 120, yPosition);
      pdf.text('Blockers', 160, yPosition);
      yPosition += 10;

      // Table data
      reportData.responses.forEach((response, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.text(response.date, 20, yPosition);
        pdf.text(response.userName, 50, yPosition);

        // Truncate long text
        const yesterday = response.yesterday.length > 20 ? response.yesterday.substring(0, 20) + '...' : response.yesterday;
        const today = response.today.length > 20 ? response.today.substring(0, 20) + '...' : response.today;
        const blockers = response.blockers.length > 20 ? response.blockers.substring(0, 20) + '...' : response.blockers;

        pdf.text(yesterday, 80, yPosition);
        pdf.text(today, 120, yPosition);
        pdf.text(blockers, 160, yPosition);
        yPosition += 15;
      });

      // Save the PDF
      pdf.save(`standup-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const reportData = generateReportData();

    let csvContent = 'Date,User Name,Time,Yesterday,Today,Blockers,Mood Score,Mood Emoji\n';
    reportData.responses.forEach(response => {
      csvContent += `"${response.date}","${response.userName}","${response.time}","${response.yesterday}","${response.today}","${response.blockers}","${response.moodScore}","${response.moodEmoji}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `standup-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const defaultRange = getDefaultDateRange();

  const clearFilters = () => {
    setFilters({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      selectedUser: 'all'
    });
  };

  const hasActiveFilters = filters.selectedUser !== 'all' ||
    filters.startDate !== defaultRange.startDate ||
    filters.endDate !== defaultRange.endDate;

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl transition-all duration-300 z-40 ${isExpanded ? 'w-96' : 'w-16'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        {isExpanded ? <X className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6" />
              <h2 className="text-xl font-bold">Reports</h2>
            </div>
            <p className="text-sm opacity-90">Generate reports from standup responses</p>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">User</label>
              <select
                value={filters.selectedUser}
                onChange={(e) => setFilters(prev => ({ ...prev, selectedUser: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Standup Report Preview
              </h3>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{filteredResponses.length}</div>
                  <div className="text-xs text-blue-700">Total Responses</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {filteredResponses.length > 0
                      ? (filteredResponses.reduce((sum, r) => sum + r.mood.score, 0) / filteredResponses.length).toFixed(1)
                      : '0'}
                  </div>
                  <div className="text-xs text-green-700">Avg Mood</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {filteredResponses.filter(r => r.blockers.toLowerCase() !== 'no').length}
                  </div>
                  <div className="text-xs text-red-700">Blockers</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {new Set(filteredResponses.map(r => r.userId)).size}
                  </div>
                  <div className="text-xs text-purple-700">Unique Users</div>
                </div>
              </div>

              {/* Recent Responses */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Recent Responses</h4>
                {filteredResponses.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No responses found for selected filters
                  </div>
                ) : (
                  filteredResponses.slice(0, 5).map(response => {
                    const user = users.find(u => u.id === response.userId);
                    return (
                      <div key={response.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{user?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{response.date}</span>
                            <span className="text-lg">{response.mood.emoji}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-blue-600">Yesterday:</span>
                            <span className="text-slate-600 line-clamp-2">{response.yesterday}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-green-600">Today:</span>
                            <span className="text-slate-600 line-clamp-2">{response.today}</span>
                          </div>
                          {response.blockers.toLowerCase() !== 'no' && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-red-600">Blockers:</span>
                              <span className="text-red-600 line-clamp-2">{response.blockers}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {filteredResponses.length > 5 && (
                  <div className="text-center text-xs text-slate-500 pt-2">
                    ... and {filteredResponses.length - 5} more responses
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
