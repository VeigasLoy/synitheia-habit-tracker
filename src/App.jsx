import React, { useState, useEffect } from 'react';
import HabitList from './components/HabitList';
import HabitForm from './components/HabitForm';
import Stats from './components/Stats';
import ReflectionModal from './components/ReflectionModal';
import './App.css';

const App = () => {
  const [habits, setHabits] = useState([]);
  const [userStats, setUserStats] = useState({
    xp: 0,
    level: 1,
    streakFreezes: 1,
  });
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [habitToCheckIn, setHabitToCheckIn] = useState(null);

  // Load state from localStorage on initial render
  useEffect(() => {
    const storedHabits = JSON.parse(localStorage.getItem('habits'));
    if (storedHabits) {
      setHabits(storedHabits);
    }

    const storedStats = JSON.parse(localStorage.getItem('userStats'));
    if (storedStats) {
      setUserStats(storedStats);
    }

    // Check for missed days and apply streak freezes on load
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = getYesterday();
    const updatedHabits = habits.map(habit => {
      if (habit.streak > 0 && habit.lastCompleted !== today && habit.lastCompleted !== yesterday) {
        if (userStats.streakFreezes > 0) {
          setUserStats(prev => ({ ...prev, streakFreezes: prev.streakFreezes - 1 }));
          return { ...habit, lastCompleted: yesterday }; // Pretend it was completed yesterday
        } else {
          return { ...habit, streak: 0 };
        }
      }
      return habit;
    });
    setHabits(updatedHabits);

  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('userStats', JSON.stringify(userStats));
  }, [habits, userStats]);

  // Handle leveling up
  useEffect(() => {
    const { xp, level } = userStats;
    const xpToNextLevel = level * 100;

    if (xp >= xpToNextLevel) {
      setUserStats((prevStats) => ({
        ...prevStats,
        level: prevStats.level + 1,
        streakFreezes: prevStats.streakFreezes + 1, // Reward for leveling up
      }));
    }
  }, [userStats.xp]);

  const addHabit = (name) => {
    const newHabit = {
      id: Date.now(),
      name,
      streak: 0,
      lastCompleted: null,
      completedToday: false,
      notes: [],
    };
    setHabits([...habits, newHabit]);
  };

  const handleCheckIn = (habitId) => {
    setHabitToCheckIn(habitId);
    setShowReflectionModal(true);
  };

  const handleSaveReflection = (notes) => {
    const today = new Date().toISOString().slice(0, 10);

    setHabits(
      habits.map((habit) => {
        if (habit.id === habitToCheckIn) {
          const newStreak = habit.lastCompleted === getYesterday() ? habit.streak + 1 : 1;
          return {
            ...habit,
            streak: newStreak,
            lastCompleted: today,
            completedToday: true,
            notes: [...habit.notes, { date: today, text: notes }],
          };
        }
        return habit;
      })
    );

    setUserStats((prevStats) => ({
      ...prevStats,
      xp: prevStats.xp + 10,
    }));

    setShowReflectionModal(false);
    setHabitToCheckIn(null);
  };

  const handleCancelReflection = () => {
    setShowReflectionModal(false);
    setHabitToCheckIn(null);
  };

  const getYesterday = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Mindful Habit Tracker</h1>
      </header>
      <main>
        <Stats
          level={userStats.level}
          xp={userStats.xp}
          streakFreezes={userStats.streakFreezes}
        />
        <HabitForm onAddHabit={addHabit} />
        <HabitList habits={habits} onCheckIn={handleCheckIn} />
      </main>
      {showReflectionModal && (
        <ReflectionModal
          onSave={handleSaveReflection}
          onCancel={handleCancelReflection}
        />
      )}
    </div>
  );
};

export default App;