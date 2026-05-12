import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import {
  FileText, Calendar, Users, Filter, Download,
  ChevronUp, Activity, AlertTriangle, Smile, BarChart3, X
} from 'lucide-react';

interface ReportFilters {
  startDate: string;
  endDate: string;
  selectedUser: string;
}

export const ReportSidebar: React.FC = () => {
  const { responses, users } = useAppContext();
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
        responseDate.setHours(0, 0, 0, 0); // Set to start of day
        return responseDate >= start;
      });
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      filtered = filtered.filter(response => {
        const responseDate = parseResponseDate(response.date);
        responseDate.setHours(23, 59, 59, 999); // Set to end of day
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
          ? filteredResponses.reduce((sum, r) => sum + r.mood.score, 0) / filteredResponses.length
          : 0,
        moodDistribution: filteredResponses.reduce((acc, r) => {
          acc[r.mood.emoji] = (acc[r.mood.emoji] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      responses: filteredResponses.map(response => ({
        date: response.date,
        userName: users.find(u => u.id === response.userId)?.name || 'Unknown User',
        time: response.time,
        yesterday: response.yesterday,
        today: response.today,
        blockers: response.blockers,
        moodScore: response.mood.score,
        moodEmoji: response.mood.emoji
      }))
    };
    return reportData;
  };

  // Export to PDF
  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const reportData = generateReportData();

    try {
      const pdf = new jsPDF();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text(reportData.title, 20, yPosition);
      yPosition += 15;

      // Date range and filter info
      pdf.setFontSize(12);
      pdf.text(`Date Range: ${reportData.dateRange}`, 20, yPosition);
      pdf.text(`User Filter: ${reportData.userFilter}`, 20, yPosition + 10);
      yPosition += 30;

      // Summary section
      pdf.setFontSize(14);
      pdf.text('Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Total Responses: ${reportData.summary.totalResponses}`, 20, yPosition);
      pdf.text(`Average Mood Score: ${reportData.summary.averageMood.toFixed(1)}`, 20, yPosition + 10);
      yPosition += 30;

      // Table headers
      pdf.setFontSize(12);
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
    <div className="w-full bg-white rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6" />
          <h2 className="text-xl font-bold">Reports</h2>
        </div>
        <p className="text-sm opacity-90">Generate reports from standup responses</p>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-slate-200 space-y-4">
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
            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* User Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">User</label>
          <select
            value={filters.selectedUser}
            onChange={(e) => setFilters(prev => ({ ...prev, selectedUser: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Preview */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Report Preview
          </h3>

          {filteredResponses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p>No responses found for the selected criteria.</p>
              <p className="text-sm">Try adjusting the filters to see more results.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Total Responses</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{filteredResponses.length}</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Smile className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Average Mood</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredResponses.length > 0
                      ? (filteredResponses.reduce((sum, r) => sum + r.mood.score, 0) / filteredResponses.length).toFixed(1)
                      : '0'
                    }
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Date Range</span>
                  </div>
                  <div className="text-sm font-bold text-amber-600">
                    {filters.startDate && filters.endDate
                      ? `${filters.startDate} to ${filters.endDate}`
                      : 'All time'
                    }
                  </div>
                </div>
              </div>

              {/* Recent Responses */}
              <div className="bg-slate-50 rounded-lg border border-slate-200">
                <div className="p-4">
                  <h4 className="font-medium text-slate-800 mb-3">Recent Responses</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredResponses.slice(0, 10).map((response, index) => (
                      <div key={response.id} className="p-3 bg-white rounded border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-900">{users.find(u => u.id === response.userId)?.name || 'Unknown User'}</span>
                          <span className="text-xs text-slate-500">{response.date}</span>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div><strong>Yesterday:</strong> {response.yesterday}</div>
                          <div><strong>Today:</strong> {response.today}</div>
                          {response.blockers && response.blockers.toLowerCase() !== 'no' && (
                            <div><strong>Blockers:</strong> {response.blockers}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg">{response.mood.emoji}</span>
                          <span className="text-xs text-slate-500">Score: {response.mood.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Actions */}
        {filteredResponses.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
