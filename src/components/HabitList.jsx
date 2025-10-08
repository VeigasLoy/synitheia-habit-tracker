import React from 'react';
import Habit from './Habit';

const HabitList = ({ habits, onToggle }) => {
  return (
    <div className="habit-list">
      {habits.map(habit => (
        <Habit key={habit.id} habit={habit} onToggle={onToggle} />
      ))}
    </div>
  );
};

export default HabitList;