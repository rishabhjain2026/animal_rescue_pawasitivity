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

  // const dashboardPath = isRole('vet')
  //   ? '/vet/dashboard'
  //   : isRole('volunteer')
  //   ? '/volunteer/dashboard'
  //   : '/dashboard';

  const dashboardPath = isRole('admin')
  ? '/admin/dashboard'
  : isRole('vet')
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
// ----------------------------------------


// import { useState, useEffect, useRef } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function Navbar() {
//   const { user, logout, isRole } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [profileOpen, setProfileOpen] = useState(false);
//   const [loginOpen, setLoginOpen] = useState(false);

//   const loginRef = useRef(null);
//   const profileRef = useRef(null);

//   useEffect(() => {
//     const handler = (e) => {
//       if (loginRef.current && !loginRef.current.contains(e.target)) {
//         setLoginOpen(false);
//       }

//       if (profileRef.current && !profileRef.current.contains(e.target)) {
//         setProfileOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handler);

//     return () => {
//       document.removeEventListener('mousedown', handler);
//     };
//   }, []);

//   const dashboardPath = isRole('admin')
//     ? '/admin/dashboard'
//     : isRole('vet')
//     ? '/vet/dashboard'
//     : isRole('volunteer')
//     ? '/volunteer/dashboard'
//     : '/dashboard';

//   const handleLogout = () => {
//     logout();
//     navigate('/');
//     setProfileOpen(false);
//   };

//   const activeIdentity = user
//     ? {
//         name: user.name || 'Admin',
//         role: user.role,
//         initial: user.name?.[0]?.toUpperCase() || 'A',
//       }
//     : null;

//   const roleBadge = {
//     admin: {
//       bg: 'var(--coral-light)',
//       color: 'var(--coral)',
//       label: 'Admin',
//     },
//     vet: {
//       bg: '#E6F1FB',
//       color: '#185FA5',
//       label: 'Vet',
//     },
//     volunteer: {
//       bg: 'var(--amber-light)',
//       color: '#854F0B',
//       label: 'Volunteer',
//     },
//     user: {
//       bg: 'var(--green-light)',
//       color: 'var(--green-mid)',
//       label: 'User',
//     },
//   };

//   const navLinks = [
//     { to: '/', label: 'Home' },
//     { to: '/about', label: 'About' },
//     { to: '/join/vet', label: 'Join as Vet', hide: !!user },
//     { to: '/join/volunteer', label: 'Join as Volunteer', hide: !!user },
//   ];

//   const isLoggedIn = !!user;

//   return (
//     <nav
//       style={{
//         position: 'sticky',
//         top: 0,
//         zIndex: 100,
//         background: 'rgba(255,255,255,0.96)',
//         backdropFilter: 'blur(12px)',
//         borderBottom: '1px solid var(--border)',
//         height: 'var(--nav-h)',
//         display: 'flex',
//         alignItems: 'center',
//       }}
//     >
//       <div
//         className="container"
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           width: '100%',
//         }}
//       >
//         <Link
//           to="/"
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: 8,
//             color: 'var(--green)',
//             fontFamily: 'var(--font-serif)',
//             fontSize: 20,
//             textDecoration: 'none',
//           }}
//         >
//           <PawIcon />
//           PawRescue
//         </Link>

//         <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//           {navLinks
//             .filter((l) => !l.hide)
//             .map((l) => (
//               <Link
//                 key={l.to}
//                 to={l.to}
//                 style={{
//                   padding: '6px 12px',
//                   borderRadius: 8,
//                   fontSize: 14,
//                   fontWeight: 500,
//                   textDecoration: 'none',
//                   color:
//                     location.pathname === l.to
//                       ? 'var(--green)'
//                       : 'var(--text-muted)',
//                   background:
//                     location.pathname === l.to
//                       ? 'var(--green-light)'
//                       : 'transparent',
//                   transition: 'all 0.15s',
//                 }}
//               >
//                 {l.label}
//               </Link>
//             ))}

//           {isLoggedIn && activeIdentity ? (
//             <div ref={profileRef} style={{ position: 'relative', marginLeft: 8 }}>
//               <button
//                 onClick={() => setProfileOpen((p) => !p)}
//                 style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: 8,
//                   padding: '6px 12px',
//                   borderRadius: 20,
//                   border: '1.5px solid var(--border-md)',
//                   background: 'var(--surface)',
//                   cursor: 'pointer',
//                   fontSize: 14,
//                   fontWeight: 500,
//                 }}
//               >
//                 <div
//                   style={{
//                     width: 28,
//                     height: 28,
//                     borderRadius: '50%',
//                     background: isRole('admin')
//                       ? 'var(--coral-light)'
//                       : 'var(--green-light)',
//                     color: isRole('admin')
//                       ? 'var(--coral)'
//                       : 'var(--green)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     fontSize: 13,
//                     fontWeight: 700,
//                   }}
//                 >
//                   {activeIdentity.initial}
//                 </div>

//                 {activeIdentity.name?.split(' ')[0]}

//                 {isRole('admin') && (
//                   <span
//                     style={{
//                       fontSize: 10,
//                       padding: '1px 6px',
//                       borderRadius: 20,
//                       background: 'var(--coral-light)',
//                       color: 'var(--coral)',
//                       fontWeight: 700,
//                     }}
//                   >
//                     ADMIN
//                   </span>
//                 )}

//                 <ChevronDown />
//               </button>

//               {profileOpen && (
//                 <div
//                   style={{
//                     position: 'absolute',
//                     right: 0,
//                     top: 'calc(100% + 8px)',
//                     background: 'var(--surface)',
//                     border: '1px solid var(--border)',
//                     borderRadius: 12,
//                     boxShadow: 'var(--shadow-md)',
//                     minWidth: 200,
//                     overflow: 'hidden',
//                     zIndex: 200,
//                   }}
//                 >
//                   <div
//                     style={{
//                       padding: '10px 16px',
//                       borderBottom: '1px solid var(--border)',
//                       background: 'var(--bg)',
//                     }}
//                   >
//                     <p
//                       style={{
//                         fontSize: 11,
//                         color: 'var(--text-hint)',
//                         marginBottom: 2,
//                       }}
//                     >
//                       Signed in as
//                     </p>

//                     <p
//                       style={{
//                         fontSize: 13,
//                         fontWeight: 600,
//                         color: 'var(--text)',
//                         marginBottom: 4,
//                       }}
//                     >
//                       {activeIdentity.name}
//                     </p>

//                     <span
//                       style={{
//                         fontSize: 11,
//                         padding: '2px 8px',
//                         borderRadius: 20,
//                         fontWeight: 600,
//                         background:
//                           roleBadge[activeIdentity.role]?.bg ||
//                           'var(--green-light)',
//                         color:
//                           roleBadge[activeIdentity.role]?.color ||
//                           'var(--green)',
//                       }}
//                     >
//                       {roleBadge[activeIdentity.role]?.label ||
//                         activeIdentity.role}
//                     </span>
//                   </div>

//                   <Link
//                     to={dashboardPath}
//                     onClick={() => setProfileOpen(false)}
//                     style={{
//                       display: 'block',
//                       padding: '11px 16px',
//                       fontSize: 14,
//                       color: 'var(--text)',
//                       textDecoration: 'none',
//                       borderBottom: '1px solid var(--border)',
//                     }}
//                   >
//                     {isRole('admin')
//                       ? '🛡️ Admin Dashboard'
//                       : '📊 My Dashboard'}
//                   </Link>

//                   {!isRole('admin') && isRole('user') && (
//                     <Link
//                       to="/my-pets/register"
//                       onClick={() => setProfileOpen(false)}
//                       style={{
//                         display: 'block',
//                         padding: '11px 16px',
//                         fontSize: 14,
//                         color: 'var(--text)',
//                         textDecoration: 'none',
//                         borderBottom: '1px solid var(--border)',
//                       }}
//                     >
//                       🐾 Register Pet
//                     </Link>
//                   )}

//                   <button
//                     onClick={handleLogout}
//                     style={{
//                       display: 'block',
//                       width: '100%',
//                       textAlign: 'left',
//                       padding: '11px 16px',
//                       fontSize: 14,
//                       color: 'var(--coral)',
//                       background: 'none',
//                       border: 'none',
//                       cursor: 'pointer',
//                     }}
//                   >
//                     Log out
//                   </button>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div
//               style={{
//                 display: 'flex',
//                 gap: 8,
//                 marginLeft: 8,
//                 alignItems: 'center',
//               }}
//             >
//               <Link to="/login" className="btn btn-outline btn-sm">
//                 Log in
//               </Link>

//               <Link to="/register" className="btn btn-primary btn-sm">
//                 Sign up
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }

