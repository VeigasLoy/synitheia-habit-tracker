import React, { useState } from 'react';

const LoginPage = ({ onLogin, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError(''); // Clear previous errors
    // Call the onLogin prop passed from App.jsx
    const success = onLogin(email, password);
    if (!success) {
      setLoginError('Invalid email or password.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-none shadow-none mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login to Synitheia</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            id="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {loginError && <p className="text-red-500 text-sm mb-4 text-center">{loginError}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          Login
        </button>
      </form>
      <p className="mt-6 text-center text-gray-600 text-sm">
        Don't have an account?{' '}
        <button onClick={onNavigateToSignup} className="text-blue-600 hover:underline font-medium">Sign Up</button>
      </p>
    </div>
  );
};

export default LoginPage;
