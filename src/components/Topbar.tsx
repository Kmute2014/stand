import React from 'react';
import { useAppContext } from '../store';
import { Bell, Plus } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { currentPage, sendReminders, showToast, setEditingResponse } = useAppContext();

  const pageNames: Record<string, string> = {
    dashboard: 'Dashboard',
    responses: 'All Responses',
    mood: 'Team Mood',
    users: 'Team Members',
    schedule: 'Schedule',
    myhistory: 'My History'
  };

  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <h2 className="text-lg font-semibold text-slate-700">{pageNames[currentPage] || 'Dashboard'} &bull; {todayStr}</h2>
      <div className="flex items-center gap-4">
        <div className="text-right mr-4 hidden sm:block">
          <p className="text-xs text-slate-500 font-medium tracking-wide mb-0.5">NEXT AUTOMATIC EMAIL</p>
          <p className="text-sm font-bold text-slate-700">Tomorrow, 09:00 AM</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setEditingResponse({} as any)}>
          <Plus className="w-4 h-4" /> New Stand Up Today
        </button>
        <button className="btn bg-white" onClick={() => document.getElementById('modal-add-user')?.classList.add('show')}>
          + Add Member
        </button>
      </div>
    </header>
  );
};
