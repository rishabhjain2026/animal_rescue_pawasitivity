import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function AuthCard({ children, title, subtitle }) {
  return (
    <div style={{ minHeight: 'calc(100vh - var(--nav-h))', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div className="card" style={{ width:'100%', maxWidth:440 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, marginBottom:6 }}>{title}</h1>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:28 }}>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const { login }  = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const redirect   = params.get('redirect');   // e.g. /report/domestic

  const [form,    setForm]    = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);

      // If a specific redirect was requested (e.g. came from flyout → domestic),
      // always honour it — regardless of role.
      if (redirect) {
        navigate(redirect);
        return;
      }

      // No redirect param — send to role-appropriate dashboard
      if      (user.role === 'vet')       navigate('/vet/dashboard');
      else if (user.role === 'volunteer') navigate('/volunteer/dashboard');
      else                                navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <AuthCard title="Welcome back" subtitle="Log in to your Pawsitivity account">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop:8 }}>
          {loading ? <span className="spinner" /> : 'Log in'}
        </button>
      </form>
      <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)' }}>
        No account?{' '}
        <Link
          to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
          style={{ color:'var(--green)', fontWeight:500 }}
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export default Login;

export function Register() {
  const { register } = useAuth();
  const toast        = useToast();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const redirect     = params.get('redirect');

  const [form,    setForm]    = useState({ name:'', email:'', phone:'', password:'', city:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to Pawsitivity.');
      // Honour redirect after signup too
      navigate(redirect || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <AuthCard title="Join Pawsitivity" subtitle="Create your account to report cases and track rescues">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" placeholder="Riya Sharma" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" placeholder="Mumbai" value={form.city} onChange={set('city')} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop:8 }}>
          {loading ? <span className="spinner" /> : 'Create account'}
        </button>
      </form>
      <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link
          to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
          style={{ color:'var(--green)', fontWeight:500 }}
        >
          Log in
        </Link>
      </p>
      <p style={{ textAlign:'center', marginTop:8, fontSize:12, color:'var(--text-hint)' }}>
        Vet or volunteer?{' '}
        <Link to="/join/vet" style={{ color:'var(--green)' }}>Register here instead</Link>
      </p>
    </AuthCard>
  );
}