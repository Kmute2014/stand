import React, { useEffect, useState } from 'react';
import { useAppContext } from '../store';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

type TrendPoint = { date: string; score: number };

export const TeamMood: React.FC = () => {
  const { users, responses } = useAppContext();
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);

  // Individual mood data from users who have submitted today (live from Firestore via store)
  const individualData = users
    .filter(u => u.currentMood && u.currentMood.score > 0)
    .map(u => ({
      name: u.name.split(' ')[0],
      score: u.currentMood!.score,
      emoji: u.currentMood!.emoji,
    }));

  // Calculate real averages
  const todayAvg = individualData.length > 0
    ? (individualData.reduce((s, u) => s + u.score, 0) / individualData.length).toFixed(1)
    : '—';

  // Find lowest 7-day mood user (from responses)
  const userMoodMap: Record<string, number[]> = {};
  responses.forEach(r => {
    if (!userMoodMap[r.userId]) userMoodMap[r.userId] = [];
    userMoodMap[r.userId].push(r.mood.score);
  });

  let lowestUser = { name: '—', avg: 0 };
  let highestUser = { name: '—', avg: 0 };
  users.forEach(u => {
    const scores = userMoodMap[u.id];
    if (!scores || scores.length === 0) return;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (lowestUser.name === '—' || avg < lowestUser.avg) lowestUser = { name: u.name.split(' ')[0], avg };
    if (highestUser.name === '—' || avg > highestUser.avg) highestUser = { name: u.name.split(' ')[0], avg };
  });

  // Load 7-day trend from Firestore responses
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const responsesRef = collection(db, 'responses');
        const q = query(responsesRef, orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);

        // Group by date, average mood per day
        const byDate: Record<string, number[]> = {};
        snap.docs.forEach(doc => {
          const d = doc.data();
          const date = d.date || d.createdAt?.split('T')[0] || '';
          if (!date) return;
          if (!byDate[date]) byDate[date] = [];
          byDate[date].push(d.mood?.score ?? 0);
        });

        const points: TrendPoint[] = Object.entries(byDate)
          .map(([date, scores]) => ({
            date,
            score: parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);

        if (points.length > 0) setTrendData(points);
      } catch (err) {
        console.error('Error fetching trend data:', err);
      }
    };
    fetchTrend();
  }, [responses.length]);

  const getColorForScore = (score: number) => {
    if (score >= 4) return '#10b981';
    if (score >= 3) return '#f59e0b';
    return '#f43f5e';
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
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{todayAvg}</div>
          <div className="text-sm text-slate-600 font-medium">Team average today</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {individualData.length > 0 ? `Based on ${individualData.length} submission${individualData.length !== 1 ? 's' : ''}` : 'No submissions yet today'}
          </div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-rose-500">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-4 text-xl">😐</div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">
            {lowestUser.avg > 0 ? lowestUser.avg.toFixed(1) : '—'}
          </div>
          <div className="text-sm text-slate-600 font-medium">{lowestUser.name} — avg</div>
          <div className="text-xs text-rose-500 font-medium mt-1">
            {lowestUser.avg > 0 && lowestUser.avg < 3 ? '⚠ Possible burnout signal' : 'Consistent performance'}
          </div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-blue-600">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-xl">🚀</div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">
            {highestUser.avg > 0 ? highestUser.avg.toFixed(1) : '—'}
          </div>
          <div className="text-sm text-slate-600 font-medium">Best performer — {highestUser.name}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">
            {highestUser.avg >= 4 ? 'Consistent high energy' : highestUser.avg > 0 ? 'Good energy overall' : 'No data yet'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Team Average Trend</span>
            <span className="text-[11px] text-slate-400 font-mono">{trendData.length} days</span>
          </div>
          <div className="p-6 h-[300px]">
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-[13px]">
                Submit standups to see trend data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[1, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} ticks={[1, 2, 3, 4, 5]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Individual Moods (Today)</span>
          </div>
          <div className="p-6 h-[300px]">
            {individualData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-[13px]">
                No mood data submitted yet today
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
