import { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterFlyout from '../components/RegisterFlyout';

const stats = [
  { value: '', label: ' ' },
  { value: '',   label: ' ' },
  { value: '', label: ' ' },
  { value: '', label: ' ' },
];

const howItWorks = [
  { step: '01', icon: '', title: 'Report the case', desc: 'Upload a photo, drop your GPS pin, describe the situation. Takes 60 seconds.' },
  { step: '02', icon: '', title: 'AI triages severity', desc: 'Our system analyses the image for blood, posture, and wound signals to score urgency 1–5.' },
  { step: '03', icon: '', title: 'Nearest responder dispatched', desc: 'A trained volunteer is sent first to stabilise. A vet is simultaneously alerted.' },
  { step: '04', icon: '', title: 'Track live', desc: 'Watch the rescue unfold on a live status bar. Get notified the moment the animal is safe.' },
  { step: '05', icon: '', title: 'Report delivered', desc: 'A full PDF report — timeline, responders, outcome — lands in your inbox when its done.' }
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
    <div className="page-enter">

      {/* ── Hero ── */}
      <section style={{
        minHeight: 'calc(100vh - var(--nav-h))',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 24px',
        background: 'linear-gradient(160deg, #f8fdfb 0%, #fafaf8 60%, #fff8f5 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background paw watermark */}
        <div style={{ position:'absolute', right:-60, top:'50%', transform:'translateY(-50%)', fontSize:320, opacity:0.03, pointerEvents:'none', userSelect:'none', lineHeight:1 }}>
          🐾
        </div>

        <div className="container" style={{ maxWidth: 760, position:'relative' }}>
          <span style={{
            display: 'inline-block', padding: '5px 14px', borderRadius: 20,
            background: 'var(--green-light)', color: 'var(--green-mid)',
            fontSize: 13, fontWeight: 500, marginBottom: 24,
          }}>
          Animal rescue network
          </span>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 6vw, 72px)',
            lineHeight: 1.1, marginBottom: 24, color: 'var(--text)',
          }}>
            Every animal
            <br />
            <em style={{ color: 'var(--green)', fontStyle: 'italic' }}>deserves a rescue.</em>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 540, lineHeight: 1.7, marginBottom: 40 }}>
            Report an injured street animal. 
            Trained volunteers and verified vets respond at earliest.
          </p>

          <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
            <button
              className="btn btn-coral btn-lg"
              onClick={() => setFlyoutOpen(true)}
            >
              Register a case
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <Link to="/join/vet"       className="btn btn-outline btn-lg">Join as a vet</Link>
            <Link to="/join/volunteer" className="btn btn-ghost btn-lg">Register as volunteer</Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: 'var(--green)', padding: '40px 24px' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:32, textAlign:'center' }}>
            {stats.map((s) => (
              <div key={s.label}>
                <p style={{ fontFamily:'var(--font-serif)', fontSize:36, color:'#fff', lineHeight:1 }}>{s.value}</p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:6 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding:'80px 24px' }}>
        <div className="container">
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'0.1em', color:'var(--text-hint)', textTransform:'uppercase', marginBottom:8 }}>
            The process
          </p>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(28px,4vw,44px)', marginBottom:52 }}>
            How a rescue works
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
            {howItWorks.map((step, i) => (
              <div key={step.step} style={{ display:'flex', gap:28, alignItems:'flex-start' }}>
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0,
                }}>
                  <div style={{
                    width:48, height:48, borderRadius:'50%',
                    background: i % 2 === 0 ? 'var(--green-light)' : 'var(--coral-light)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                  }}>{step.icon}</div>
                  {i < howItWorks.length - 1 && (
                    <div style={{ width:2, flex:1, minHeight:32, background:'var(--border)', margin:'8px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop:10 }}>
                  <span style={{ fontSize:11, color:'var(--text-hint)', fontWeight:600, letterSpacing:'0.08em' }}>{step.step}</span>
                  <h3 style={{ fontSize:18, fontWeight:600, margin:'4px 0 8px' }}>{step.title}</h3>
                  <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding:'80px 24px', background:'var(--green-light)' }}>
        <div className="container">
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'0.1em', color:'var(--green-mid)', textTransform:'uppercase', marginBottom:8 }}>
            Platform features
          </p>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(28px,4vw,44px)', marginBottom:48 }}>
            Built to save lives, not just report them
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
            {features.map((f) => (
              <div key={f.title} className="card" style={{ border:'1px solid rgba(29,158,117,0.15)' }}>
                <span style={{ fontSize:28, display:'block', marginBottom:14 }}>{f.icon}</span>
                <h3 style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>{f.title}</h3>
                <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join network ── */}
      <section style={{ padding:'80px 24px' }}>
        <div className="container" style={{ maxWidth:780 }}>
          <div style={{
            background:'var(--green)', borderRadius:'var(--radius-xl)',
            padding:'60px 48px', textAlign:'center', position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', right:-20, top:-20, fontSize:160, opacity:0.07, pointerEvents:'none' }}>🩺</div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(26px,4vw,40px)', color:'#fff', marginBottom:16 }}>
              Want to joion NGO team?
            </h2>
            <p style={{ color:'rgba(255,255,255,0.8)', fontSize:15, marginBottom:32, maxWidth:460, margin:'0 auto 32px' }}>
              Join the rescue network. Vets receive nearby dispatch alerts. Volunteers help on-ground before the vet arrives.
            </p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <Link to="/join/vet"       className="btn btn-lg" style={{ background:'#fff', color:'var(--green)', border:'none' }}>Register as vet</Link>
              <Link to="/join/volunteer" className="btn btn-lg" style={{ background:'transparent', color:'#fff', border:'1.5px solid rgba(255,255,255,0.5)' }}>Become a volunteer</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating rescue button (mobile) ── */}
      <button
        onClick={() => setFlyoutOpen(true)}
        style={{
          display: 'none', // shown via media query
          position:'fixed', bottom:24, right:24, zIndex:50,
          background:'var(--coral)', color:'#fff',
          borderRadius:50, padding:'14px 22px',
          fontWeight:600, fontSize:15, border:'none',
          boxShadow:'0 6px 24px rgba(216,90,48,0.4)',
        }}
        className="fab-rescue"
      >
        + Report case
      </button>
      <style>{`.fab-rescue { display: none; } @media(max-width:600px){.fab-rescue{display:block!important;}}`}</style>

      <RegisterFlyout open={flyoutOpen} onClose={() => setFlyoutOpen(false)} />
    </div>
  );
}