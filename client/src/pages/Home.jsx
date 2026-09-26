import { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterFlyout from '../components/RegisterFlyout';

const stats = [
  { value: '1,420+', label: 'Animals Rescued' },
  { value: '350+', label: 'Verified Vets & Responders' },
  { value: '12 Min', label: 'Average Response Time' },
  { value: '98%', label: 'Successful Recoveries' },
];

const howItWorks = [
  { step: '01', icon: '📸', title: 'Report the case', desc: 'Upload a photo, drop your GPS pin, describe the situation. Takes 60 seconds.' },
  { step: '02', icon: '🤖', title: 'AI triages severity', desc: 'Our system analyses the image for blood, posture, and wound signals to score urgency 1–5.' },
  { step: '03', icon: '🚑', title: 'Nearest responder dispatched', desc: 'A trained volunteer is sent first to stabilise. A vet is simultaneously alerted.' },
  { step: '04', icon: '🗺️', title: 'Track live', desc: 'Watch the rescue unfold on a live status bar. Get notified the moment the animal is safe.' },
  { step: '05', icon: '📄', title: 'Report delivered', desc: 'A full PDF report — timeline, responders, outcome — lands in your inbox when its done.' }
];

const features = [
  { icon: '🏥', title: 'Verified vet network', desc: 'Every vet is license-verified and admin-approved before joining the platform.' },
  { icon: '⚡', title: 'Auto-escalation', desc: 'If a responder doesn\'t reply in 5 minutes, the case cascades to the next nearest automatically.' },
  { icon: '🐾', title: 'Pet health passport', desc: 'Domestic pets get a permanent PIN and QR code linking to their full medical history.' },
  { icon: '🗺️', title: 'Location-aware dispatch', desc: 'Geospatial search finds the truly nearest responder — not just the same city.' },
  { icon: '💊', title: 'Instant first-aid guide', desc: 'The moment you report, you get a step-by-step first-aid guide matched to the injury type.' },
  { icon: '📊', title: 'Full audit trail', desc: 'Every action is timestamped. The rescue report shows who did what and when.' },
];

export default function Home() {
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  return (
    <div className="page-enter" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* ── Background Floating Animals & Paws to Fill Empty Space ── */}
      <div className="floating-mascot mascot-cat-1">🐈</div>
      <div className="floating-mascot mascot-dog-1">🐕</div>
      <div className="floating-mascot mascot-paw-1">🐾</div>
      <div className="floating-mascot mascot-bunny-1">🐇</div>
      <div className="floating-mascot mascot-cat-2">🐈‍⬛</div>
      <div className="floating-mascot mascot-dog-2">🐩</div>
      <div className="floating-mascot mascot-paw-2">🐾</div>
      <div className="floating-mascot mascot-paw-3">🐾</div>

      {/* ── Hero Section ── */}
      <section style={{
        minHeight: 'calc(100vh - var(--nav-h))',
        display: 'flex', alignItems: 'center',
        padding: '60px 24px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #fafaf8 50%, #fff1eb 100%)',
        position: 'relative', zIndex: 2,
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center', maxWidth: 1100 }}>
          
          {/* Left Hero Content */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 30, background: 'var(--green-light)', color: 'var(--green-mid)', fontSize: 13, fontWeight: 600, marginBottom: 24, boxShadow: '0 4px 12px rgba(29, 158, 117, 0.08)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
              Active Emergency Response Network
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 5.5vw, 68px)',
              lineHeight: 1.1, marginBottom: 24, color: 'var(--text)',
              letterSpacing: '-0.02em'
            }}>
              Every animal
              <br />
              <em style={{ color: 'var(--green)', fontStyle: 'italic', textShadow: '0 2px 20px rgba(29,158,117,0.15)' }}>deserves a rescue.</em>
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.7, marginBottom: 36 }}>
              Report an injured street animal instantly. Trained volunteers and verified emergency vets mobilize within minutes.
            </p>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
              <button
                className="btn btn-coral btn-lg hero-cta-btn"
                onClick={() => setFlyoutOpen(true)}
                style={{ boxShadow: '0 8px 25px rgba(216,90,48,0.3)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              >
                Register a case
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <Link to="/join/vet" className="btn btn-outline btn-lg" style={{ transition: 'all 0.2s ease' }}>Join as a vet</Link>
            </div>
          </div>

          {/* Right Hero Creative Card Showcase */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div className="hero-floating-card" style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(29, 158, 117, 0.2)',
              borderRadius: 28,
              padding: '30px',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
              position: 'relative',
              zIndex: 3
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>🚨 Live Alert Example</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>2 mins ago</span>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, background: 'var(--green-light)', width: 60, height: 60, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐕</div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Injured Puppy Reported</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Sector 4, Main Street • Urgency Lvl 4</p>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 16, fontSize: 13, color: 'var(--text)', border: '1px solid #e2e8f0' }}>
                ⚡ <strong>Status:</strong> Volunteer dispatched &amp; En route. Vet team on standby.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', padding: '48px 24px', position: 'relative', zIndex: 2, boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.05)' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:32, textAlign:'center' }}>
            {stats.map((s, idx) => (
              <div key={idx} className="stat-card-item" style={{ transition: 'transform 0.3s ease' }}>
                <p style={{ fontFamily:'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', color:'#fff', lineHeight:1, fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{s.value}</p>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.85)', marginTop:8, fontWeight: 500, letterSpacing: '0.02em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding:'100px 24px', background: '#fff', position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.15em', color:'var(--green)', textTransform:'uppercase', marginBottom:8 }}>
              Seamless Workflow
            </p>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(32px,4vw,48px)', letterSpacing: '-0.02em' }}>
              How a rescue works in minutes
            </h2>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {howItWorks.map((step, i) => (
              <div 
                key={step.step} 
                className="workflow-step-card"
                style={{ 
                  display:'flex', gap:28, alignItems:'flex-start', padding: '28px 32px', 
                  borderRadius: 20, background: '#fafaf9', border: '1px solid #f0f0ef',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div style={{
                  width:56, height:56, borderRadius:16, flexShrink:0,
                  background: i % 2 === 0 ? 'var(--green-light)' : 'var(--coral-light)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.04)'
                }}>
                  {step.icon}
                </div>
                <div style={{ paddingTop: 4, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h3 style={{ fontSize:20, fontWeight:700, color: 'var(--text)' }}>{step.title}</h3>
                    <span style={{ fontSize:13, color: 'var(--green)', fontWeight: 700, background: 'var(--green-light)', padding: '2px 10px', borderRadius: 10 }}>Step {step.step}</span>
                  </div>
                  <p style={{ fontSize:15, color:'var(--text-muted)', lineHeight:1.7, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding:'100px 24px', background:'linear-gradient(180deg, #f8fdfb 0%, #edfcf6 100%)', position: 'relative', zIndex: 2 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.15em', color:'var(--green-mid)', textTransform:'uppercase', marginBottom:8 }}>
              Advanced Capabilities
            </p>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(32px,4vw,48px)', letterSpacing: '-0.02em' }}>
              Built to save lives, not just report them
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:28 }}>
            {features.map((f, index) => (
              <div 
                key={f.title} 
                className="feature-card hover-lift" 
                style={{ 
                  background: '#fff', padding: '36px 32px', borderRadius: 24, 
                  border:'1px solid rgba(29,158,117,0.12)', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize:18, fontWeight:700, marginBottom:10, color: 'var(--text)' }}>{f.title}</h3>
                <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join Network Callout ── */}
      <section style={{ padding:'80px 24px 120px', position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ maxWidth:840 }}>
          <div style={{
            background:'linear-gradient(135deg, var(--green) 0%, #047857 100%)', borderRadius: 32,
            padding:'70px 50px', textAlign:'center', position:'relative', overflow:'hidden',
            boxShadow: '0 20px 50px rgba(5, 150, 105, 0.25)'
          }}>
            <div style={{ position:'absolute', right:-30, top:-30, fontSize:180, opacity:0.08, pointerEvents:'none' }}>🩺</div>
            
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(28px, 4vw, 42px)', color:'#fff', marginBottom:18, letterSpacing: '-0.02em' }}>
              Want to join our rescue team?
            </h2>
            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:16, lineHeight: 1.7, marginBottom:36, maxWidth:500, margin:'0 auto 36px' }}>
              Become part of the frontline defense. Vets receive real-time nearby dispatch alerts; volunteers provide crucial stabilization on-ground.
            </p>
            <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
              <Link to="/join/vet" className="btn btn-lg" style={{ background:'#fff', color:'var(--green)', border:'none', fontWeight: 600, boxShadow: '0 8px 20px rgba(0,0,0,0.1)', transition: 'transform 0.2s ease' }}>Register as a Vet</Link>
              <Link to="/join/volunteer" className="btn btn-lg" style={{ background:'transparent', color:'#fff', border:'2px solid rgba(255,255,255,0.6)', fontWeight: 600, transition: 'all 0.2s ease' }}>Become a Volunteer</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating rescue button (mobile) ── */}
      <button
        onClick={() => setFlyoutOpen(true)}
        style={{
          display: 'none',
          position:'fixed', bottom:24, right:24, zIndex:50,
          background:'var(--coral)', color:'#fff',
          borderRadius:50, padding:'16px 24px',
          fontWeight:700, fontSize:15, border:'none',
          boxShadow: '0 8px 28px rgba(216,90,48,0.45)',
          cursor: 'pointer'
        }}
        className="fab-rescue"
      >
        + Report Case
      </button>

      {/* Embedded CSS Animations & Floating Background Pets Styles */}
      <style>{`
        @keyframes pulse-dot {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(29, 158, 117, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(29, 158, 117, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(29, 158, 117, 0); }
        }

        @keyframes floatRandom {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-25px) translateX(20px) rotate(8deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }

        .floating-mascot {
          position: absolute;
          font-size: 42px;
          opacity: 0.12;
          pointer-events: none;
          user-select: none;
          z-index: 1;
        }

        /* Distributed elements across the page sections to fill empty gaps */
        .mascot-cat-1 { top: 8%; left: 4%; animation: floatRandom 7s ease-in-out infinite; }
        .mascot-dog-1 { top: 18%; right: 5%; animation: floatRandom 9s ease-in-out infinite 1s; font-size: 48px; }
        .mascot-paw-1 { top: 38%; left: 2%; animation: floatRandom 8s ease-in-out infinite 2s; font-size: 32px; }
        .mascot-bunny-1 { top: 52%; right: 3%; animation: floatRandom 10s ease-in-out infinite 1.5s; font-size: 45px; }
        .mascot-cat-2 { top: 70%; left: 3%; animation: floatRandom 8.5s ease-in-out infinite 2.5s; font-size: 40px; }
        .mascot-dog-2 { top: 85%; right: 6%; animation: floatRandom 9.5s ease-in-out infinite 0.5s; font-size: 50px; }
        .mascot-paw-2 { top: 44% ; right: 45%; animation: floatRandom 7.5s ease-in-out infinite 3s; font-size: 28px; }
        .mascot-paw-3 { top: 92% ; left: 40%; animation: floatRandom 11s ease-in-out infinite 1.2s; font-size: 34px; }

        .hero-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(216,90,48,0.4) !important;
        }
        .workflow-step-card:hover {
          transform: translateY(-4px);
          border-color: var(--green);
          box-shadow: 0 12px 30px rgba(0,0,0,0.06);
          background: #fff !important;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 35px rgba(29,158,117,0.1) !important;
          border-color: var(--green) !important;
        }
        .stat-card-item:hover {
          transform: translateY(-3px);
        }
        .fab-rescue { display: none; } 
        @media(max-width:768px){
          .fab-rescue { display: block !important; }
          .floating-mascot { display: none; }
        }
      `}</style>

      <RegisterFlyout open={flyoutOpen} onClose={() => setFlyoutOpen(false)} />
    </div>
  );
}