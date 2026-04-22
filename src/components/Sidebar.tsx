import React from 'react';
import { useAppContext } from '../store';
import { LayoutDashboard, MessageSquare, Smile, Users, Clock, Edit3, History, LogOut, Settings } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, currentUser } = useAppContext();

  const handleSignOut = () => {
    signOut(auth);
  };

  const isAdmin = currentUser?.role === 'Admin';

  const navItems = [
    {
      group: 'Overview', items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 opacity-80 current-icon" /> },
        { id: 'responses', label: 'Responses', icon: <MessageSquare className="w-4 h-4 opacity-80 current-icon" />, badge: '3' },
        { id: 'mood', label: 'Team Mood', icon: <Smile className="w-4 h-4 opacity-80 current-icon" /> },
      ]
    },
    ...(isAdmin ? [{
      group: 'Admin', items: [
        { id: 'users', label: 'Users', icon: <Users className="w-4 h-4 opacity-80 current-icon" /> },
        { id: 'schedule', label: 'Schedule', icon: <Clock className="w-4 h-4 opacity-80 current-icon" />, badge: 'On', badgeType: 'green' },
      ]
    }] : []),

    {
      group: 'My Standup', items: [
        { id: 'standup', label: 'Submit Today', icon: <Edit3 className="w-4 h-4 opacity-80 current-icon" /> },
        { id: 'myhistory', label: 'My History', icon: <History className="w-4 h-4 opacity-80 current-icon" /> },
      ]
    },
    {
      group: 'Settings', items: [
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 opacity-80 current-icon" /> },
      ]
    },
  ];

  return (
    <nav className="w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-screen z-50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg shrink-0">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">StandUpPhelo</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((group, idx) => (
          <div key={idx} className="mb-4">
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 px-3 mb-2">{group.group}</div>
            {group.items.map(item => {
              const isActive = currentPage === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <div className={`${isActive ? 'opacity-80' : 'opacity-60'}`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto font-bold text-[10px] px-2 py-0.5 rounded ${item.badgeType === 'green' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
            {currentUser?.initials || ''}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate text-white">{currentUser?.name || ''}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser?.email || ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-auto w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
