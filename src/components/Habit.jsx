import React from 'react';

const Habit = ({ habit, onToggle }) => {
  return (
    <div className={`habit ${habit.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={habit.completed}
        onChange={() => onToggle(habit.id)}
      />
      <span>{habit.text}</span>
      <span className="streak">Streak: {habit.streak}</span>
    </div>
  );
};

export default Habit;