import React from 'react';

// A simple Confetti component (purely CSS/React based for demonstration)
const Confetti = ({ active }) => {
    if (!active) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute bg-blue-500 rounded-full opacity-0"
                    style={{
                        width: `${Math.random() * 8 + 4}px`,
                        height: `${Math.random() * 8 + 4}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `confetti-fall ${Math.random() * 2 + 1}s ease-out forwards ${Math.random() * 0.5}s`,
                        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                        transform: `scale(0)`
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;
