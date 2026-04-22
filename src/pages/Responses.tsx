import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Plus, Calendar, FilterX } from 'lucide-react';

export const Responses: React.FC = () => {
  const { responses, users, deleteResponse, setEditingResponse, setCurrentPage } = useAppContext();

  // 1. State for date filtering
  const [filterDate, setFilterDate] = useState<string>('');

  // 2. Filter logic
  const filteredResponses = filterDate
    ? responses.filter(r => r.date === new Date(filterDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
    : responses;

  const clearFilter = () => setFilterDate('');

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">All responses</div>
            <div className="ph-sub">// view · filter · manage daily standup submissions</div>
          </div>
          <div className="ph-actions">
            {/* 3. Action to add a new response */}
            <button
              className="btn btn-sm btn-primary flex items-center gap-2"
              onClick={() => setCurrentPage('standup')}
            >
              <Plus className="w-3.5 h-3.5" /> Add Response
            </button>
            <button className="btn btn-sm">Export CSV</button>
          </div>
        </div>
      </div>

      {/* 4. Filter Bar with Date Picker */}
      <div className="flex gap-2 mb-6 flex-wrap items-center bg-[var(--bg-2)] p-3 rounded-[var(--radius-md)] border border-[var(--border)]">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[var(--border)] rounded-md shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-[var(--text-3)]" />
          <input
            type="date"
            className="text-[12px] border-none outline-none font-medium text-[var(--text-1)]"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <select className="form-input form-select w-fit py-1.5 px-3 text-[12px] bg-white">
          <option>All members</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {filterDate && (
          <button
            onClick={clearFilter}
            className="text-[11px] flex items-center gap-1 text-[var(--red)] font-medium hover:underline ml-2"
          >
            <FilterX className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* 5. Render Filtered Results */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[var(--text-3)] text-sm">No responses found for the selected filters.</p>
        </div>
      ) : (
        filteredResponses.map(r => {
          const u = users.find(user => user.id === r.userId);
          if (!u) return null;

          return (
            <div key={r.id} className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4.5 mb-3 transition-colors hover:border-[var(--border-2)] shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className={`avatar ${u.avatarColor}`}>{u.initials}</div>
                  <div>
                    <div className="text-[13px] font-medium text-[var(--text-1)]">{u.name}</div>
                    <div className="text-[11px] text-[var(--text-3)] font-mono">{r.date} · {r.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.blockers.toLowerCase() !== 'no' ? (
                    <span className="badge b-red">Blocker detected</span>
                  ) : (
                    <span className="badge b-green">No blockers</span>
                  )}
                  <span className="text-[18px]">{r.mood.emoji}</span>
                  <span className="badge b-neutral">{r.mood.score}/5</span>
                  <button className="btn btn-sm" onClick={() => setEditingResponse(r)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm('Delete this standup entry?')) deleteResponse(r.id); }}>Delete</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white/50 rounded-lg">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-3)] mb-1.5">Previous workday</div>
                  <div className="text-[13px] text-[var(--text-2)] leading-relaxed">{r.yesterday}</div>
                </div>
                <div className="p-3 bg-white/50 rounded-lg">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-3)] mb-1.5">Today's plan</div>
                  <div className="text-[13px] text-[var(--text-2)] leading-relaxed">{r.today}</div>
                </div>
                <div className="p-3 bg-white/50 rounded-lg">
                  <div className={`text-[10px] font-medium uppercase tracking-widest mb-1.5 ${r.blockers.toLowerCase() !== 'no' ? 'text-[var(--red)]' : 'text-[var(--text-3)]'}`}>Blocker</div>
                  <div className={`text-[13px] leading-relaxed ${r.blockers.toLowerCase() !== 'no' ? 'text-[var(--text-1)] font-medium' : 'text-[var(--text-3)] font-mono'}`}>
                    {r.blockers}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};