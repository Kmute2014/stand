import React from 'react';
import { useAppContext } from '../store';

export const Responses: React.FC = () => {
  const { responses, users, deleteResponse } = useAppContext();

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">All responses</div>
            <div className="ph-sub">// view · filter · manage daily standup submissions</div>
          </div>
          <div className="ph-actions">
            <button className="btn btn-sm">Export CSV</button>
            <button className="btn btn-sm btn-primary">Weekly digest</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select className="form-input form-select w-fit py-1.5 px-3 text-[12px]"><option>All members</option></select>
        <select className="form-input form-select w-fit py-1.5 px-3 text-[12px]"><option>All dates</option></select>
        <select className="form-input form-select w-fit py-1.5 px-3 text-[12px]"><option>All responses</option></select>
        <select className="form-input form-select w-fit py-1.5 px-3 text-[12px]"><option>All moods</option></select>
      </div>

      {responses.map(r => {
        const u = users.find(user => user.id === r.userId);
        if (!u) return null;
        
        return (
          <div key={r.id} className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4.5 mb-3 transition-colors hover:border-[var(--border-2)]">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className={`avatar ${u.avatarColor}`}>{u.initials}</div>
                <div>
                  <div className="text-[13px] font-medium text-[var(--text-1)]">{u.name}</div>
                  <div className="text-[11px] text-[var(--text-3)] font-mono">{r.date} · {r.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {r.blockers.toLowerCase() !== 'no' && <span className="badge b-red">Blocker detected</span>}
                {r.blockers.toLowerCase() === 'no' && <span className="badge b-green">No blockers</span>}
                <span className="text-[18px]">{r.mood.emoji}</span>
                <span className="badge b-neutral">{r.mood.score}/5</span>
                <button className="btn btn-sm" onClick={() => useAppContext().setEditingResponse(r)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => { if(window.confirm('Delete this standup entry?')) deleteResponse(r.id); }}>Delete</button>
              </div>
            </div>

            <div className="mb-3 pb-3 border-b border-[var(--border)]">
              <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-3)] mb-1">Previous workday</div>
              <div className="text-[13px] text-[var(--text-2)] leading-relaxed">{r.yesterday}</div>
            </div>
            <div className="mb-3 pb-3 border-b border-[var(--border)]">
              <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-3)] mb-1">Today's plan</div>
              <div className="text-[13px] text-[var(--text-2)] leading-relaxed">{r.today}</div>
            </div>
            <div>
              <div className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${r.blockers.toLowerCase() !== 'no' ? 'text-[var(--red)]' : 'text-[var(--text-3)]'}`}>Blocker</div>
              <div className={`text-[13px] leading-relaxed ${r.blockers.toLowerCase() !== 'no' ? 'text-[var(--text-1)] border-l-2 border-[var(--red)] pl-2.5' : 'text-[var(--text-3)] font-mono'}`}>
                {r.blockers}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
