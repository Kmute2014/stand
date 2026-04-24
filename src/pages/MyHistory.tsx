import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';

export const MyHistory: React.FC = () => {
  const { responses, currentUser, deleteResponse, setEditingResponse, schedule } = useAppContext();
  const [activeFilter, setActiveFilter] = useState<'all' | 'blockers' | 'week'>('all');

  // Filter for only currentUser's responses
  const myResponses = responses.filter(r => r.userId === currentUser?.id);

  // Function to get missed standup days for past 6 months from April 20th, 2026
  const getMissedDays = () => {
    if (!currentUser || !schedule.activeDays.length) return [];

    const missedDays = [];
    const today = new Date();
    const startDate = new Date('2026-04-20'); // April 20th, 2026
    const sixMonthsAgo = new Date(startDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get dates when user submitted standups
    const submittedDates = new Set(
      myResponses.map(r => {
        const date = new Date(r.createdAt);
        return date.toDateString();
      })
    );

    // Check each day from 6 months ago until today
    for (let d = new Date(sixMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dateString = d.toDateString();

      // Check if this day is an active standup day and user didn't submit
      if (schedule.activeDays.includes(dayName) && !submittedDates.has(dateString)) {
        const daysAgo = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        const formattedDate = d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        missedDays.push({
          date: formattedDate,
          daysAgo,
          dateObj: new Date(d)
        });
      }
    }

    return missedDays.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  };

  const missedDays = getMissedDays();

  // Filter responses based on active filter
  const filteredResponses = useMemo(() => {
    const today = new Date();
    const lastMonday = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate last Monday (if today is Sunday, go back 6 days; otherwise go back to Monday)
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    lastMonday.setDate(today.getDate() - daysToMonday);

    // Set Friday of that week
    const lastFriday = new Date(lastMonday);
    lastFriday.setDate(lastMonday.getDate() + 4);

    switch (activeFilter) {
      case 'blockers':
        return myResponses.filter(r => r.blockers.toLowerCase() !== 'no' && r.blockers.trim() !== '');
      case 'week':
        return myResponses.filter(r => {
          const responseDate = new Date(r.createdAt);
          return responseDate >= lastMonday && responseDate <= lastFriday;
        });
      default:
        return myResponses;
    }
  }, [myResponses, activeFilter]);

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
        <div
          className={`px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer ${activeFilter === 'all' ? 'text-[var(--text-1)] bg-[var(--bg-5)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </div>
        <div
          className={`px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer ${activeFilter === 'blockers' ? 'text-[var(--text-1)] bg-[var(--bg-5)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}
          onClick={() => setActiveFilter('blockers')}
        >
          With blockers
        </div>
        <div
          className={`px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer ${activeFilter === 'week' ? 'text-[var(--text-1)] bg-[var(--bg-5)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}
          onClick={() => setActiveFilter('week')}
        >
          This week
        </div>
      </div>

      {missedDays.length > 0 && (
        <>
          <div className="text-[12px] font-medium text-[var(--text-3)] mb-3 mt-6">
            ⚠️ You missed {missedDays.length} standup day{missedDays.length > 1 ? 's' : ''} (past 6 months)
          </div>
          {missedDays.slice(0, 10).map((missedDay, index) => (
            <div key={index} className="bg-[var(--bg-2)] border border-[var(--amber)] border-dashed rounded-[var(--radius-lg)] p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium text-[var(--text-1)]">{missedDay.date}</div>
                  <div className="text-[11px] text-[var(--text-3)] font-mono">
                    {missedDay.daysAgo === 0 ? 'Today' :
                      missedDay.daysAgo === 1 ? 'Yesterday' :
                        `${missedDay.daysAgo} days ago`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="badge b-amber">Missed</span>
                  <button className="btn btn-sm btn-warn">Submit late</button>
                </div>
              </div>
              <div className="text-[12px] text-[var(--text-3)] mt-1">
                💡 Reminder: You missed your standup on {missedDay.date}. Regular standups help keep the team aligned!
              </div>
            </div>
          ))}
          {missedDays.length > 10 && (
            <div className="text-[12px] text-[var(--text-3)] mb-4 text-center">
              ... and {missedDays.length - 10} more missed days
            </div>
          )}
        </>
      )}

      {filteredResponses.length === 0 && missedDays.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-[var(--text-3)]">No responses found yet.</div>
      ) : (
        <>
          {filteredResponses.length > 0 && (
            <div className="text-[12px] font-medium text-[var(--text-3)] mb-3 mt-6">
              ✓ Your submitted standups ({filteredResponses.length})
            </div>
          )}
          {filteredResponses.map(r => (
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
                  <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm('Delete this standup entry?')) deleteResponse(r.id); }}>Delete</button>
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
          ))}
        </>
      )}
    </div>
  );
};
