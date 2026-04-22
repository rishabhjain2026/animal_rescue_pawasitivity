import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPetById } from '../api/cases.api';

export default function PetProfile() {
  const { id } = useParams();
  const [pet,     setPet]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPetById(id).then(r => setPet(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><span className="spinner" style={{ width:32, height:32 }} /></div>;
  if (!pet)    return <div style={{ textAlign:'center', padding:80, color:'var(--text-muted)' }}>Pet not found.</div>;

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>

        {/* Identity card */}
        <div className="card" style={{ background:'var(--green)', marginBottom:24 }}>
          <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            {pet.photo
              ? <img src={pet.photo} alt={pet.name} style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,255,255,0.3)' }} />
              : <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>🐕</div>
            }
            <div>
              <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, color:'#fff', marginBottom:4 }}>{pet.name}</h1>
              <p style={{ color:'rgba(255,255,255,0.8)', fontSize:14 }}>{pet.breed || pet.species} · {pet.age ? `${pet.age} years` : 'Age unknown'} · {pet.gender}</p>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:8, fontFamily:'monospace' }}>PIN: {pet.pin}</p>
            </div>
            {pet.qrCodeUrl && (
              <img src={pet.qrCodeUrl} alt="QR" style={{ width:64, height:64, borderRadius:8, marginLeft:'auto', background:'#fff', padding:4 }} />
            )}
          </div>
        </div>

        {/* Quick info */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
          {[
            { label:'Weight', val: pet.weight ? `${pet.weight} kg` : '—' },
            { label:'Blood type', val: pet.bloodType || '—' },
            { label:'Neutered', val: pet.isNeutered ? 'Yes' : 'No' },
            { label:'Owner', val: pet.owner?.name || '—' },
          ].map(i => (
            <div key={i.label} style={{ padding:14, background:'var(--surface)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
              <p style={{ fontSize:11, color:'var(--text-hint)', marginBottom:4 }}>{i.label}</p>
              <p style={{ fontWeight:600, fontSize:14 }}>{i.val}</p>
            </div>
          ))}
        </div>

        {/* Allergies & conditions */}
        {(pet.allergies?.length > 0 || pet.chronicConditions?.length > 0) && (
          <div className="card" style={{ marginBottom:24 }}>
            {pet.allergies?.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--coral)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Allergies</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {pet.allergies.map(a => <span key={a} style={{ padding:'3px 10px', borderRadius:20, fontSize:12, background:'var(--coral-light)', color:'var(--coral)' }}>{a}</span>)}
                </div>
              </div>
            )}
            {pet.chronicConditions?.length > 0 && (
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--amber)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Chronic conditions</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {pet.chronicConditions.map(c => <span key={c} style={{ padding:'3px 10px', borderRadius:20, fontSize:12, background:'var(--amber-light)', color:'#854F0B' }}>{c}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Health passport */}
        <div className="card" style={{ marginBottom:24 }}>
          <p style={{ fontWeight:600, fontSize:16, marginBottom:16 }}>Health passport</p>
          {pet.healthPassport?.length === 0
            ? <p style={{ fontSize:13, color:'var(--text-muted)' }}>No health records yet.</p>
            : pet.healthPassport.map((entry, i) => (
                <div key={i} style={{ padding:'14px 0', borderBottom: i < pet.healthPassport.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <p style={{ fontWeight:600, fontSize:14 }}>{entry.diagnosis || 'Visit'}</p>
                    <p style={{ fontSize:12, color:'var(--text-hint)' }}>{new Date(entry.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  {entry.treatment    && <p style={{ fontSize:13, color:'var(--text-muted)' }}>Treatment: {entry.treatment}</p>}
                  {entry.prescription && <p style={{ fontSize:13, color:'var(--text-muted)' }}>Rx: {entry.prescription}</p>}
                  {entry.notes        && <p style={{ fontSize:13, color:'var(--text-muted)' }}>{entry.notes}</p>}
                  {entry.nextVisit    && <p style={{ fontSize:12, color:'var(--green)', marginTop:4 }}>Next visit: {new Date(entry.nextVisit).toLocaleDateString('en-IN')}</p>}
                </div>
              ))
          }
        </div>

        {/* Vaccinations */}
        {pet.vaccinations?.length > 0 && (
          <div className="card">
            <p style={{ fontWeight:600, fontSize:16, marginBottom:16 }}>Vaccinations</p>
            {pet.vaccinations.map((v,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom: i < pet.vaccinations.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <p style={{ fontWeight:500, fontSize:14 }}>{v.name}</p>
                  <p style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(v.date).toLocaleDateString('en-IN')}</p>
                </div>
                {v.nextDue && <p style={{ fontSize:12, color:'var(--green)', fontWeight:500 }}>Due: {new Date(v.nextDue).toLocaleDateString('en-IN')}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}