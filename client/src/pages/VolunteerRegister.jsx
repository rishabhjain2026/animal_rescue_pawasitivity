import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerVolunteer } from '../api/cases.api';
import { useToast } from '../context/ToastContext';
import useGeolocation from '../hooks/useGeolocation';

const CERTIFICATIONS = ['Animal First Aid','Dog Handling','Wildlife Rescue','Animal Shelter Training','Veterinary Assistant'];

export default function VolunteerRegister() {
  const navigate = useNavigate();
  const toast    = useToast();
  const { coords, loading: gpsLoading, getLocation } = useGeolocation();

  const [loading, setLoading] = useState(false);
  const [docs,    setDocs]    = useState([]);
  const [certs,   setCerts]   = useState([]);

  const [form, setForm] = useState({
    name:'', email:'', phone:'', password:'', city:'', state:'', pincode:'',
    skillLevel:'basic', hasVehicle:'false', operatingRadius:'10',
    emergencyContactName:'', emergencyContactPhone:'',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const toggleCert = (c) => setCerts((p) => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) { toast.error('Please capture your GPS location'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      fd.append('lat', coords.lat);
      fd.append('lng', coords.lng);
      fd.append('certifications', JSON.stringify(certs));
      docs.forEach((d) => fd.append('documents', d));
      await registerVolunteer(fd);
      toast.success('Application submitted! You will be notified once approved.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const skillInfo = {
    basic:   'No prior training. Willing to help with basic tasks like guiding responders or keeping people back.',
    trained: 'Completed animal first aid or handling training.',
    expert:  'Veterinary background, shelter experience, or professional animal handler.',
  };

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:620, margin:'0 auto' }}>

        <Link to="/" style={{ fontSize:13, color:'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:6, marginBottom:24 }}>← Back</Link>

        <span style={{ display:'block', padding:'4px 12px', borderRadius:20, background:'var(--coral-light)', color:'var(--coral)', fontSize:12, fontWeight:600, marginBottom:12, width:'fit-content' }}>
          Join as volunteer
        </span>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:32, marginBottom:8 }}>Become a volunteer</h1>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:32 }}>
          Volunteers are the first to arrive on-scene. You stabilise the animal while the vet is on the way. No prior training required for basic level.
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Personal info */}
          <div className="card">
            <p style={{ fontWeight:600, fontSize:15, marginBottom:16 }}>Personal information</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Full name</label>
                  <input className="form-input" placeholder="Aarav Singh" value={form.name} onChange={set('name')} required /></div>
                <div className="form-group"><label className="form-label">Phone</label>
                  <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required /></div>
              </div>
              <div className="form-group"><label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="aarav@gmail.com" value={form.email} onChange={set('email')} required /></div>
              <div className="form-group"><label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} /></div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">City</label>
                  <input className="form-input" placeholder="Pune" value={form.city} onChange={set('city')} required /></div>
                <div className="form-group"><label className="form-label">Pincode</label>
                  <input className="form-input" placeholder="411001" value={form.pincode} onChange={set('pincode')} /></div>
              </div>
              <div className="form-group"><label className="form-label">State</label>
                <input className="form-input" placeholder="Maharashtra" value={form.state} onChange={set('state')} /></div>
            </div>
          </div>

          {/* Skill & capacity */}
          <div className="card">
            <p style={{ fontWeight:600, fontSize:15, marginBottom:16 }}>Skills & capacity</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Skill level</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
                  {['basic','trained','expert'].map((level) => (
                    <button type="button" key={level} onClick={() => setForm(p => ({ ...p, skillLevel: level }))}
                      style={{
                        display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'12px 16px',
                        borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'left',
                        border:`2px solid ${form.skillLevel === level ? 'var(--green)' : 'var(--border)'}`,
                        background: form.skillLevel === level ? 'var(--green-light)' : 'var(--surface)',
                        transition:'all 0.15s',
                      }}>
                      <span style={{ fontWeight:600, fontSize:14, textTransform:'capitalize', color: form.skillLevel === level ? 'var(--green-mid)' : 'var(--text)', marginBottom:3 }}>{level}</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>{skillInfo[level]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Do you have a vehicle?</label>
                <select className="form-input form-select" value={form.hasVehicle} onChange={set('hasVehicle')}>
                  <option value="false">No vehicle</option>
                  <option value="true">Yes — bike/car available</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Operating radius (km) — how far can you travel?</label>
                <input className="form-input" type="number" placeholder="10" value={form.operatingRadius} onChange={set('operatingRadius')} />
              </div>

              <div className="form-group">
                <label className="form-label">Certifications (if any)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                  {CERTIFICATIONS.map((c) => (
                    <button type="button" key={c} onClick={() => toggleCert(c)} style={{
                      padding:'6px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
                      border:`1.5px solid ${certs.includes(c) ? 'var(--green)' : 'var(--border-md)'}`,
                      background: certs.includes(c) ? 'var(--green)' : 'var(--surface)',
                      color: certs.includes(c) ? '#fff' : 'var(--text)', transition:'all 0.15s',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          <div className="card">
            <p style={{ fontWeight:600, fontSize:15, marginBottom:16 }}>Emergency contact</p>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Contact name</label>
                <input className="form-input" placeholder="Family member name" value={form.emergencyContactName} onChange={set('emergencyContactName')} /></div>
              <div className="form-group"><label className="form-label">Contact phone</label>
                <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} /></div>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <p style={{ fontWeight:500, fontSize:14, marginBottom:10 }}>Your location <span style={{ color:'var(--coral)' }}>*</span></p>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>Used to dispatch you to nearby cases.</p>
            {coords
              ? <p style={{ fontSize:13, color:'var(--green)', fontWeight:500 }}>Location captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
              : <button type="button" className="btn btn-outline" onClick={getLocation} disabled={gpsLoading}>
                  {gpsLoading ? <><span className="spinner" /> Locating...</> : '📍 Capture my location'}
                </button>
            }
          </div>

          {/* Documents */}
          <div className="card" style={{ borderStyle:'dashed', cursor:'pointer' }}
            onClick={() => document.getElementById('vol-docs').click()}>
            <input id="vol-docs" type="file" multiple accept="image/*,.pdf" style={{ display:'none' }}
              onChange={(e) => setDocs(Array.from(e.target.files))} />
            <p style={{ fontWeight:500, marginBottom:4 }}>Supporting documents (optional)</p>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>Training certificates, ID proof</p>
            {docs.length > 0 && <p style={{ fontSize:12, color:'var(--green)', marginTop:8 }}>{docs.length} file(s) selected</p>}
          </div>

          <div style={{ padding:16, background:'var(--amber-light)', borderRadius:'var(--radius-md)', border:'1px solid rgba(239,159,39,0.3)' }}>
            <p style={{ fontSize:13, color:'#854F0B' }}>
              Admin will review and approve your application. You'll receive login access via email once approved.
            </p>
          </div>

          <button className="btn btn-coral btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Submitting...</> : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}