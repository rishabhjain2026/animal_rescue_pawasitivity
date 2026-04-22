// ── RegisterPet ───────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerPet } from '../api/cases.api';
import { useToast } from '../context/ToastContext';

export function RegisterPet() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [loading,  setLoading]  = useState(false);
  const [photoFile,setPhotoFile]= useState(null);
  const [preview,  setPreview]  = useState(null);

  const [form, setForm] = useState({
    name:'', species:'dog', breed:'', age:'', gender:'unknown',
    color:'', weight:'', bloodType:'', allergies:'', chronicConditions:'', isNeutered:'false',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   try {
  //     const fd = new FormData();
  //     Object.entries(form).forEach(([k,v]) => fd.append(k, v));
  //     if (photoFile) fd.append('photo', photoFile);

  //     const res = await registerPet(fd);
  //     toast.success(`${form.name} registered! PIN: ${res.data.pin}`);
  //     navigate('/dashboard');
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || 'Registration failed');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photoFile) fd.append('photo', photoFile);

    const res = await registerPet(fd);

    console.log("RESPONSE:", res); // 🔍 DEBUG

    // ✅ Ensure success based on status
    if (res.status === 201 || res.status === 200) {
      toast.success(`${form.name} registered! PIN: ${res.data?.pin || "Generated"}`);
      navigate('/dashboard');
    } else {
      throw new Error("Unexpected response");
    }

  } catch (err) {
    console.error("ERROR:", err); // 🔥 IMPORTANT

    // ❗ Only show error if real failure
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Registration failed";

    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:580, margin:'0 auto' }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:30, marginBottom:8 }}>Register your pet</h1>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:32 }}>
          Your pet gets a permanent PIN and QR health passport after registration.
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Photo */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div onClick={() => document.getElementById('pet-photo').click()}
              style={{ width:100, height:100, borderRadius:'50%', overflow:'hidden', cursor:'pointer',
                background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, border:'2px dashed var(--green)' }}>
              {preview ? <img src={preview} alt="pet" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '🐕'}
            </div>
            <input id="pet-photo" type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Tap to add photo</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Pet name <span style={{ color:'var(--coral)' }}>*</span></label>
              <input className="form-input" placeholder="Bruno" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Species</label>
              <select className="form-input form-select" value={form.species} onChange={set('species')}>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Breed</label>
              <input className="form-input" placeholder="Labrador" value={form.breed} onChange={set('breed')} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input form-select" value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Age (years)</label>
              <input className="form-input" type="number" placeholder="3" value={form.age} onChange={set('age')} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" placeholder="25" value={form.weight} onChange={set('weight')} />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Color / markings</label>
              <input className="form-input" placeholder="Golden with white patch" value={form.color} onChange={set('color')} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood type (if known)</label>
              <input className="form-input" placeholder="DEA 1.1+" value={form.bloodType} onChange={set('bloodType')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Known allergies (comma-separated)</label>
            <input className="form-input" placeholder="chicken, dust mites" value={form.allergies} onChange={set('allergies')} />
          </div>

          <div className="form-group">
            <label className="form-label">Chronic conditions</label>
            <input className="form-input" placeholder="diabetes, hip dysplasia" value={form.chronicConditions} onChange={set('chronicConditions')} />
          </div>

          <div className="form-group">
            <label className="form-label">Neutered / spayed?</label>
            <select className="form-input form-select" value={form.isNeutered} onChange={set('isNeutered')}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          <div style={{ padding:14, background:'var(--green-light)', borderRadius:'var(--radius-md)', border:'1px solid rgba(29,158,117,0.2)' }}>
            <p style={{ fontSize:13, color:'var(--green-mid)' }}>
              After registration, your pet gets a unique <strong>PAW-YYYY-XXXX</strong> PIN and a QR code linked to their full health history.
            </p>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading || !form.name}>
            {loading ? <><span className="spinner" /> Registering...</> : 'Register pet'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPet;

