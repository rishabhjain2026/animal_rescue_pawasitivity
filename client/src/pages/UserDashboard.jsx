
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyStreetCases, getMyDomestic, getMyPets, getMyAppointments, deletePet } from '../api/cases.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [street,   setStreet]   = useState([]);
  const [domestic, setDomestic] = useState([]);
  const [pets,     setPets]     = useState([]);
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Confirm-delete state: null | petId
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const fetchAll = () => {
    Promise.all([getMyStreetCases(), getMyDomestic(), getMyPets(), getMyAppointments()])
      .then(([s,d,p,a]) => { setStreet(s.data); setDomestic(d.data); setPets(p.data); setAppts(a.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (petId) => {
    setDeleting(true);
    try {
      const pet = pets.find(p => p._id === petId);
      await deletePet(petId);
      toast.success(`${pet?.name || 'Pet'} removed from your account`);
      setConfirmDelete(null);
      setPets(prev => prev.filter(p => p._id !== petId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete pet');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <span className="spinner" style={{ width:32, height:32 }} />
    </div>
  );

  const petToDelete = pets.find(p => p._id === confirmDelete);

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, marginBottom:8 }}>My dashboard</h1>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:32 }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </p>

        {/* Quick actions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:40 }}>
          {[
            { icon:'🐕', label:'Report street animal', action:() => navigate('/report/street'), color:'var(--coral)', bg:'var(--coral-light)' },
            { icon:'🏠', label:'Book vet appointment',  action:() => navigate('/report/domestic'), color:'var(--green)', bg:'var(--green-light)' },
            { icon:'🐾', label:'Register new pet',      action:() => navigate('/my-pets/register'), color:'#185FA5', bg:'#E6F1FB' },
          ].map(a => (
            <button key={a.label} onClick={a.action} style={{
              display:'flex', flexDirection:'column', alignItems:'flex-start', gap:10,
              padding:'20px', borderRadius:'var(--radius-md)', border:'none', cursor:'pointer',
              background:a.bg, textAlign:'left', transition:'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <span style={{ fontSize:28 }}>{a.icon}</span>
              <span style={{ fontWeight:600, fontSize:14, color:a.color }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* ── My pets ── */}
        <Section title="My pets" count={pets.length} action={() => navigate('/my-pets/register')} actionLabel="+ Add pet">
          {pets.length === 0
            ? <EmptyCard icon="🐾" text="No pets registered yet" />
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {pets.map(p => (
                  <div key={p._id} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>

                    {/* Avatar — clickable to profile */}
                    <div onClick={() => navigate(`/pet/${p._id}`)} style={{ cursor:'pointer', flexShrink:0 }}>
                      {p.photo
                        ? <img src={p.photo} alt={p.name} style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover' }} />
                        : <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🐕</div>
                      }
                    </div>

                    {/* Info — clickable to profile */}
                    <div style={{ flex:1, cursor:'pointer' }} onClick={() => navigate(`/pet/${p._id}`)}>
                      <p style={{ fontWeight:600, fontSize:15 }}>{p.name}</p>
                      <p style={{ fontSize:13, color:'var(--text-muted)' }}>{p.breed || p.species}</p>
                    </div>

                    {/* PIN badge */}
                    <div style={{ textAlign:'right', marginRight:8 }}>
                      <p style={{ fontSize:12, fontWeight:600, color:'var(--green)', fontFamily:'var(--font-mono, monospace)' }}>{p.pin}</p>
                      <p style={{ fontSize:11, color:'var(--text-hint)' }}>Health PIN</p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(p._id); }}
                      title="Remove pet"
                      style={{
                        width:32, height:32, borderRadius:'50%', flexShrink:0,
                        border:'1px solid var(--border-md)',
                        background:'var(--surface)', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'var(--text-muted)', transition:'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FCEBEB'; e.currentTarget.style.borderColor = 'var(--coral)'; e.currentTarget.style.color = 'var(--coral)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border-md)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M3.5 3.5l.75 8h5.5l.75-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                  </div>
                ))}
              </div>
            )
          }
        </Section>

        {/* ── Upcoming appointments ── */}
        <Section title="Upcoming appointments" count={appts.filter(a => a.status === 'confirmed').length}>
          {appts.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length === 0
            ? <EmptyCard icon="📅" text="No upcoming appointments" />
            : appts.filter(a => a.status !== 'completed' && a.status !== 'cancelled').map(a => (
                <div key={a._id} className="card" style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {a.type === 'home-visit' ? '🏠' : '🏥'}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600 }}>{a.pet?.name} · Dr. {a.vet?.user?.name}</p>
                    <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                      {new Date(a.date).toLocaleDateString('en-IN')} at {a.timeSlot}
                    </p>
                    <p style={{ fontSize:12, color:'var(--text-hint)' }}>
                      {a.vet?.clinicName} · ₹{a.consultationFee}
                    </p>
                  </div>
                  <span className={`status-pill status-${a.status}`}>{a.status}</span>
                </div>
              ))
          }
        </Section>

        {/* ── Street cases ── */}
        <Section title="Street cases I reported" count={street.length}>
          {street.length === 0
            ? <EmptyCard icon="🐕" text="No street cases reported yet" />
            : street.map(c => (
                <div key={c._id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <p style={{ fontWeight:500, textTransform:'capitalize' }}>
                      {c.injuryType?.replace(/-/g,' ')} · Severity {c.severityScore}/5
                    </p>
                    <p style={{ fontSize:12, color:'var(--text-hint)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span className={`status-pill status-${c.status === 'rescue-in-progress' ? 'in-progress' : c.status}`}>
                      {c.status?.replace(/-/g,' ')}
                    </span>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/track/${c._id}`)}>Track</button>
                  </div>
                </div>
              ))
          }
        </Section>
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <>
          <div
            onClick={() => !deleting && setConfirmDelete(null)}
            style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)' }}
          />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            zIndex:301, background:'var(--surface)', borderRadius:'var(--radius-lg)',
            padding:'32px 28px', width:'100%', maxWidth:380,
            boxShadow:'var(--shadow-lg)',
            animation:'fadeIn 0.2s ease',
          }}>
            {/* Warning icon */}
            <div style={{ width:52, height:52, borderRadius:'50%', background:'#FCEBEB', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#E24B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:20, textAlign:'center', marginBottom:10 }}>
              Remove {petToDelete?.name}?
            </h3>
            <p style={{ fontSize:14, color:'var(--text-muted)', textAlign:'center', lineHeight:1.6, marginBottom:24 }}>
              This will permanently delete <strong>{petToDelete?.name}'s</strong> profile, health passport, and QR code. This cannot be undone.
            </p>

            <div style={{ display:'flex', gap:12 }}>
              <button
                className="btn btn-outline"
                style={{ flex:1 }}
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={{
                  flex:1, padding:'10px', borderRadius:'var(--radius-sm)',
                  border:'none', background:'var(--coral)', color:'#fff',
                  fontWeight:600, fontSize:14, cursor: deleting ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  opacity: deleting ? 0.7 : 1,
                }}
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
              >
                {deleting ? <><span className="spinner" style={{ borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.3)' }} /> Removing...</> : 'Yes, remove'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

const Section = ({ title, count, children, action, actionLabel }) => (
  <div style={{ marginBottom:36 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      <h2 style={{ fontSize:17, fontWeight:600 }}>
        {title}{' '}
        {count > 0 && <span style={{ fontSize:13, color:'var(--text-hint)', fontWeight:400 }}>({count})</span>}
      </h2>
      {action && <button className="btn btn-ghost btn-sm" onClick={action}>{actionLabel}</button>}
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{children}</div>
  </div>
);

const EmptyCard = ({ icon, text }) => (
  <div style={{ textAlign:'center', padding:'32px 24px', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px dashed var(--border-md)', color:'var(--text-muted)' }}>
    <p style={{ fontSize:28, marginBottom:8 }}>{icon}</p>
    <p style={{ fontSize:13 }}>{text}</p>
  </div>
);

export default UserDashboard;
