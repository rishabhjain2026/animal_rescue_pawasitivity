
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminLogin() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [form,       setForm]       = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPw,     setShowPw]     = useState(false);

  // Already logged in as admin → redirect immediately
  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // AuthContext.login() handles the admin check internally.
      // If email+password match ADMIN_EMAIL/ADMIN_PASSWORD it sets role:'admin'
      // without any backend call. If credentials are wrong it throws.
      const loggedIn = await login(form.email, form.password);

      if (loggedIn.role !== 'admin') {
        // Someone tried to use their normal user credentials here
        toast.error('These are not admin credentials. Please use the regular login.');
        logout();
        return;
      }

      toast.success('Welcome to the admin panel 🛡️');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      padding: 24, fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🐾</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--green)', marginBottom: 4 }}>
            PawRescue
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Admin panel</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '32px 28px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--coral-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🛡️
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 1 }}>Admin sign in</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Restricted access only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="admin@pawrescue.in"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 6, height: 44, fontSize: 15, fontWeight: 600,
                background: 'var(--coral)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: submitting ? 0.75 : 1, transition: 'opacity 0.15s',
              }}>
              {submitting
                ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)', width: 18, height: 18, borderWidth: 2 }} /> Signing in…</>
                : '🛡️  Sign in to admin panel'
              }
            </button>
          </form>

          {/* Credentials hint */}
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(29,158,117,0.15)' }}>
            <p style={{ fontSize: 12, color: 'var(--green-mid)', fontWeight: 600, marginBottom: 4 }}>Credentials</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.9 }}>
              Email: admin@pawrescue.in<br />
              Password: Admin@123
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 6 }}>
              To change: update <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0 4px', borderRadius: 3 }}>ADMIN_EMAIL</code> and <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0 4px', borderRadius: 3 }}>ADMIN_PASSWORD</code> in <code>AuthContext.jsx</code>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-hint)' }}>
          Not an admin?{' '}
          <Link to="/" style={{ color: 'var(--green)', textDecoration: 'none' }}>Back to home</Link>
          {' · '}
          <Link to="/login" style={{ color: 'var(--green)', textDecoration: 'none' }}>User login</Link>
        </p>
      </div>
    </div>
  );
}




// import { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAdmin } from '../context/AdminContext';
// import { useToast } from '../context/ToastContext';

// export default function AdminLogin() {
//   const { login, admin } = useAdmin();
//   const navigate         = useNavigate();
//   const toast            = useToast();

//   const [form,    setForm]    = useState({ email: '', password: '' });
//   const [loading, setLoading] = useState(false);
//   const [showPw,  setShowPw]  = useState(false);

//   // If already logged in as admin, redirect immediately
//   useEffect(() => {
//     if (admin) navigate('/admin', { replace: true });
//   }, [admin, navigate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await login(form.email, form.password);
//       toast.success('Welcome to the admin panel');
//       navigate('/admin', { replace: true });
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Invalid credentials');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{
//       minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
//       background:'var(--bg)', padding:24, fontFamily:'var(--font-sans)',
//     }}>
//       <div style={{ width:'100%', maxWidth:400 }}>

//         {/* Logo */}
//         <div style={{ textAlign:'center', marginBottom:36 }}>
//           <div style={{ fontSize:44, marginBottom:10 }}>🐾</div>
//           <h1 style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'var(--green)', marginBottom:4 }}>
//             PawRescue
//           </h1>
//           <p style={{ fontSize:13, color:'var(--text-muted)' }}>Admin panel</p>
//         </div>

//         {/* Card */}
//         <div style={{
//           background:'var(--surface)', border:'1px solid var(--border)',
//           borderRadius:'var(--radius-lg)', padding:'32px 28px',
//           boxShadow:'var(--shadow-md)',
//         }}>
//           {/* Admin badge */}
//           <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
//             <div style={{ width:40, height:40, borderRadius:10, background:'var(--coral-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
//               🛡️
//             </div>
//             <div>
//               <h2 style={{ fontSize:18, fontWeight:600, marginBottom:1 }}>Admin sign in</h2>
//               <p style={{ fontSize:12, color:'var(--text-muted)' }}>Restricted access</p>
//             </div>
//           </div>

//           <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
//             <div className="form-group">
//               <label className="form-label">Email</label>
//               <input
//                 className="form-input"
//                 type="email"
//                 placeholder="admin@pawrescue.in"
//                 value={form.email}
//                 onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
//                 required
//                 autoFocus
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Password</label>
//               <div style={{ position:'relative' }}>
//                 <input
//                   className="form-input"
//                   type={showPw ? 'text' : 'password'}
//                   placeholder="••••••••"
//                   value={form.password}
//                   onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
//                   required
//                   style={{ paddingRight:44 }}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPw(p => !p)}
//                   style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16 }}>
//                   {showPw ? '🙈' : '👁️'}
//                 </button>
//               </div>
//             </div>

//             <button
//               className="btn btn-full"
//               type="submit"
//               disabled={loading}
//               style={{ marginTop:6, height:44, fontSize:15, background:'var(--coral)', color:'#fff', borderColor:'var(--coral)', borderRadius:'var(--radius-sm)' }}>
//               {loading ? <span className="spinner" style={{ borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.3)' }} /> : 'Sign in to admin panel'}
//             </button>
//           </form>

//           {/* Default credentials hint */}
//           <div style={{ marginTop:20, padding:'12px 14px', background:'var(--green-light)', borderRadius:'var(--radius-sm)', border:'1px solid rgba(29,158,117,0.15)' }}>
//             <p style={{ fontSize:12, color:'var(--green-mid)', fontWeight:600, marginBottom:4 }}>Default credentials</p>
//             <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace', lineHeight:1.8 }}>
//               Email: admin@pawrescue.in<br />
//               Password: Admin@123
//             </p>
//             <p style={{ fontSize:11, color:'var(--text-hint)', marginTop:6 }}>
//               Override with <code style={{ background:'rgba(0,0,0,0.05)', padding:'0 4px', borderRadius:3 }}>ADMIN_EMAIL</code> and <code style={{ background:'rgba(0,0,0,0.05)', padding:'0 4px', borderRadius:3 }}>ADMIN_PASSWORD</code> in server <code>.env</code>
//             </p>
//           </div>
//         </div>

//         <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--text-hint)' }}>
//           Not an admin?{' '}
//           <Link to="/" style={{ color:'var(--green)', textDecoration:'none' }}>Back to PawRescue</Link>
//           {' '}·{' '}
//           <Link to="/login" style={{ color:'var(--green)', textDecoration:'none' }}>User login</Link>
//         </p>
//       </div>
//     </div>
//   );
// }