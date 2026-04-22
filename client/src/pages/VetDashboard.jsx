import { useEffect, useState } from 'react';
import { getVetDashboard, vetRespondCase, getVetAppointments } from '../api/cases.api';
import { updateVolunteerStatus } from '../api/cases.api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VetDashboard() {
  const { user }  = useAuth();
  const toast     = useToast();
  const navigate  = useNavigate();

  const [data,         setData]         = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [responding,   setResponding]   = useState({});
  const [activeTab,    setActiveTab]    = useState('pending');

  const fetchAll = () => {
    Promise.all([getVetDashboard(), getVetAppointments()])
      .then(([d, a]) => { setData(d.data); setAppointments(a.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const respond = async (caseId, response) => {
    setResponding((p) => ({ ...p, [caseId]: true }));
    try {
      await vetRespondCase(caseId, { response });
      toast.success(response === 'accepted' ? 'Case accepted — you are now assigned.' : 'Case declined.');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setResponding((p) => ({ ...p, [caseId]: false }));
    }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><span className="spinner" style={{ width:32, height:32 }} /></div>;

  const tabs = [
    { key:'pending',      label:'Pending dispatch', count: data?.pending?.length },
    { key:'active',       label:'Active cases',     count: data?.active?.length },
    { key:'appointments', label:'Appointments',     count: appointments?.length },
    { key:'completed',    label:'Completed',        count: data?.completed?.length },
  ];

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ fontSize:12, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Vet dashboard</p>
            <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28 }}>Welcome, {user?.name?.split(' ')[0]}</h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {[
              { val:'total', label:'Total cases', num: data?.vet?.totalCases || 0 },
              { val:'rating', label:'Rating', num: `${data?.vet?.rating || 0}/5` },
            ].map(s => (
              <div key={s.val} style={{ textAlign:'center', padding:'12px 20px', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                <p style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--green)' }}>{s.num}</p>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'2px solid var(--border)', paddingBottom:0 }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding:'10px 16px', fontSize:14, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--green)' : 'var(--text-muted)',
              background:'transparent', border:'none', cursor:'pointer',
              borderBottom: activeTab === tab.key ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom:-2, transition:'all 0.15s', display:'flex', alignItems:'center', gap:8,
            }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{ padding:'1px 8px', borderRadius:20, fontSize:11, fontWeight:600,
                  background: tab.key === 'pending' ? 'var(--coral-light)' : 'var(--green-light)',
                  color:      tab.key === 'pending' ? 'var(--coral)' : 'var(--green-mid)',
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Pending dispatches ── */}
        {activeTab === 'pending' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {data?.pending?.length === 0
              ? <EmptyState icon="📡" text="No pending dispatch requests" />
              : data.pending.map((c) => (
                <div key={c._id} className="card" style={{ border:'1.5px solid var(--coral)', position:'relative' }}>
                  <div style={{ position:'absolute', top:12, right:12 }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'var(--coral-light)', color:'var(--coral)' }}>
                      Awaiting response
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
                    <InfoPill label="Severity" value={`${c.severityScore}/5`} color={c.severityScore >= 4 ? 'var(--coral)' : c.severityScore >= 3 ? 'var(--amber)' : 'var(--green)'} />
                    <InfoPill label="Injury"   value={c.injuryType?.replace(/-/g,' ')} />
                    <InfoPill label="Reporter" value={c.reporterPhone} />
                  </div>
                  {c.landmark && <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>Landmark: {c.landmark}</p>}
                  {c.description && <p style={{ fontSize:13, marginBottom:16, lineHeight:1.6 }}>{c.description}</p>}
                  {c.images?.[0] && (
                    <img src={c.images[0].url} alt="case" style={{ width:'100%', maxHeight:160, objectFit:'cover', borderRadius:'var(--radius-sm)', marginBottom:16 }} />
                  )}
                  <div style={{ display:'flex', gap:12 }}>
                    <button className="btn btn-primary" style={{ flex:2 }} onClick={() => respond(c._id, 'accepted')} disabled={responding[c._id]}>
                      {responding[c._id] ? <span className="spinner" /> : 'Accept rescue'}
                    </button>
                    <button className="btn btn-outline" style={{ flex:1, color:'var(--coral)', borderColor:'var(--coral)' }}
                      onClick={() => respond(c._id, 'rejected')} disabled={responding[c._id]}>
                      Decline
                    </button>
                  </div>
                  <p style={{ fontSize:11, color:'var(--text-hint)', marginTop:10, textAlign:'center' }}>
                    Auto-escalates to next vet if no response in 5 minutes
                  </p>
                </div>
              ))
            }
          </div>
        )}

        {/* ── Active cases ── */}
        {activeTab === 'active' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {data?.active?.length === 0
              ? <EmptyState icon="🐾" text="No active cases right now" />
              : data.active.map((c) => (
                <div key={c._id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <p style={{ fontWeight:600, fontSize:15, marginBottom:4, textTransform:'capitalize' }}>{c.status?.replace(/-/g,' ')}</p>
                    <p style={{ fontSize:13, color:'var(--text-muted)' }}>{c.injuryType?.replace(/-/g,' ')} · Severity {c.severityScore}/5</p>
                    <p style={{ fontSize:12, color:'var(--text-hint)', marginTop:4 }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/track/${c._id}`)}>
                    View tracker
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {/* ── Appointments ── */}
        {activeTab === 'appointments' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {appointments.length === 0
              ? <EmptyState icon="📅" text="No appointments scheduled" />
              : appointments.map((a) => (
                <div key={a._id} className="card" style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                  <div style={{ width:48, height:48, borderRadius:'var(--radius-sm)', background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {a.type === 'home-visit' ? '🏠' : '🏥'}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>{a.pet?.name} · {a.owner?.name}</p>
                    <p style={{ fontSize:13, color:'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('en-IN')} at {a.timeSlot} · {a.type}</p>
                    <p style={{ fontSize:12, color:'var(--text-hint)', marginTop:4 }}>₹{a.consultationFee}</p>
                  </div>
                  <span className={`status-pill status-${a.status}`}>{a.status}</span>
                </div>
              ))
            }
          </div>
        )}

        {/* ── Completed ── */}
        {activeTab === 'completed' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {data?.completed?.length === 0
              ? <EmptyState icon="✅" text="No completed cases yet" />
              : data.completed.map((c) => (
                <div key={c._id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <p style={{ fontWeight:500, fontSize:14, marginBottom:4, textTransform:'capitalize' }}>{c.injuryType?.replace(/-/g,' ')}</p>
                    <p style={{ fontSize:12, color:'var(--text-hint)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {c.reportPdfUrl && (
                      <a href={c.reportPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                        Report PDF
                      </a>
                    )}
                    <span className="severity severity-1">Completed</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

const InfoPill = ({ label, value, color }) => (
  <div style={{ fontSize:13 }}>
    <span style={{ color:'var(--text-hint)', marginRight:4 }}>{label}:</span>
    <span style={{ fontWeight:600, color: color || 'var(--text)', textTransform:'capitalize' }}>{value}</span>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--text-muted)' }}>
    <p style={{ fontSize:40, marginBottom:12 }}>{icon}</p>
    <p style={{ fontSize:14 }}>{text}</p>
  </div>
);