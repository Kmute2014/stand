import React from 'react';
import { useAppContext } from '../store';
import { ReportSidebar } from '../components/ReportSidebar';

export const Reports: React.FC = () => {
  const { currentUser } = useAppContext();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate and export reports on standup responses and project management data.</p>
      </div>
      
      <ReportSidebar />
    </div>
  );
};
