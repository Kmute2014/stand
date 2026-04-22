import React from 'react';
import { useAppContext } from '../store';
import { CheckCircle2, CircleDashed, AlertTriangle, Smile } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, responses, users, sendReminders } = useAppContext();
  const isAdmin = currentUser?.role === 'Admin';

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const pendingUsers = users.filter(u => u.status === 'Active' && !u.lastStandup?.includes('Today'));
  const activeBlockers = responses.filter(r => r.blockers.toLowerCase() !== 'no' && r.date === today);

  // Calculate average mood
  const moodSum = responses.reduce((acc, curr) => acc + curr.mood.score, 0);
  const avgMood = responses.length > 0 ? (moodSum / responses.length).toFixed(1) : '—';

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Good morning, {currentUser?.name.split(' ')[0] || 'User'}.</div>
            <div className="ph-sub">// Monday standup · {responses.length} of {users.length} submitted · {activeBlockers.length} active blockers</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-blue-600">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-[20px] h-[20px] text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{responses.length}</div>
          <div className="text-sm text-slate-600 font-medium">Submitted today</div>
          <div className="text-xs text-slate-400 mt-1">of {users.length} team members</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-amber-500">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
            <CircleDashed className="w-[20px] h-[20px] text-amber-500" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{pendingUsers.length}</div>
          <div className="text-sm text-slate-600 font-medium">Pending</div>
          <div className="text-xs text-slate-400 mt-1">not yet responded</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-rose-500">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-[20px] h-[20px] text-rose-500" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{activeBlockers.length}</div>
          <div className="text-sm text-slate-600 font-medium">Active blockers</div>
          <div className="text-xs text-rose-500 font-medium mt-1">admin notified</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-emerald-500">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
            <Smile className="w-[20px] h-[20px] text-emerald-500" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{avgMood}</div>
          <div className="text-sm text-slate-600 font-medium">Team mood avg</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">↑ good energy today</div>
        </div>
      </div>

      <div className="grid-3-2">
        {/* Submissions Table */}
        <div className="card h-fit">
          <div className="card-h">
            <span className="card-title">
              <CheckCircle2 className="w-4 h-4 text-[var(--text-3)]" />
              Today's submissions
            </span>
            <span className="badge b-neutral">{today}</span>
          </div>
          <div className="card-body-0 overflow-x-auto">
            <table className="tbl min-w-full">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Time</th>
                  <th>Mood</th>
                  <th>Blockers</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const uResp = responses.find(r => r.userId === u.id);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`avatar ${u.avatarColor}`}>{u.initials}</div>
                          <div>
                            <div className="text-[13px] font-medium text-[var(--text-1)]">{u.name}</div>
                            <div className="text-[11px] text-[var(--text-3)]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {uResp ? (
                          <span className="text-[var(--green)] font-mono text-[11px]">{uResp.time}</span>
                        ) : (
                          <span className="text-[var(--text-3)] font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td>
                        {uResp ? (
                          <span className="text-[16px] leading-none">{uResp.mood.emoji} <span className="text-[11px] text-[var(--text-3)] font-mono">{uResp.mood.score}</span></span>
                        ) : (
                          <span className="text-[var(--text-3)]">—</span>
                        )}
                      </td>
                      <td>
                        {uResp ? (
                          <span className={`badge ${uResp.blockers.toLowerCase() === 'no' ? 'b-green' : 'b-red'}`}>
                            {uResp.blockers.toLowerCase() === 'no' ? 'clear' : 'blocker'}
                          </span>
                        ) : (
                          <span className="badge b-amber">pending</span>
                        )}
                      </td>
                      <td>
                        {uResp ? (
                          <button className="btn btn-sm btn-ghost">View</button>
                        ) : isAdmin ? (
                          <button className="btn btn-sm btn-warn" onClick={() => sendReminders([u.id])}>Remind</button>
                        ) : (
                          <span className="text-[var(--text-3)] font-mono text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="col-stack h-fit">
          <div className="card border-rose-200 bg-rose-50 overflow-hidden">
            <div className="p-6 pb-4 flex justify-between items-start">
              <span className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Active blockers
              </span>
              <span className="px-2 py-1 bg-rose-200 text-rose-800 text-xs font-bold rounded">{activeBlockers.length} ALERTS</span>
            </div>
            <div className="px-6 pb-6 bg-rose-50">
              {activeBlockers.length === 0 ? (
                <div className="text-[13px] text-slate-500 font-medium py-2">No active blockers.</div>
              ) : (
                activeBlockers.map(b => {
                  const bgUser = users.find(u => u.id === b.userId);
                  return (
                    <div key={b.id} className="p-4 bg-white border border-rose-100 rounded-lg shadow-sm mb-3 last:mb-0">
                      <div className="text-sm font-bold text-slate-800 mb-1">{bgUser?.name || 'Unknown'}</div>
                      <div className="text-sm text-slate-600 leading-relaxed italic">{b.blockers}</div>
                      <div className="text-xs text-slate-400 mt-2 flex gap-2 font-medium">
                        <span>Today • {b.time}</span>
                        <span className="text-emerald-600">✓ Notified</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Fake Visual */}
      <div className="mt-4 bg-gradient-to-br from-[rgba(79,142,255,0.06)] to-[rgba(45,212,191,0.04)] border border-[rgba(79,142,255,0.15)] rounded-[var(--radius-lg)] p-5 relative overflow-hidden">
        <div className="text-[10px] font-medium tracking-widest uppercase text-[var(--accent)] flex items-center gap-1.5 mb-3.5">
          <SparklesIcon className="w-3.5 h-3.5" />
          AI standup summary — generated 10:00 AM
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--green)] mb-1.5">✦ Wins</div>
            <div className="text-[12px] text-[var(--text-2)] py-1 flex gap-2 leading-relaxed"><span className="text-[var(--text-3)] flex-shrink-0 mt-px">·</span>Efua shipped the full auth flow ahead of schedule</div>
            <div className="text-[12px] text-[var(--text-2)] py-1 flex gap-2 leading-relaxed"><span className="text-[var(--text-3)] flex-shrink-0 mt-px">·</span>Ama connected dashboard analytics</div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--red)] mb-1.5">⚠ Risks</div>
            <div className="text-[12px] text-[var(--text-2)] py-1 flex gap-2 leading-relaxed"><span className="text-[var(--text-3)] flex-shrink-0 mt-px">·</span>{activeBlockers.length} blockers may delay API integration</div>
            <div className="text-[12px] text-[var(--text-2)] py-1 flex gap-2 leading-relaxed"><span className="text-[var(--text-3)] flex-shrink-0 mt-px">·</span>{pendingUsers.length} members yet to submit</div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--accent)] mb-1.5">→ Priorities</div>
            <div className="text-[12px] text-[var(--text-2)] py-1 flex gap-2 leading-relaxed"><span className="text-[var(--text-3)] flex-shrink-0 mt-px">·</span>Resolve infra API credentials urgently today</div>
          </div>
        </div>
      </div>

    </div>
  );
};

const SparklesIcon = (props: any) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M8 1l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 10l-4 2.5 1.5-4.5L2 5.5h4.5L8 1z" /></svg>
);
