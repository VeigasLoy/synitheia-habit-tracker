import React, { useState } from 'react';

const HabitForm = ({ onAddHabit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAddHabit(name);
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="habit-form">
      <input
        type="text"
        placeholder="Add a new habit..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">Add Habit</button>
    </form>
  );
};

export default HabitForm;