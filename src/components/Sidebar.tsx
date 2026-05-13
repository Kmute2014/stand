import React, { useState } from 'react';
import { useAppContext } from '../store';
import { LayoutDashboard, MessageSquare, Smile, Users, Clock, Edit3, History, LogOut, Settings, Lock, KanbanSquare, Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, currentUser } = useAppContext();
  const isAdmin = currentUser?.role === 'Admin';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut(auth);
  };

  const navItems = [
    {
      group: 'Overview', items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 opacity-80 current-icon" /> },
      ]
    },
    {
      group: 'Project Management', items: [
        { id: 'projects', label: 'Projects', icon: <KanbanSquare className="w-4 h-4 opacity-80 current-icon" /> },
        { id: 'sprintboard', label: 'Sprint Board', icon: <KanbanSquare className="w-4 h-4 opacity-80 current-icon" /> },
      ]
    },
    {
      group: 'Admin', items: [
        { id: 'users', label: 'Users', icon: <Users className="w-4 h-4 opacity-80 current-icon" />, adminOnly: true },
        { id: 'schedule', label: 'Schedule', icon: <Clock className="w-4 h-4 opacity-80 current-icon" />, badge: 'On', badgeType: 'green', adminOnly: true },
      ]
    },

    {
      group: 'My Standup', items: [
        { id: 'myhistory', label: 'My History', icon: <History className="w-4 h-4 opacity-80 current-icon" /> },
        { id: 'responses', label: 'Responses', icon: <MessageSquare className="w-4 h-4 opacity-80 current-icon" />, badge: '3' },
        { id: 'mood', label: 'Team Mood', icon: <Smile className="w-4 h-4 opacity-80 current-icon" /> },
        { id: 'reports', label: 'Reports', icon: <Edit3 className="w-4 h-4 opacity-80 current-icon" /> },
      ]
    },
    {
      group: 'Settings', items: [
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 opacity-80 current-icon" /> },
      ]
    },
  ];

  return (
    <>
      {/* Mobile hamburger menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-screen z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg shrink-0">
              P
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
                const isLocked = (item as any).adminOnly && !isAdmin;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'ai-agent') {
                        // Trigger AI Agent modal
                        const event = new CustomEvent('openAIAgent');
                        window.dispatchEvent(event);
                      } else {
                        setCurrentPage(item.id);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${item.id === 'ai-agent' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium' : isActive ? 'bg-blue-600 text-white font-medium' : isLocked ? 'text-slate-600 hover:bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800'}`}
                  >
                    <div className={`${isActive ? 'opacity-80' : isLocked ? 'opacity-30' : 'opacity-60'}`}>
                      {item.icon}
                    </div>
                    <span className={isLocked ? 'opacity-40' : ''}>{item.label}</span>
                    {isLocked && (
                      <Lock className="w-3 h-3 ml-auto text-slate-600 opacity-60" />
                    )}
                    {!isLocked && item.badge && (
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
              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                {currentUser?.email || ''}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                {isAdmin ? 'Admin' : 'User'}
              </span>
              <button
                onClick={handleSignOut}
                className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
