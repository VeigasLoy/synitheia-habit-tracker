import React from 'react';
import Habit from './Habit';
import { AnimatePresence } from 'framer-motion';

const HabitList = ({ habits, onCheckIn }) => {
  return (
    <div className="habit-list">
      <AnimatePresence>
        {habits.map((habit) => (
          <Habit key={habit.id} habit={habit} onCheckIn={onCheckIn} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default HabitList;