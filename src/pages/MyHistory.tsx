import React from 'react';
import { useAppContext } from '../store';

export const MyHistory: React.FC = () => {
  const { responses, currentUser, deleteResponse, setEditingResponse } = useAppContext();
  
  // Filter for only currentUser's responses
  const myResponses = responses.filter(r => r.userId === currentUser?.id);

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">My history</div>
            <div className="ph-sub">// view · edit · delete your past standup responses</div>
          </div>
        </div>
      </div>

      <div className="flex gap-[2px] bg-[var(--bg-3)] p-[3px] rounded-[var(--radius)] w-fit mb-5">
        <div className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer text-[var(--text-1)] bg-[var(--bg-5)]">All</div>
        <div className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer text-[var(--text-3)] hover:text-[var(--text-2)]">With blockers</div>
        <div className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer text-[var(--text-3)] hover:text-[var(--text-2)]">This week</div>
      </div>

      {myResponses.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-[var(--text-3)]">No responses found yet.</div>
      ) : (
        myResponses.map(r => (
          <div key={r.id} className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 mb-3 transition-colors hover:border-[var(--border-2)]">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="text-[14px] font-medium text-[var(--text-1)]">{r.date}</div>
                <div className="text-[11px] text-[var(--text-3)] font-mono">{r.time}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="badge b-green">Submitted</span>
                <span className="badge b-neutral">{r.mood.emoji} {r.mood.score}/5</span>
                <button className="btn btn-sm" onClick={() => setEditingResponse(r)}>Edit</button>
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
              <div className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${r.blockers.toLowerCase() !== 'no' ? 'text-[var(--red)]' : 'text-[var(--text-3)]'}`}>Blockers</div>
              <div className={`text-[13px] leading-relaxed ${r.blockers.toLowerCase() !== 'no' ? 'text-[var(--text-1)] border-l-2 border-[var(--red)] pl-2.5' : 'text-[var(--text-3)] font-mono'}`}>
                {r.blockers}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Missed Day Placeholder (mock styling from HTML) */}
      <div className="bg-[var(--bg-2)] border border-[var(--border)] border-dashed rounded-[var(--radius-lg)] p-4 mb-3 opacity-50">
         <div className="flex items-center justify-between">
           <div>
             <div className="text-[14px] font-medium text-[var(--text-1)]">Thursday, April 16</div>
             <div className="text-[11px] text-[var(--text-3)] font-mono">4 days ago</div>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="badge b-amber">Missed</span>
             <button className="btn btn-sm btn-warn">Submit late</button>
           </div>
         </div>
         <div className="text-[12px] text-[var(--text-3)] mt-1">No standup submitted for this day. You can still add a late response.</div>
      </div>

    </div>
  );
};
