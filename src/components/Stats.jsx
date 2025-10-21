import React from 'react';

const Stats = ({ level, xp, streakFreezes }) => {
  const xpToNextLevel = level * 100;
  const xpProgress = (xp / xpToNextLevel) * 100;

  return (
    <div className="stats">
      <h2>Your Progress</h2>
      <div className="stat-item">
        <strong>Level:</strong> {level}
      </div>
      <div className="stat-item">
        <strong>XP:</strong> {xp} / {xpToNextLevel}
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${xpProgress}%` }}></div>
        </div>
      </div>
      <div className="stat-item">
        <strong>Streak Freezes:</strong> {streakFreezes}
      </div>
    </div>
  );
};

export default Stats;