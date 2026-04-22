import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PawIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="18" rx="7" ry="5.5" fill="currentColor" opacity="0.15"/>
    <ellipse cx="14" cy="17" rx="5" ry="4" fill="currentColor"/>
    <ellipse cx="8"  cy="11" rx="2.5" ry="3" fill="currentColor"/>
    <ellipse cx="20" cy="11" rx="2.5" ry="3" fill="currentColor"/>
    <ellipse cx="11" cy="9"  rx="2"   ry="2.8" fill="currentColor"/>
    <ellipse cx="17" cy="9"  rx="2"   ry="2.8" fill="currentColor"/>
  </svg>
);

export default function Navbar() {
  const { user, logout, isRole } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open,    setOpen]    = useState(false);
  const [mobOpen, setMobOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const dashboardPath = isRole('vet')
    ? '/vet/dashboard'
    : isRole('volunteer')
    ? '/volunteer/dashboard'
    : '/dashboard';

  const navLinks = [
    { to: '/',      label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/join/vet',       label: 'Join as Vet',       hide: !!user },
    { to: '/join/volunteer', label: 'Join as Volunteer',  hide: !!user },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)', height: 'var(--nav-h)',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, color:'var(--green)', fontFamily:'var(--font-serif)', fontSize:20 }}>
          <PawIcon />
          PawRescue
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {navLinks.filter(l => !l.hide).map(l => (
            <Link key={l.to} to={l.to} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: location.pathname === l.to ? 'var(--green)' : 'var(--text-muted)',
              background: location.pathname === l.to ? 'var(--green-light)' : 'transparent',
              transition: 'all 0.15s',
            }}>{l.label}</Link>
          ))}

          {user ? (
            <div style={{ position:'relative', marginLeft: 8 }}>
              <button
                onClick={() => setOpen(!open)}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'6px 12px', borderRadius:20,
                  border:'1.5px solid var(--border-md)',
                  background:'var(--surface)', cursor:'pointer',
                  fontSize:14, fontWeight:500,
                }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%',
                  background:'var(--green-light)', color:'var(--green)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:600,
                }}>{user.name?.[0]?.toUpperCase()}</div>
                {user.name?.split(' ')[0]}
                <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
              </button>

              {open && (
                <div style={{
                  position:'absolute', right:0, top:'calc(100% + 8px)',
                  background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:12, boxShadow:'var(--shadow-md)',
                  minWidth:180, overflow:'hidden', zIndex:200,
                }}>
                  <Link to={dashboardPath} onClick={() => setOpen(false)} style={{ display:'block', padding:'11px 16px', fontSize:14, color:'var(--text)', borderBottom:'1px solid var(--border)' }}>
                    My Dashboard
                  </Link>
                  {isRole('user') && (
                    <Link to="/my-pets/register" onClick={() => setOpen(false)} style={{ display:'block', padding:'11px 16px', fontSize:14, color:'var(--text)', borderBottom:'1px solid var(--border)' }}>
                      Register Pet
                    </Link>
                  )}
                  <button onClick={handleLogout} style={{
                    display:'block', width:'100%', textAlign:'left',
                    padding:'11px 16px', fontSize:14, color:'var(--coral)',
                    background:'none', border:'none', cursor:'pointer',
                  }}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', gap:8, marginLeft:8 }}>
              <Link to="/login"    className="btn btn-outline btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </div>
          )}
        </div>

      </div>
      {/* Close dropdown on outside click */}
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }} />}
    </nav>
  );
}