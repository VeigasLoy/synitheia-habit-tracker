import React, { useState } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ReflectionModal = ({ onSave, onCancel }) => {
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave(notes);
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { y: "-50%", opacity: 0 },
    visible: { y: "0", opacity: 1, transition: { delay: 0.2 } },
  };

  return (
    <motion.div
      className="modal-backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div className="modal-content" variants={modalVariants}>
        <h2 className="modal-header">How did it go?</h2>
        <p className="modal-subheader">
          A moment of reflection can make all the difference.
        </p>
        <textarea
          className="modal-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., 'Today was a challenge, but I'm glad I pushed through.'"
        ></textarea>
        <div className="modal-actions">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onCancel} className="modal-btn cancel">
            <FiX />
            <span>Skip</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave} className="modal-btn save">
            <FiSave />
            <span>Save</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReflectionModal;