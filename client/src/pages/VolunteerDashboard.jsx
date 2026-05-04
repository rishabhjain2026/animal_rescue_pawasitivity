// ── VolunteerDashboard ────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getVolunteerDashboard, volunteerRespondCase, updateVolunteerStatus, updateCaseStatus } from '../api/cases.api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function VolunteerDashboard() {
  const { user } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [responding, setResponding] = useState({});
  const [completing, setCompleting] = useState({});
  const [activeTab,  setActiveTab]  = useState('pending');

  const fetch = () => {
    getVolunteerDashboard()
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const respond = async (caseId, response) => {
    setResponding((p) => ({ ...p, [caseId]: true }));
    try {
      await volunteerRespondCase(caseId, { response });
      toast.success(response === 'accepted' ? 'Case accepted!' : 'Declined.');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setResponding((p) => ({ ...p, [caseId]: false }));
    }
  };

  const toggleAvailability = async () => {
    const next = data?.volunteer?.availabilityStatus === 'available' ? 'offline' : 'available';
    try {
      await updateVolunteerStatus(next);
      toast.success(`Status set to ${next}`);
      fetch();
    } catch { toast.error('Failed to update status'); }
  };

  const markCompleted = async (caseId) => {
    setCompleting((p) => ({ ...p, [caseId]: true }));
    try {
      await updateCaseStatus(caseId, {
        status: 'completed',
        note: 'Marked completed by volunteer from dashboard',
      });
      toast.success('Rescue marked as completed');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark completed');
    } finally {
      setCompleting((p) => ({ ...p, [caseId]: false }));
    }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><span className="spinner" style={{ width:32, height:32 }} /></div>;

  const vol = data?.volunteer;
  const isAvailable = vol?.availabilityStatus === 'available';

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ fontSize:12, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Volunteer dashboard</p>
            <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28 }}>Welcome, {user?.name?.split(' ')[0]}</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:13, fontWeight:500, color: isAvailable ? 'var(--green)' : 'var(--text-muted)' }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: isAvailable ? 'var(--green)' : 'var(--border-md)', marginRight:6 }} />
              {vol?.availabilityStatus}
            </div>
            <button className={`btn btn-sm ${isAvailable ? 'btn-outline' : 'btn-primary'}`} onClick={toggleAvailability}>
              {isAvailable ? 'Go offline' : 'Go online'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
          {[
            { label:'Total rescues', val: vol?.totalRescues || 0 },
            { label:'Skill level', val: vol?.skillLevel },
            { label:'Operating radius', val: `${vol?.operatingRadius || 0} km` },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center', padding:'16px', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--green)', textTransform:'capitalize' }}>{s.val}</p>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, borderBottom:'2px solid var(--border)', marginBottom:24 }}>
          {[
            { key:'pending', label:'Pending dispatch', count: data?.pending?.length || 0 },
            { key:'active', label:'Active cases', count: data?.active?.length || 0 },
            { key:'completed', label:'Completed', count: data?.completed?.length || 0 },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding:'10px 16px', fontSize:14, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--green)' : 'var(--text-muted)',
              background:'transparent', border:'none', cursor:'pointer',
              borderBottom: activeTab === tab.key ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom:-2,
            }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  marginLeft: 8,
                  padding:'1px 8px',
                  borderRadius:20,
                  fontSize:11,
                  fontWeight:600,
                  background: tab.key === 'pending' ? 'var(--coral-light)' : 'var(--green-light)',
                  color: tab.key === 'pending' ? 'var(--coral)' : 'var(--green-mid)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'pending' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {data?.pending?.length === 0
              ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><p style={{ fontSize:36, marginBottom:12 }}>📡</p><p>No pending dispatch requests</p></div>
              : data.pending.map((c) => (
                <div key={c._id} className="card" style={{ border:'1.5px solid var(--coral)', position:'relative' }}>
                  <div style={{ position:'absolute', top:12, right:12 }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'var(--coral-light)', color:'var(--coral)' }}>
                      Awaiting response
                    </span>
                  </div>
                  <p style={{ fontWeight:600, fontSize:15, marginBottom:6, textTransform:'capitalize' }}>{c.injuryType?.replace(/-/g,' ')}</p>
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>{c.landmark || 'See GPS'} · Reporter: {c.reporterPhone}</p>
                  {c.description && <p style={{ fontSize:13, marginBottom:14, lineHeight:1.6 }}>{c.description}</p>}
                  <div style={{ display:'flex', gap:12 }}>
                    <button className="btn btn-primary" style={{ flex:2 }} onClick={() => respond(c._id, 'accepted')} disabled={responding[c._id]}>
                      {responding[c._id] ? <span className="spinner" /> : 'Accept rescue'}
                    </button>
                    <button className="btn btn-outline" style={{ flex:1, color:'var(--coral)', borderColor:'var(--coral)' }}
                      onClick={() => respond(c._id, 'rejected')} disabled={responding[c._id]}>
                      Decline
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'active' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {data?.active?.length === 0
              ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><p style={{ fontSize:36, marginBottom:12 }}>🐾</p><p>No active cases. Go online to receive dispatch requests.</p></div>
              : data.active.map(c => (
                <div key={c._id} className="card">
                  <div style={{ display:'flex', gap:12, justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', marginBottom:16 }}>
                    <div>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--coral)' }}>ACTIVE RESCUE</span>
                      <p style={{ fontWeight:600, fontSize:15, marginTop:4, textTransform:'capitalize' }}>{c.injuryType?.replace(/-/g,' ')}</p>
                      <p style={{ fontSize:13, color:'var(--text-muted)' }}>Severity {c.severityScore}/5 · {c.landmark || 'See GPS'}</p>
                    </div>
                    <span className={`status-pill status-${c.status?.split('-').join('-')}`}>{c.status?.replace(/-/g,' ')}</span>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/track/${c._id}`)}>Live tracker</button>
                    {c.reporterPhone && <a href={`tel:${c.reporterPhone}`} className="btn btn-outline btn-sm">Call reporter</a>}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => markCompleted(c._id)}
                      disabled={completing[c._id]}
                    >
                      {completing[c._id] ? <span className="spinner" /> : 'Mark completed'}
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'completed' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {data?.completed?.length === 0
              ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><p style={{ fontSize:36, marginBottom:12 }}>✅</p><p>No completed rescues yet.</p></div>
              : data.completed.map(c => (
                <div key={c._id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <p style={{ fontWeight:500, textTransform:'capitalize' }}>{c.injuryType?.replace(/-/g,' ')}</p>
                    <p style={{ fontSize:12, color:'var(--text-hint)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  {c.reportPdfUrl && <a href={c.reportPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Report</a>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerDashboard;