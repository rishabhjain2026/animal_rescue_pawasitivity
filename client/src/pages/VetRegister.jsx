import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerVet } from '../api/cases.api';
import { useToast } from '../context/ToastContext';
import useGeolocation from '../hooks/useGeolocation';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SPECIALIZATIONS = ['General','Orthopaedic','Dermatology','Ophthalmology','Dentistry','Surgery','Neurology','Cardiology'];

export default function VetRegister() {
  const navigate = useNavigate();
  const toast    = useToast();
  const { coords, loading: gpsLoading, getLocation } = useGeolocation();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [docs,    setDocs]    = useState([]);
  const [specs,   setSpecs]   = useState(['General']);
  const [slots,   setSlots]   = useState([]);

  const [form, setForm] = useState({
    name:'', email:'', phone:'', password:'', city:'', state:'', pincode:'',
    licenseNumber:'', clinicName:'', clinicAddress:'',
    consultationFee:'', homeVisitFee:'', offersHomeVisit:'false', homeVisitRadius:'5',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const toggleSpec = (s) => setSpecs((p) => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const toggleDay = (day) => {
    setSlots((p) => {
      const exists = p.find(s => s.day === day);
      if (exists) return p.filter(s => s.day !== day);
      return [...p, { day, startTime:'09:00', endTime:'17:00' }];
    });
  };

  const updateSlot = (day, field, value) => {
    setSlots((p) => p.map(s => s.day === day ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async () => {
    if (!coords) { toast.error('Please capture clinic GPS location'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      fd.append('lat', coords.lat);
      fd.append('lng', coords.lng);
      fd.append('specializations',  JSON.stringify(specs.map(s => s.toLowerCase())));
      fd.append('availabilitySlots', JSON.stringify(slots));
      docs.forEach((d) => fd.append('documents', d));

      await registerVet(fd);
      toast.success('Application submitted! Admin will review within 24–48 hours.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Account','Clinic details','Availability','Documents'];

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>

        <div style={{ marginBottom:32 }}>
          <Link to="/" style={{ fontSize:13, color:'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:6, marginBottom:20 }}>
            ← Back to home
          </Link>
          <span style={{ display:'block', padding:'4px 12px', borderRadius:20, background:'#E6F1FB', color:'#185FA5', fontSize:12, fontWeight:600, marginBottom:12, width:'fit-content' }}>
            Join as a vet
          </span>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:32, marginBottom:8 }}>Vet registration</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>
            Join the rescue network. Your application will be reviewed by admin before activation.
          </p>
        </div>

        {/* Step tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:32 }}>
          {steps.map((label, i) => (
            <div key={label} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:4, borderRadius:4, marginBottom:6,
                background: step > i+1 ? 'var(--green)' : step === i+1 ? '#185FA5' : 'var(--border-md)', transition:'background 0.3s' }} />
              <span style={{ fontSize:10, color: step === i+1 ? '#185FA5' : 'var(--text-hint)', fontWeight: step === i+1 ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Account ── */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="page-enter">
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Full name</label>
                <input className="form-input" placeholder="Dr. Ananya Mehta" value={form.name} onChange={set('name')} required /></div>
              <div className="form-group"><label className="form-label">Phone</label>
                <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required /></div>
            </div>
            <div className="form-group"><label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="dr.ananya@clinic.com" value={form.email} onChange={set('email')} required /></div>
            <div className="form-group"><label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} /></div>
            <div className="form-group"><label className="form-label">Veterinary license number</label>
              <input className="form-input" placeholder="VCI-2024-XXXXX" value={form.licenseNumber} onChange={set('licenseNumber')} required />
              <span className="form-hint">Issued by Veterinary Council of India. Verified during admin review.</span></div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(2)}
              disabled={!form.name || !form.email || !form.phone || !form.password || !form.licenseNumber}>
              Next
            </button>
          </div>
        )}

        {/* ── Step 2: Clinic details ── */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="page-enter">
            <div className="form-group"><label className="form-label">Clinic name</label>
              <input className="form-input" placeholder="PawCare Veterinary Clinic" value={form.clinicName} onChange={set('clinicName')} required /></div>
            <div className="form-group"><label className="form-label">Clinic address</label>
              <textarea className="form-input" rows={2} placeholder="Full address" value={form.clinicAddress} onChange={set('clinicAddress')} style={{ resize:'vertical' }} /></div>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">City</label>
                <input className="form-input" placeholder="Bengaluru" value={form.city} onChange={set('city')} required /></div>
              <div className="form-group"><label className="form-label">State</label>
                <input className="form-input" placeholder="Karnataka" value={form.state} onChange={set('state')} required /></div>
            </div>
            <div className="form-group"><label className="form-label">Pincode</label>
              <input className="form-input" placeholder="560001" value={form.pincode} onChange={set('pincode')} /></div>

            {/* Specializations */}
            <div className="form-group">
              <label className="form-label">Specializations</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                {SPECIALIZATIONS.map((s) => (
                  <button key={s} onClick={() => toggleSpec(s)} style={{
                    padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer',
                    border:`1.5px solid ${specs.includes(s) ? 'var(--green)' : 'var(--border-md)'}`,
                    background: specs.includes(s) ? 'var(--green)' : 'var(--surface)',
                    color: specs.includes(s) ? '#fff' : 'var(--text)', transition:'all 0.15s',
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Fees */}
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Consultation fee (₹)</label>
                <input className="form-input" type="number" placeholder="500" value={form.consultationFee} onChange={set('consultationFee')} /></div>
              <div className="form-group"><label className="form-label">Home visit fee (₹)</label>
                <input className="form-input" type="number" placeholder="800" value={form.homeVisitFee} onChange={set('homeVisitFee')} /></div>
            </div>

            <div className="form-group">
              <label className="form-label">Home visits</label>
              <select className="form-input form-select" value={form.offersHomeVisit} onChange={set('offersHomeVisit')}>
                <option value="false">No home visits</option>
                <option value="true">Yes, I offer home visits</option>
              </select>
            </div>

            {form.offersHomeVisit === 'true' && (
              <div className="form-group">
                <label className="form-label">Home visit radius (km)</label>
                <input className="form-input" type="number" placeholder="10" value={form.homeVisitRadius} onChange={set('homeVisitRadius')} />
                <span className="form-hint">Only users within this radius will see you as a home visit option</span>
              </div>
            )}

            {/* GPS */}
            <div className="card">
              <p style={{ fontWeight:500, fontSize:14, marginBottom:10 }}>Clinic GPS location <span style={{ color:'var(--coral)' }}>*</span></p>
              {coords
                ? <p style={{ fontSize:13, color:'var(--green)' }}>Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                : <button className="btn btn-outline" onClick={getLocation} disabled={gpsLoading}>
                    {gpsLoading ? <><span className="spinner" /> Locating...</> : '📍 Capture clinic location'}
                  </button>
              }
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={() => setStep(3)} disabled={!form.clinicName || !form.city}>Next</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Availability ── */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="page-enter">
            <p style={{ fontSize:14, color:'var(--text-muted)' }}>Select the days you're available and set your clinic hours for each.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {DAYS.map((day) => {
                const slot = slots.find(s => s.day === day);
                return (
                  <div key={day} style={{ background:'var(--surface)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', background: slot ? 'var(--green-light)' : 'transparent' }}
                      onClick={() => toggleDay(day)}>
                      <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${slot ? 'var(--green)' : 'var(--border-md)'}`, background: slot ? 'var(--green)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {slot && <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5l4 4 6-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                      </div>
                      <span style={{ fontWeight:500, fontSize:14, color: slot ? 'var(--green-mid)' : 'var(--text)' }}>{day}</span>
                    </div>
                    {slot && (
                      <div style={{ display:'flex', gap:12, padding:'12px 16px', borderTop:'1px solid rgba(29,158,117,0.15)', alignItems:'center' }}>
                        <div className="form-group" style={{ flex:1, gap:4 }}>
                          <label className="form-label">From</label>
                          <input className="form-input" type="time" value={slot.startTime} onChange={(e) => updateSlot(day,'startTime',e.target.value)} style={{ padding:'6px 10px' }} />
                        </div>
                        <div className="form-group" style={{ flex:1, gap:4 }}>
                          <label className="form-label">To</label>
                          <input className="form-input" type="time" value={slot.endTime} onChange={(e) => updateSlot(day,'endTime',e.target.value)} style={{ padding:'6px 10px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={() => setStep(4)}>Next — Documents</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Documents ── */}
        {step === 4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="page-enter">
            <div className="card" style={{ borderStyle:'dashed', textAlign:'center', padding:36, cursor:'pointer' }}
              onClick={() => document.getElementById('doc-upload').click()}>
              <input id="doc-upload" type="file" multiple accept="image/*,.pdf" style={{ display:'none' }}
                onChange={(e) => setDocs(Array.from(e.target.files))} />
              <p style={{ fontSize:32, marginBottom:10 }}>📄</p>
              <p style={{ fontWeight:500, marginBottom:6 }}>Upload supporting documents</p>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>Degree certificate, VCI license scan, clinic photos (up to 5 files)</p>
            </div>

            {docs.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {docs.map((d,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:'var(--radius-sm)', background:'var(--green-light)', border:'1px solid rgba(29,158,117,0.2)' }}>
                    <span>📄</span>
                    <span style={{ fontSize:13, color:'var(--green-mid)', flex:1 }}>{d.name}</span>
                    <span style={{ fontSize:11, color:'var(--text-hint)' }}>{(d.size/1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding:16, background:'var(--amber-light)', borderRadius:'var(--radius-md)', border:'1px solid rgba(239,159,39,0.3)' }}>
              <p style={{ fontSize:13, color:'#854F0B', lineHeight:1.6 }}>
                <strong>Admin review:</strong> Your application will be reviewed within 24–48 hours. You'll receive an email once approved. You cannot log in until approved.
              </p>
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(3)}>Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex:2, background:'#185FA5', borderColor:'#185FA5' }}
                onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" /> Submitting...</> : 'Submit application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}