
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function AuthCard({ children, title, subtitle }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - var(--nav-h))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            marginBottom: 6,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            marginBottom: 28,
          }}
        >
          {subtitle}
        </p>

        {children}
      </div>
    </div>
  );
}

function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const redirect = params.get('redirect');

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(form.email, form.password);

      toast.success(`Welcome back, ${user?.name?.split(' ')[0] || 'User'}!`);

      if (redirect) {
        navigate(redirect);
        return;
      }

      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;

        case 'vet':
          navigate('/vet/dashboard');
          break;

        case 'volunteer':
          navigate('/volunteer/dashboard');
          break;

        default:
          navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your PawRescue account"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            required
          />
        </div>

        <button
          className="btn btn-primary btn-full"
          type="submit"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? <span className="spinner" /> : 'Log in'}
        </button>
      </form>

      <p
        style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        No account?{' '}
        <Link
          to={
            redirect
              ? `/register?redirect=${encodeURIComponent(redirect)}`
              : '/register'
          }
          style={{ color: 'var(--green)', fontWeight: 500 }}
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const redirect = params.get('redirect');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await register(form);

      toast.success('Account created successfully!');

      if (redirect) {
        navigate(redirect);
        return;
      }

      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;

        case 'vet':
          navigate('/vet/dashboard');
          break;

        case 'volunteer':
          navigate('/volunteer/dashboard');
          break;

        default:
          navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  return (
    <AuthCard
      title="Join PawRescue"
      subtitle="Create your account to report and manage rescues"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              className="form-input"
              placeholder="Your full name"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              type="tel"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={set('phone')}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">City</label>
          <input
            className="form-input"
            placeholder="Your city"
            value={form.city}
            onChange={set('city')}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={set('password')}
            required
            minLength={6}
          />
        </div>

        <button
          className="btn btn-primary btn-full"
          type="submit"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? <span className="spinner" /> : 'Create account'}
        </button>
      </form>

      <p
        style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        Already have an account?{' '}
        <Link
          to={
            redirect
              ? `/login?redirect=${encodeURIComponent(redirect)}`
              : '/login'
          }
          style={{ color: 'var(--green)', fontWeight: 500 }}
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

export default Login;

