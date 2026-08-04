import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanPassword) {
      setError('Please fill in both email and password.');
      setLoading(false);
      return;
    }

    try {
      // Delegates authentication directly to AuthContext using primitive strings
      await login(cleanEmail, cleanPassword);

      // Hard navigation to dashboard upon successful authentication
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold uppercase text-center">Login</h2>

        {error && (
          <div className="p-2 bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded text-sm bg-gray-50 focus:bg-white"
            placeholder="worker@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded text-sm bg-gray-50 focus:bg-white"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-950 text-white font-bold py-2 rounded uppercase text-xs hover:bg-amber-900 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}