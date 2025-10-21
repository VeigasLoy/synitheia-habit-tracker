import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';

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
        placeholder="What new habit will you build?"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="habit-input"
      />
      <button type="submit" className="add-habit-btn">
        <FiPlus />
        <span>Add Habit</span>
      </button>
    </form>
  );
};

export default HabitForm;