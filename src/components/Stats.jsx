import React from 'react';
import { FaTrophy, FaFire, FaShieldAlt } from 'react-icons/fa';

const Stats = ({ level, xp, streakFreezes }) => {
  const xpToNextLevel = level * 100;
  const xpProgress = (xp / xpToNextLevel) * 100;

  return (
    <div className="stats-container">
      <div className="stat-card">
        <FaTrophy className="stat-icon level" />
        <div className="stat-info">
          <span className="stat-value">{level}</span>
          <span className="stat-label">Level</span>
        </div>
      </div>
      <div className="stat-card">
        <FaFire className="stat-icon xp" />
        <div className="stat-info">
          <span className="stat-value">{xp}</span>
          <span className="stat-label">XP</span>
        </div>
      </div>
      <div className="stat-card">
        <FaShieldAlt className="stat-icon freeze" />
        <div className="stat-info">
          <span className="stat-value">{streakFreezes}</span>
          <span className="stat-label">Freezes</span>
        </div>
      </div>
      <div className="progress-card">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${xpProgress}%` }}></div>
        </div>
        <span className="progress-label">XP to next level: {xpToNextLevel - xp}</span>
      </div>
    </div>
  );
};

export default Stats;