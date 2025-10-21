import React from 'react';

const Habit = ({ habit, onCheckIn }) => {
  return (
    <div className="habit">
      <div className="habit-info">
        <h3>{habit.name}</h3>
        <p>Streak: {habit.streak}</p>
      </div>
      <button onClick={() => onCheckIn(habit.id)} disabled={habit.completedToday}>
        {habit.completedToday ? 'Completed' : 'Check In'}
      </button>
    </div>
  );
};

export default Habit;