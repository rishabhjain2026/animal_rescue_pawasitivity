
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportStreetCase, sendOtp, verifyOtp } from '../api/cases.api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import useGeolocation from '../hooks/useGeolocation';
import FirstAidGuide from '../components/FirstAidGuide';
import MapView from '../components/MapView';

const INJURY_TYPES = [
  { value: 'hit-by-vehicle', label: 'Hit by vehicle' },
  { value: 'wound',          label: 'Visible wound / bleeding' },
  { value: 'fracture',       label: 'Suspected fracture' },
  { value: 'poisoning',      label: 'Suspected poisoning' },
  { value: 'malnourished',   label: 'Malnourished / dehydrated' },
  { value: 'disease',        label: 'Sick / diseased' },
  { value: 'unknown',        label: 'Not sure' },
];

const FIRST_AID_GUIDES = {
  'hit-by-vehicle': { title:'Hit by vehicle', urgent:true,  steps:['Do NOT move the animal — possible spinal injury.','Keep bystanders away and reduce noise.','Cover loosely with cloth to reduce shock.','If bleeding, apply gentle pressure — do not remove cloth.','Do not give food or water.','Stay calm and wait for the responder.'] },
  'wound':          { title:'Visible wound',  urgent:false, steps:['Do not touch the wound without gloves.','Place a clean cloth gently over the wound.','Apply light pressure — do not wrap tightly.','Do not pour water or antiseptic on the wound.','Keep the animal in shade away from traffic.'] },
  'poisoning':      { title:'Suspected poisoning', urgent:true, steps:['Do NOT induce vomiting unless directed by vet.','Move animal away from poison source.','Photograph the substance if possible.','Watch for seizures, drooling, or loss of coordination.','This is a medical emergency — responder has been prioritised.'] },
  'fracture':       { title:'Suspected fracture', urgent:false, steps:['Do not attempt to splint or straighten the limb.','Minimise movement.','Keep the animal warm.','Do not give food or water.'] },
  'malnourished':   { title:'Malnourished / dehydrated', urgent:false, steps:['Offer a small amount of plain water — do not force.','Do not offer large amounts of food suddenly.','A few plain biscuits or boiled rice is safe.','Move to shade.'] },
  'disease':        { title:'Sick / diseased', urgent:false, steps:['Avoid direct skin contact.','Note symptoms: discharge, breathing, skin condition.','Provide shade and fresh water if accessible.','Do not attempt to medicate.'] },
  'unknown':        { title:'General first aid', urgent:false, steps:['Keep a safe distance until the responder arrives.','Reduce noise and crowds.','Provide shade if possible.','Do not attempt to pick up or restrain unless trained.'] },
};

// ── OTP Modal ─────────────────────────────────────────────────────────────────
function OtpModal({ phone, onVerified, onClose }) {
  const toast   = useToast();
  const { user, login } = useAuth();

  const [stage,   setStage]   = useState('phone');   // 'phone' | 'otp'
  const [ph,      setPh]      = useState(phone || '');
  const [otp,     setOtp]     = useState('');
  const [sending, setSending] = useState(false);
  const [verifying,setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSend = async () => {
    if (ph.replace(/\D/g,'').length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
    setSending(true);
    try {
      await sendOtp(ph);
      setStage('otp');
      startCountdown();
      toast.success('OTP sent! Check your phone.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setVerifying(true);
    try {
      const res = await verifyOtp(ph, otp);
      // Store token so the subsequent case-report API call is authenticated
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data));
      toast.success('Phone verified!');
      onVerified(ph, res.data.token);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:300,
        background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
      }} />

      {/* Modal */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:301,
        background:'var(--surface)', borderRadius:'24px 24px 0 0',
        padding:'32px 24px 40px', maxWidth:480, margin:'0 auto',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',
        animation:'slideUpFlyout 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <style>{`@keyframes slideUpFlyout{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Handle */}
        <div style={{ width:40, height:4, borderRadius:4, background:'var(--border-md)', margin:'0 auto 28px' }} />

        {stage === 'phone' ? (
          <>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
              Quick verification
            </p>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:24, marginBottom:10 }}>
              Enter your phone number
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24, lineHeight:1.6 }}>
              No registration needed. We'll send a 6-digit OTP to verify you before submitting the rescue report.
            </p>

            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Mobile number</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={ph}
                onChange={e => setPh(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                autoFocus
                style={{ fontSize:16 }}
              />
            </div>

            <button className="btn btn-coral btn-full btn-lg" onClick={handleSend} disabled={sending}>
              {sending ? <><span className="spinner" /> Sending OTP...</> : 'Send OTP'}
            </button>

            <p style={{ fontSize:12, color:'var(--text-hint)', textAlign:'center', marginTop:16 }}>
              Already have an account?{' '}
              <a href="/login" style={{ color:'var(--green)' }}>Log in instead</a>
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
              Verify OTP
            </p>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:24, marginBottom:10 }}>
              Check your phone
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24, lineHeight:1.6 }}>
              We sent a 6-digit code to <strong>{ph}</strong>.{' '}
              <button onClick={() => setStage('phone')} style={{ background:'none', border:'none', color:'var(--green)', cursor:'pointer', fontSize:14, fontWeight:500 }}>Change number</button>
            </p>

            {/* OTP input boxes */}
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:24 }}>
              {Array.from({ length:6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g,'');
                    const arr = otp.split('');
                    arr[i] = val;
                    setOtp(arr.join('').slice(0,6));
                    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i-1}`)?.focus();
                  }}
                  id={`otp-${i}`}
                  style={{
                    width:44, height:52, textAlign:'center', fontSize:22, fontWeight:600,
                    border:`2px solid ${otp[i] ? 'var(--green)' : 'var(--border-md)'}`,
                    borderRadius:'var(--radius-sm)', outline:'none', background:'var(--surface)',
                    color:'var(--text)', transition:'border-color 0.15s',
                  }}
                />
              ))}
            </div>

            <button className="btn btn-coral btn-full btn-lg" onClick={handleVerify} disabled={verifying || otp.length < 6}>
              {verifying ? <><span className="spinner" /> Verifying...</> : 'Verify & submit rescue'}
            </button>

            <div style={{ textAlign:'center', marginTop:16 }}>
              {countdown > 0
                ? <p style={{ fontSize:13, color:'var(--text-hint)' }}>Resend OTP in {countdown}s</p>
                : <button onClick={() => { setOtp(''); handleSend(); }} style={{ background:'none', border:'none', color:'var(--green)', cursor:'pointer', fontSize:13, fontWeight:500 }}>
                    Resend OTP
                  </button>
              }
            </div>

            {/* Dev hint */}
            {process.env.NODE_ENV !== 'production' && (
              <p style={{ fontSize:11, color:'var(--text-hint)', textAlign:'center', marginTop:10 }}>
                Dev mode: OTP is logged in the server console
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Main StreetForm ───────────────────────────────────────────────────────────
export default function StreetForm() {
  const navigate  = useNavigate();
  const toast     = useToast();
  const { user }  = useAuth();

  const { coords, error: gpsError, loading: gpsLoading, getLocation } = useGeolocation();

  const [step,      setStep]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [images,    setImages]    = useState([]);
  const [previews,  setPreviews]  = useState([]);
  const [guide,     setGuide]     = useState(null);
  const [showOtp,   setShowOtp]   = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    description:   '',
    landmark:      '',
    injuryType:    'unknown',
    humanSeverity: '3',
    reporterPhone: '',
  });

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [k]: val }));
    if (k === 'injuryType') {
      const g   = FIRST_AID_GUIDES[val];
      const sev = parseInt(form.humanSeverity);
      setGuide({ ...g, severityNote: sev >= 4 ? 'CRITICAL: Responders prioritised.' : sev >= 3 ? 'MODERATE: Responder is on the way.' : 'MILD: Follow the steps below.' });
    }
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  // Called after OTP verified (or if user is already logged in)
  const submitCase = async (phone) => {
    setShowOtp(false);
    setLoading(true);
    try {
      const fd = new FormData();
      const finalPhone = phone || form.reporterPhone;
      Object.entries(form)
        .filter(([k]) => k !== 'reporterPhone')
        .forEach(([k, v]) => fd.append(k, v));
      fd.append('reporterPhone', finalPhone);
      fd.append('lat', coords.lat);
      fd.append('lng', coords.lng);
      images.forEach(img => fd.append('images', img));

      const res = await reportStreetCase(fd);
      toast.success('Case reported! Dispatching nearest responder...');
      navigate(`/track/${res.data.caseId}`, {
        state: { firstAidGuide: res.data.firstAidGuide, severity: res.data.severityScore },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report case');
    } finally {
      setLoading(false);
    }
  };

  // On final submit: if already logged in → submit directly, else show OTP modal
  const handleSubmit = () => {
    if (!coords) { toast.error('Please capture your GPS location first'); return; }
    if (user) {
      submitCase(form.reporterPhone || user.phone);
    } else {
      setShowOtp(true);
    }
  };

  const severityColors = { 1:'var(--green)', 2:'var(--green)', 3:'var(--amber)', 4:'var(--coral)', 5:'#c0392b' };
  const severityLabels = { 1:'Very mild', 2:'Mild', 3:'Moderate', 4:'Serious', 5:'Critical' };

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, background:'var(--coral-light)', color:'var(--coral)', fontSize:12, fontWeight:600, marginBottom:12 }}>
            Street animal rescue
          </span>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:32, marginBottom:8 }}>Report an injured animal</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>
            No account needed — just verify your phone number and we'll dispatch help immediately.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:8, marginBottom:32 }}>
          {['Details','Photos','Confirm'].map((label, i) => (
            <div key={label} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:4, borderRadius:4, marginBottom:6,
                background: step > i+1 ? 'var(--green)' : step === i+1 ? 'var(--coral)' : 'var(--border-md)', transition:'background 0.3s' }} />
              <span style={{ fontSize:11, color: step === i+1 ? 'var(--coral)' : 'var(--text-hint)', fontWeight: step === i+1 ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="page-enter">

            <div className="form-group">
              <label className="form-label">Your phone number <span style={{ color:'var(--coral)' }}>*</span></label>
              <input className="form-input" type="tel" placeholder="+91 98765 43210"
                value={form.reporterPhone} onChange={set('reporterPhone')} />
              <span className="form-hint">
                {user ? 'Pre-filled from your account. Responder may call to clarify location.'
                       : 'Used to verify your identity and for the responder to reach you.'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Injury type</label>
              <select className="form-input form-select" value={form.injuryType} onChange={set('injuryType')}>
                {INJURY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Severity temporarily hidden as requested.
            <div className="form-group">
              <label className="form-label">
                Severity — how serious does it look?
                <span style={{ marginLeft:10, fontSize:13, fontWeight:600, color: severityColors[form.humanSeverity] }}>
                  {form.humanSeverity}/5 — {severityLabels[form.humanSeverity]}
                </span>
              </label>
              <input type="range" min="1" max="5" step="1" value={form.humanSeverity} onChange={set('humanSeverity')}
                style={{ width:'100%', accentColor: severityColors[form.humanSeverity] }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-hint)' }}>
                <span>Very mild</span><span>Critical</span>
              </div>
            </div>
            */}

            <div className="form-group">
              <label className="form-label">Landmark / spot description</label>
              <input className="form-input" placeholder="e.g. Near the red gate behind Lal Bagh" value={form.landmark} onChange={set('landmark')} />
              <span className="form-hint">GPS alone isn't enough — give the volunteer something to look for</span>
            </div>

            <div className="form-group">
              <label className="form-label">Additional description</label>
              <textarea className="form-input" rows={3} placeholder="Describe the animal's condition, what you observed..."
                value={form.description} onChange={set('description')} style={{ resize:'vertical' }} />
            </div>

            {/* GPS */}
            <div className="card" style={{ background: coords ? 'var(--green-light)' : 'var(--surface)' }}>
              <p style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>GPS location <span style={{ color:'var(--coral)' }}>*</span></p>
              {coords ? (
                <>
                  <p style={{ fontSize:13, color:'var(--green-mid)', marginBottom:12 }}>
                    Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                  <MapView lat={coords.lat} lng={coords.lng} label="Reported location" height={200} />
                </>
              ) : (
                <>
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>
                    We need your GPS location to dispatch the nearest responder.
                  </p>
                  {gpsError && <p className="form-error" style={{ marginBottom:10 }}>{gpsError}</p>}
                  <button className="btn btn-outline" onClick={getLocation} disabled={gpsLoading}>
                    {gpsLoading ? <><span className="spinner" /> Locating...</> : '📍 Capture my location'}
                  </button>
                </>
              )}
            </div>

            {guide && (
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:10 }}>
                  While you wait — what to do right now:
                </p>
                <FirstAidGuide guide={guide} />
              </div>
            )}

            <button className="btn btn-coral btn-full btn-lg" onClick={() => setStep(2)}
              disabled={!form.reporterPhone}>
              Next — Add photos
            </button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="page-enter">
            <div className="card" style={{ borderStyle:'dashed', cursor:'pointer', textAlign:'center', padding:40 }}
              onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleImages} />
              <p style={{ fontSize:36, marginBottom:12 }}>📷</p>
              <p style={{ fontWeight:500, marginBottom:6 }}>Tap to upload photos</p>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>Up to 5 images. Our AI will analyse them for severity.</p>
            </div>

            {previews.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))', gap:12 }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ borderRadius:'var(--radius-sm)', overflow:'hidden', aspectRatio:'1' }}>
                    <img src={src} alt={`preview ${i}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding:16, background:'var(--amber-light)', borderRadius:'var(--radius-md)', border:'1px solid rgba(239,159,39,0.3)' }}>
              <p style={{ fontSize:13, color:'#854F0B', lineHeight:1.6 }}>
                <strong>Tip:</strong> Clear photos help our AI detect blood and assess posture. If the animal is in immediate danger, skip photos and submit now.
              </p>
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-coral" style={{ flex:2 }} onClick={() => setStep(3)}>
                {images.length > 0 ? `Next — ${images.length} photo${images.length > 1 ? 's' : ''} ready` : 'Skip & confirm'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="page-enter">
            <div className="card">
              <p style={{ fontWeight:600, marginBottom:16 }}>Summary</p>
              {[
                ['Injury type',  INJURY_TYPES.find(t => t.value === form.injuryType)?.label],
                ['Phone',        form.reporterPhone],
                ['Landmark',     form.landmark || '—'],
                ['Photos',       images.length > 0 ? `${images.length} uploaded` : 'None'],
                ['GPS',          coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Not captured'],
              ].map(([label, value]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                  <span style={{ color:'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight:500 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Show what happens next based on auth state */}
            <div style={{ padding:16, background: user ? 'var(--green-light)' : 'var(--coral-light)', borderRadius:'var(--radius-md)' }}>
              <p style={{ fontSize:13, color: user ? 'var(--green-mid)' : 'var(--coral)', fontWeight:500 }}>
                {user
                  ? 'You are logged in. The rescue will be submitted directly.'
                  : 'You will be asked to verify your phone number with a 6-digit OTP before submission. No registration required.'}
              </p>
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-coral btn-lg" style={{ flex:2 }} onClick={handleSubmit}
                disabled={loading || !coords}>
                {loading
                  ? <><span className="spinner" /> Submitting...</>
                  : user
                  ? 'Submit & dispatch rescue'
                  : 'Verify phone & submit'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OTP Modal — shown only for non-logged-in users */}
      {showOtp && (
        <OtpModal
          phone={form.reporterPhone}
          onVerified={(ph) => submitCase(ph)}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  );
}
