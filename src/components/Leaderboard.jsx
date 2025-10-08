import React from 'react';

const Leaderboard = ({ users, currentUser }) => {
  const sortedUsers = [...users].sort((a, b) => b.xp - a.xp);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <ol>
        {sortedUsers.map((user, index) => (
          <li key={user.id} className={user.id === currentUser.id ? 'current-user' : ''}>
            <span>{index + 1}. {user.name}</span>
            <span>{user.xp} XP</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;