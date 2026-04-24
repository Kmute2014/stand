import React from 'react';
import { X, Calendar, Users, AlertTriangle, Smile, Clock } from 'lucide-react';
import { StandupResponse, User } from '../types';

interface DatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  responses: StandupResponse[];
  users: User[];
  filteredResponses?: StandupResponse[];
}

export const DatePreviewModal: React.FC<DatePreviewModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  responses,
  users,
  filteredResponses,
}) => {
  if (!isOpen) return null;

  // Use filtered responses if provided, otherwise use all responses
  const responsesToUse = filteredResponses || responses;

  // Filter responses for the selected date
  const dateResponses = responsesToUse.filter(r =>
    r.date === selectedDate
  );

  // Calculate statistics
  const totalResponses = dateResponses.length;
  const blockersCount = dateResponses.filter(r => r.blockers.toLowerCase() !== 'no').length;
  const avgMood = totalResponses > 0
    ? (dateResponses.reduce((sum, r) => sum + r.mood.score, 0) / totalResponses).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">{selectedDate}</h2>
                <p className="text-blue-100">Standup Summary</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Total Responses</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalResponses}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Smile className="w-4 h-4" />
                <span className="text-sm font-medium">Avg Mood</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{avgMood}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Blockers</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{blockersCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Completion Rate</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalResponses > 0 ? Math.round((totalResponses / users.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Responses List */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 300px)' }}>
          {dateResponses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No standup responses found for {selectedDate}</p>
              <p className="text-gray-400 text-sm mt-2">Try selecting a different date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dateResponses.map((response) => {
                const user = users.find(u => u.id === response.userId);
                if (!user) return null;

                return (
                  <div key={response.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.avatarColor}`}>
                          {user.initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">{response.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{response.mood.emoji}</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                          {response.mood.score}/5
                        </span>
                        {response.blockers.toLowerCase() !== 'no' && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                            Blocker
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Yesterday</h4>
                        <p className="text-sm text-gray-700">{response.yesterday}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Today</h4>
                        <p className="text-sm text-gray-700">{response.today}</p>
                      </div>
                      <div className={`${response.blockers.toLowerCase() !== 'no' ? 'bg-red-50' : 'bg-gray-50'} p-3 rounded-lg`}>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${response.blockers.toLowerCase() !== 'no' ? 'text-red-700' : 'text-gray-700'}`}>
                          Blockers
                        </h4>
                        <p className={`text-sm ${response.blockers.toLowerCase() !== 'no' ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                          {response.blockers}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
