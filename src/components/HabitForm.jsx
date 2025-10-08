import React, { useState } from 'react';

const HabitForm = ({ onAdd }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text) return;
    onAdd({ id: Date.now(), text, completed: false, streak: 0, lastCompletedDate: null });
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="habit-form">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new habit"
      />
      <button type="submit">Add</button>
    </form>
  );
};

export default HabitForm;