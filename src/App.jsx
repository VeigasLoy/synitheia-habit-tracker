import React, { useState, useEffect } from 'react';
import HabitList from './components/HabitList';
import HabitForm from './components/HabitForm';
import Achievements from './components/Achievements';
import Leaderboard from './components/Leaderboard';
import './App.css';

const mockUsers = [
  { id: 1, name: 'Alice', xp: 1500 },
  { id: 2, name: 'Bob', xp: 1200 },
  { id: 3, name: 'You', xp: 0 }, // This will be updated with the actual user's XP
  { id: 4, name: 'Charlie', xp: 900 },
  { id: 5, name: 'Diana', xp: 750 },
];

const achievementsList = [
  { name: 'First Habit', condition: ({ habits }) => habits.length >= 1 },
  { name: '5 Habits', condition: ({ habits }) => habits.length >= 5 },
  { name: 'First Check-in', condition: ({ habits }) => habits.some(h => h.completed) },
  { name: 'Level 2', condition: ({ level }) => level >= 2 },
  { name: 'Level 5', condition: ({ level }) => level >= 5 },
  { name: '5-Day Streak', condition: ({ habits }) => habits.some(h => h.streak >= 5) },
];

function App() {
  const [habits, setHabits] = useState([]);
  const [xp, setXp] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  const calculateLevel = (xp) => {
    return Math.floor(xp / 100) + 1;
  };

  useEffect(() => {
    const storedAchievements = JSON.parse(localStorage.getItem('achievements'));
    if (storedAchievements) {
      setUnlockedAchievements(storedAchievements);
    }

    const storedXp = JSON.parse(localStorage.getItem('xp'));
    if (storedXp) {
      setXp(storedXp);
    }

    let storedHabits = JSON.parse(localStorage.getItem('habits'));
    if (storedHabits) {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      const processedHabits = storedHabits.map(habit => {
        const isCompletedToday = habit.lastCompletedDate === today;
        // If last completion was not today and not yesterday, reset streak.
        if (habit.lastCompletedDate && habit.lastCompletedDate !== today && habit.lastCompletedDate !== yesterday) {
          return { ...habit, streak: 0, completed: false };
        }
        // Set the 'completed' status for today's view
        return { ...habit, completed: isCompletedToday };
      });
      setHabits(processedHabits);
    }
  }, []);

  const level = calculateLevel(xp);

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits));
    }
    localStorage.setItem('xp', JSON.stringify(xp));
    localStorage.setItem('achievements', JSON.stringify(unlockedAchievements));

    const checkAchievements = () => {
      const newAchievements = [];
      achievementsList.forEach(achievement => {
        if (!unlockedAchievements.includes(achievement.name) && achievement.condition({ habits, level })) {
          newAchievements.push(achievement.name);
        }
      });
      if (newAchievements.length > 0) {
        setUnlockedAchievements([...unlockedAchievements, ...newAchievements]);
      }
    };

    checkAchievements();
  }, [habits, xp, unlockedAchievements, level]);

  const addHabit = (habit) => {
    setHabits([...habits, habit]);
  };

  const toggleHabit = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const isCompletedForToday = habit.completed;

          if (!isCompletedForToday) {
            // Completing the habit
            setXp(prevXp => prevXp + 10);
            const wasCompletedYesterday = habit.lastCompletedDate === yesterday;
            const newStreak = wasCompletedYesterday ? habit.streak + 1 : 1;
            return { ...habit, completed: true, streak: newStreak, lastCompletedDate: today };
          } else {
            // Un-completing the habit (the penalty)
            setXp(prevXp => Math.max(0, prevXp - 10)); // Prevent negative XP
            const newStreak = habit.streak - 1;
            return { ...habit, completed: false, streak: newStreak < 0 ? 0 : newStreak, lastCompletedDate: null };
          }
        }
        return habit;
      })
    );
  };

  const xpForNextLevel = (level) * 100;
  const xpProgress = (xp % 100) / 100 * 100;

  const usersWithCurrentXp = mockUsers.map(user => user.id === 3 ? { ...user, xp } : user);

  return (
    <div className="App">
      <h1>Gamified Habit Tracker</h1>
      <div className="player-stats">
        <span>Level: {level}</span>
        <span>XP: {xp} / {xpForNextLevel}</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${xpProgress}%` }}></div>
      </div>
      <HabitForm onAdd={addHabit} />
      <HabitList habits={habits} onToggle={toggleHabit} />
      <div className="main-content">
        <div className="left-panel">
          <Achievements achievements={unlockedAchievements} />
        </div>
        <div className="right-panel">
          <Leaderboard users={usersWithCurrentXp} currentUser={{ id: 3 }} />
        </div>
      </div>
    </div>
  );
}

export default App;