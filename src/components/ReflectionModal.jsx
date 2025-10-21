import React, { useState } from 'react';

const ReflectionModal = ({ onSave, onCancel }) => {
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave(notes);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>How did it go?</h2>
        <p>Add any notes about your experience. This is for your eyes only.</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., 'Felt great today!' or 'Struggled a bit, but I did it.'"
        ></textarea>
        <div className="modal-actions">
          <button onClick={handleSave}>Save Reflection</button>
          <button onClick={onCancel}>Skip</button>
        </div>
      </div>
    </div>
  );
};

export default ReflectionModal;