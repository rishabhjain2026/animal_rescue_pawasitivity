import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const options = [
  {
    key:         'domestic',
    path:        '/report/domestic',
    requiresAuth: true,   // needs login — has pets, appointments, health records
    icon:        '🏠',
    title:       'Domestic animal',
    desc:        'My pet needs a vet — book an appointment, track health records.',
    color:       'var(--green)',
    bg:          'var(--green-light)',
    authNote:    'You\'ll need to log in so we can link the case to your pet\'s records.',
  },
  {
    key:         'street',
    path:        '/report/street',
    requiresAuth: false,  // public — phone OTP is enough
    icon:        '🐕',
    title:       'Street animal',
    desc:        'Injured or sick animal on the street — dispatch rescue team now.',
    color:       'var(--coral)',
    bg:          'var(--coral-light)',
    authNote:    null,
  },
];

export default function RegisterFlyout({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSelect = (opt) => {
    onClose();

    // Street is always direct — no auth needed (OTP handled inside StreetForm)
    if (!opt.requiresAuth) {
      navigate(opt.path);
      return;
    }

    // Domestic requires a logged-in account
    if (!user) {
      // Pass the destination as ?redirect= so Login sends them there after signing in
      navigate(`/login?redirect=${encodeURIComponent(opt.path)}`);
      return;
    }

    navigate(opt.path);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Flyout panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 40px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        animation: 'slideUpFlyout 0.32s cubic-bezier(0.22,1,0.36,1)',
        maxWidth: 560,
        margin: '0 auto',
      }}>
        <style>{`
          @keyframes slideUpFlyout {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle bar */}
        <div style={{
          width: 40, height: 4, borderRadius: 4,
          background: 'var(--border-md)', margin: '0 auto 28px',
        }} />

        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-hint)', textTransform:'uppercase', marginBottom: 8 }}>
          Register a case
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, marginBottom: 24, lineHeight: 1.25 }}>
          What kind of animal needs help?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {options.map((opt) => {
            const willAskLogin = opt.requiresAuth && !user;

            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${opt.color}22`,
                  background: opt.bg,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>

                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 16, color: opt.color, marginBottom: 3 }}>
                    {opt.title}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {opt.desc}
                  </p>
                  {/* Show login notice inline per option, only when relevant */}
                  {willAskLogin && (
                    <p style={{ fontSize: 11, color: opt.color, marginTop: 6, opacity: 0.8 }}>
                      Login required
                    </p>
                  )}
                </div>

                <svg style={{ marginLeft:'auto', flexShrink:0 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4l6 6-6 6" stroke={opt.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            display: 'block', width:'100%', marginTop: 20,
            padding: '10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'transparent',
            fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer',
          }}>
          Cancel
        </button>
      </div>
    </>
  );
}