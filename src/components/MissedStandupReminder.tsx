import React, { useEffect, useState } from 'react';
import { useAppContext } from '../store';

interface MissedDay {
  date: string;
  daysAgo: number;
  dateObj: Date;
}

export const MissedStandupReminder: React.FC = () => {
  const { responses, currentUser, schedule, setCurrentPage } = useAppContext();
  const [missedDays, setMissedDays] = useState<MissedDay[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Function to get missed standup days
  const getMissedDays = () => {
    if (!currentUser || !schedule.activeDays.length) return [];

    // Admin users should not be tracked for missed standups
    if (currentUser.role === 'Admin') {
      return [];
    }

    const missedDays = [];
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);

    // Get dates when user submitted standups
    const myResponses = responses.filter(r => r.userId === currentUser?.id);
    const submittedDates = new Set(
      myResponses.map(r => {
        const date = new Date(r.createdAt);
        return date.toDateString();
      })
    );

    // Check each day in the last 10 days
    for (let d = new Date(tenDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dateString = d.toDateString();

      // Check if this day is an active standup day and user didn't submit
      if (schedule.activeDays.includes(dayName) && !submittedDates.has(dateString)) {
        const daysAgo = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        const formattedDate = d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
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

  // Check for missed days on component mount and when data changes
  useEffect(() => {
    if (currentUser && responses.length > 0) {
      const missed = getMissedDays();
      setMissedDays(missed);

      // Show popup if there are missed days
      if (missed.length > 0) {
        // Add a small delay to ensure the page is fully loaded
        setTimeout(() => {
          setIsVisible(true);
        }, 1000);
      }
    }
  }, [currentUser, responses, schedule]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleGoToHistory = () => {
    setCurrentPage('myhistory');
    setIsVisible(false);
  };

  const handleGoToStandup = () => {
    setCurrentPage('standup');
    setIsVisible(false);
  };

  if (!isVisible || missedDays.length === 0) {
    return null;
  }

  return (
    <div className="modal-bg show" id="modal-missed-standup-reminder">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-h">
          <div className="modal-title">⚠️ Missed Standup Reminder</div>
          <div className="modal-close" onClick={handleClose}>×</div>
        </div>
        <div className="modal-body">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-amber-800 font-medium mb-2">
              You missed {missedDays.length} standup day{missedDays.length > 1 ? 's' : ''}!
            </div>
            <div className="text-amber-700 text-sm">
              Regular standups help keep the team aligned and informed about your progress.
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Missed days:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {missedDays.slice(0, 5).map((missedDay, index) => (
                <div key={index} className="text-sm text-gray-600 flex justify-between">
                  <span>{missedDay.date}</span>
                  <span className="text-gray-400">
                    {missedDay.daysAgo === 0 ? 'Today' :
                      missedDay.daysAgo === 1 ? 'Yesterday' :
                        `${missedDay.daysAgo} days ago`}
                  </span>
                </div>
              ))}
              {missedDays.length > 5 && (
                <div className="text-sm text-gray-500 italic">
                  ... and {missedDays.length - 5} more
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            💡 Tip: You can submit late responses for missed days in your history page.
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={handleClose}>Dismiss</button>
          <button className="btn btn-neutral" onClick={handleGoToHistory}>View History</button>
          <button className="btn btn-primary" onClick={handleGoToStandup}>Submit Now</button>
        </div>
      </div>
    </div>
  );
};
