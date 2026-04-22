import React, { useState } from 'react';
import { useAppContext } from '../store';

export const SchedulePage: React.FC = () => {
  const { schedule, updateSchedule, notifications, currentUser } = useAppContext();
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const isAdmin = currentUser?.role === 'Admin';

  if (!isAdmin) {
    return (
      <div className="page active">
        <div className="ph">
          <div className="ph-row">
            <div>
              <div className="ph-title">Notification schedule</div>
              <div className="ph-sub">// You don't have permission to manage schedule</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body p-6 text-center">
            <p className="text-slate-500">Only administrators can manage notification schedules.</p>
          </div>
        </div>
      </div>
    );
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    let newDays = [...localSchedule.activeDays];
    if (newDays.includes(day)) {
      newDays = newDays.filter(d => d !== day);
    } else {
      newDays.push(day);
    }
    setLocalSchedule({ ...localSchedule, activeDays: newDays });
  };

  const handleSave = () => {
    updateSchedule(localSchedule);
  };

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Notification schedule</div>
            <div className="ph-sub">// automated email triggers · timezone config · reminder logs</div>
          </div>
          <div className="ph-actions">
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Save changes</button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h"><span className="card-title">Active days</span></div>
          <div className="card-body">
            <div className="flex flex-wrap gap-1.5">
              {daysOfWeek.map(day => {
                const isActive = localSchedule.activeDays.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-2 rounded-full border text-[12px] font-medium cursor-pointer transition-all ${isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]' : 'bg-[var(--bg-3)] border-[var(--border-2)] text-[var(--text-2)] hover:bg-[var(--bg-4)] hover:text-[var(--text-1)]'}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><span className="card-title">Time & timezone</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Send time</label>
              <input
                type="time"
                className="form-input"
                value={localSchedule.time}
                onChange={(e) => setLocalSchedule({ ...localSchedule, time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="form-input form-select"
                value={localSchedule.timezone}
                onChange={(e) => setLocalSchedule({ ...localSchedule, timezone: e.target.value })}
              >
                <option>Africa/Accra (GMT+0)</option>
                <option>America/New_York (GMT-5)</option>
                <option>Europe/London (GMT+1)</option>
                <option>Asia/Lagos (GMT+1)</option>
              </select>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <label className="relative inline-block w-[38px] h-[22px] toggle">
                <input
                  type="checkbox"
                  checked={localSchedule.autoEnabled}
                  onChange={(e) => setLocalSchedule({ ...localSchedule, autoEnabled: e.target.checked })}
                  className="opacity-0 w-0 h-0 absolute"
                />
                <span className={`tslider absolute inset-0 bg-[var(--bg-5)] rounded-full cursor-pointer transition-colors border border-[var(--border-2)] before:content-[''] before:absolute before:w-4 before:h-4 before:left-[2px] before:top-[2px] before:bg-[var(--text-2)] before:rounded-full before:transition-all ${localSchedule.autoEnabled ? '!bg-[var(--accent)] !border-transparent before:translate-x-[16px] before:!bg-white' : ''}`}></span>
              </label>
              <span className="text-[12px] text-[var(--text-2)]">Automatic notifications enabled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <span className="card-title">Notification log</span>
          <span className="badge b-neutral">Today</span>
        </div>
        <div className="card-body">
          {notifications.map((notif, idx) => (
            <div key={notif.id} className={`flex items-start gap-3 py-3 ${idx !== notifications.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
              <span className="font-mono text-[11px] text-[var(--text-3)] shrink-0 w-[55px] mt-px">{notif.time}</span>
              <span className={`badge shrink-0 ${notif.type === 'Alert' ? 'b-red' : notif.type === 'Manual' ? 'b-amber' : 'b-blue'}`}>
                {notif.type}
              </span>
              <span className="text-[12px] text-[var(--text-2)] leading-relaxed">{notif.text}</span>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-[12px] text-[var(--text-3)] text-center py-4">No notifications yet today.</div>
          )}
        </div>
      </div>
    </div>
  );
};
