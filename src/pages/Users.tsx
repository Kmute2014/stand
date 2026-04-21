import React from 'react';
import { useAppContext } from '../store';

export const UsersPage: React.FC = () => {
  const { users, sendReminders, deleteUser, setEditingUser } = useAppContext();

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Team members</div>
            <div className="ph-sub">// manage users · permissions · email settings · streaks</div>
          </div>
          <div className="ph-actions">
            <button className="btn btn-sm btn-warn" onClick={sendReminders}>Send all reminders</button>
            <button className="btn btn-sm btn-primary" onClick={() => document.getElementById('modal-add-user')?.classList.add('show')}>+ Add member</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body-0 overflow-x-auto">
          <table className="tbl min-w-full">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Streak</th>
                <th>Last standup</th>
                <th>Mood</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
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
                    <span className={`badge ${u.role === 'Admin' ? 'b-amber' : 'b-neutral'}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'b-green' : 'b-amber'}`}>{u.status}</span>
                  </td>
                  <td>
                    {u.streak > 0 ? (
                      <span className="text-[var(--amber)] font-mono text-[11px] flex items-center gap-1">🔥 {u.streak}d</span>
                    ) : (
                      <span className="text-[var(--text-3)] font-mono text-[11px]">—</span>
                    )}
                  </td>
                  <td>
                    {u.lastStandup ? (
                      <span className="font-mono text-[11px] text-[var(--green)]">{u.lastStandup}</span>
                    ) : (
                      <span className="font-mono text-[11px] text-[var(--red)]">Not today</span>
                    )}
                  </td>
                  <td>
                    {u.currentMood ? (
                      <span>{u.currentMood.emoji} <span className="font-mono text-[11px] opacity-70">{u.currentMood.score}</span></span>
                    ) : (
                      <span className="text-[var(--text-3)]">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button className="btn btn-sm" onClick={() => setEditingUser(u)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => { if(window.confirm('Are you sure you want to delete this member?')) deleteUser(u.id); }}>Delete</button>
                      {(!u.lastStandup?.includes('Today') || u.status === 'Pending') && (
                        <button className="btn btn-sm btn-warn" onClick={sendReminders}>Remind</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
