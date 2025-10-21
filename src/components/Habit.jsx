import React from 'react';
import { FaFire } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Habit = ({ habit, onCheckIn }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className={`habit-card ${habit.completedToday ? 'completed' : ''}`}
    >
      <div className="habit-content">
        <h3 className="habit-name">{habit.name}</h3>
        <div className="habit-streak">
          <FaFire />
          <span>{habit.streak} Day{habit.streak !== 1 && 's'}</span>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="check-in-btn"
        onClick={() => onCheckIn(habit.id)}
        disabled={habit.completedToday}
      >
        <FiCheckCircle />
        <span>{habit.completedToday ? 'Done!' : 'Check In'}</span>
      </motion.button>
    </motion.div>
  );
};

export default Habit;