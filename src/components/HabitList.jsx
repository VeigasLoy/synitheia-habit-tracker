import React from 'react';
import Habit from './Habit';

const HabitList = ({ habits, onCheckIn }) => {
  return (
    <div className="habit-list">
      {habits.map((habit) => (
        <Habit key={habit.id} habit={habit} onCheckIn={onCheckIn} />
      ))}
    </div>
  );
};

export default HabitList;