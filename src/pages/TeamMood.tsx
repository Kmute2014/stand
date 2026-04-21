import React from 'react';
import { useAppContext } from '../store';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const TeamMood: React.FC = () => {
  const { users } = useAppContext();
  
  // Dynamic individual data from current users
  const individualData = users
    .filter(u => u.currentMood && u.currentMood.score > 0)
    .map(u => ({
      name: u.name.split(' ')[0],
      score: u.currentMood!.score,
      emoji: u.currentMood!.emoji
    }));

  // Trending mock data
  const trendData = [
    { date: 'Apr 14', score: 3.2 },
    { date: 'Apr 15', score: 3.4 },
    { date: 'Apr 16', score: 3.1 },
    { date: 'Apr 17', score: 3.8 },
    { date: 'Apr 18', score: 4.0 },
    { date: 'Apr 19', score: 3.5 },
    { date: 'Apr 20', score: 3.8 },
  ];

  const getColorForScore = (score: number) => {
    if (score >= 4) return '#10b981'; // emerald-500
    if (score >= 3) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Team mood</div>
            <div className="ph-sub">// individual energy tracking · burnout signals · trends</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-emerald-500">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 text-xl">😊</div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">3.8</div>
          <div className="text-sm text-slate-600 font-medium">Team average today</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">↑ Feeling good from 3.5 yesterday</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-rose-500">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-4 text-xl">😐</div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">2.8</div>
          <div className="text-sm text-slate-600 font-medium">James Osei — 7d avg</div>
          <div className="text-xs text-rose-500 font-medium mt-1">⚠ Possible burnout signal</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-blue-600">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-xl">🚀</div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">4.3</div>
          <div className="text-sm text-slate-600 font-medium">Best performer — Efua</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Consistent high energy this week</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Team Average Trend (7 Days)</span>
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis domain={[1, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Individual Moods (Today)</span>
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={individualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-md border border-slate-100 text-sm">
                          <p className="font-bold text-slate-700 mb-1">{data.name}</p>
                          <p className="flex items-center gap-2">
                            <span className="text-lg">{data.emoji}</span>
                            <span className="font-medium text-slate-600">Score: {data.score}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {individualData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorForScore(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
