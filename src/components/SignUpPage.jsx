import React, { useState } from 'react';

const SignUpPage = ({ onSignup, onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1: Registration form, 2: Verification form
  const [signupError, setSignupError] = useState('');
  const [mockVerificationCode, setMockVerificationCode] = useState(''); // Stores the mock code sent

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setSignupError('');

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setSignupError('Password must be at least 6 characters long.');
        return;
    }

    // --- MOCK EMAIL VERIFICATION ---
    // In a real application, you would send an actual verification email here
    // and store a pending user in a database.
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setMockVerificationCode(generatedCode);
    console.log(`Mock Verification Code for ${email}: ${generatedCode}`); // Log to console for user to see
    // You would typically show a message to the user that a code has been sent.
    setStep(2); // Move to verification step
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    setSignupError('');

    if (verificationCode !== mockVerificationCode) {
      setSignupError('Invalid verification code.');
      return;
    }

    // Call the onSignup prop passed from App.jsx
    const success = onSignup(email, password);
    if (success) {
      // Successfully signed up, navigation handled by App.jsx
    } else {
      setSignupError('Registration failed. Email might already be registered.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-none shadow-none mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign Up for Synitheia</h2>
      
      {step === 1 && (
        <form onSubmit={handleRegisterSubmit}>
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
          <div className="mb-4">
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
          <div className="mb-6">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {signupError && <p className="text-red-500 text-sm mb-4 text-center">{signupError}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Register
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerificationSubmit}>
            <p className="text-gray-700 mb-4 text-center">
                A verification code has been sent to your email. (Check console for mock code)
            </p>
            <div className="mb-4">
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input
                    type="text"
                    id="verification-code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                />
            </div>
            {signupError && <p className="text-red-500 text-sm mb-4 text-center">{signupError}</p>}
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                Verify & Sign Up
            </button>
        </form>
      )}

      <p className="mt-6 text-center text-gray-600 text-sm">
        Already have an account?{' '}
        <button onClick={onNavigateToLogin} className="text-blue-600 hover:underline font-medium">Login</button>
      </p>
    </div>
  );
};

export default SignUpPage;
