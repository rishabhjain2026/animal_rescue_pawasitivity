import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getStreetCase } from '../api/cases.api';
import StatusBar from '../components/StatusBar';
import MapView from '../components/MapView';
import FirstAidGuide from '../components/FirstAidGuide';
import useSocket from '../hooks/useSocket';

const SEVERITY_LABEL = { 1:'Very mild', 2:'Mild', 3:'Moderate', 4:'Serious', 5:'Critical' };
const SEVERITY_COLOR = { 1:'var(--green)', 2:'var(--green)', 3:'var(--amber)', 4:'var(--coral)', 5:'#c0392b' };

export default function CaseTracker() {
  const { caseId }    = useParams();
  const routeState    = useLocation().state || {};
  const { caseUpdate } = useSocket(caseId);

  const [caseData, setCaseData] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const fetchCase = () => {
    getStreetCase(caseId)
      .then((r) => setCaseData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCase(); }, [caseId]);

  // Refresh case data whenever socket pushes an update
  useEffect(() => {
    if (caseUpdate) fetchCase();
  }, [caseUpdate]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <span className="spinner" style={{ width:32, height:32, borderWidth:3 }} />
        <p style={{ marginTop:16, color:'var(--text-muted)' }}>Loading rescue status...</p>
      </div>
    </div>
  );

  if (!caseData) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <p style={{ color:'var(--text-muted)' }}>Case not found.</p>
    </div>
  );

  const [lng, lat] = caseData.location?.coordinates || [0, 0];
  const severity   = caseData.severityScore;
  const guide      = routeState.firstAidGuide;

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
              Live rescue tracker
            </p>
            <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, marginBottom:8 }}>Rescue in progress</h1>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>Case ID: {caseId}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ display:'inline-block', padding:'6px 14px', borderRadius:20,
              background: caseData.status === 'completed' ? 'var(--green-light)' : caseData.status === 'cancelled' ? '#FCEBEB' : '#FAEEDA',
              marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600,
                color: caseData.status === 'completed' ? 'var(--green-mid)' : caseData.status === 'cancelled' ? 'var(--coral)' : '#854F0B' }}>
                {caseData.status?.replace(/-/g,' ').toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize:12, color:'var(--text-hint)' }}>
              Last updated: {new Date(caseData.updatedAt).toLocaleTimeString('en-IN')}
            </p>
          </div>
        </div>

        {/* Severity bar */}
        <div className="card" style={{ marginBottom:24, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Severity score</p>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:36, color: SEVERITY_COLOR[severity], lineHeight:1 }}>{severity}<span style={{ fontSize:18, color:'var(--text-hint)' }}>/5</span></p>
            <p style={{ fontSize:13, color: SEVERITY_COLOR[severity], fontWeight:500 }}>{SEVERITY_LABEL[severity]}</p>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ height:8, borderRadius:8, background:'var(--border)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(severity/5)*100}%`, background: SEVERITY_COLOR[severity], borderRadius:8, transition:'width 0.6s ease' }} />
            </div>
          </div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>
            <p>AI: {caseData.images?.[0]?.aiSeverity ?? '—'}/5</p>
            <p>Reporter: {caseData.humanSeverity ?? '—'}/5</p>
          </div>
        </div>

        {/* Live status bar */}
        <div className="card" style={{ marginBottom:24 }}>
          <p style={{ fontWeight:600, marginBottom:16 }}>Rescue progress</p>
          <StatusBar status={caseData.status} timeline={caseData.statusTimeline} />
        </div>

        {/* Assigned responders */}
        {(caseData.assignedVolunteer || caseData.assignedVet) && (
          <div className="card" style={{ marginBottom:24 }}>
            <p style={{ fontWeight:600, marginBottom:16 }}>Assigned responders</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {caseData.assignedVolunteer && (
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:'var(--radius-sm)', background:'var(--green-light)' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🚶</div>
                  <div>
                    <p style={{ fontWeight:600, fontSize:14 }}>{caseData.assignedVolunteer.user?.name || 'Volunteer'}</p>
                    <p style={{ fontSize:12, color:'var(--text-muted)' }}>Volunteer — en route to location</p>
                    {caseData.assignedVolunteer.user?.phone && (
                      <a href={`tel:${caseData.assignedVolunteer.user.phone}`} style={{ fontSize:12, color:'var(--green)', fontWeight:500 }}>
                        {caseData.assignedVolunteer.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
              {caseData.assignedVet && (
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:'var(--radius-sm)', background:'#E6F1FB' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'#185FA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🩺</div>
                  <div>
                    <p style={{ fontWeight:600, fontSize:14 }}>{caseData.assignedVet.user?.name || 'Vet'}</p>
                    <p style={{ fontSize:12, color:'var(--text-muted)' }}>{caseData.assignedVet.clinicName}</p>
                    {caseData.assignedVet.user?.phone && (
                      <a href={`tel:${caseData.assignedVet.user.phone}`} style={{ fontSize:12, color:'#185FA5', fontWeight:500 }}>
                        {caseData.assignedVet.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        {lat !== 0 && lng !== 0 && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontWeight:600, marginBottom:12 }}>Animal location</p>
            <MapView lat={lat} lng={lng} label={caseData.landmark || 'Reported location'} height={300} />
            {caseData.landmark && (
              <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:8 }}>
                Landmark: {caseData.landmark}
              </p>
            )}
          </div>
        )}

        {/* Case images */}
        {caseData.images?.length > 0 && (
          <div className="card" style={{ marginBottom:24 }}>
            <p style={{ fontWeight:600, marginBottom:14 }}>Uploaded photos</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10 }}>
              {caseData.images.map((img, i) => (
                <div key={i} style={{ position:'relative', borderRadius:'var(--radius-sm)', overflow:'hidden', aspectRatio:'1' }}>
                  <img src={img.url} alt={`case ${i}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  {img.bloodDetected && (
                    <div style={{ position:'absolute', top:6, left:6, padding:'2px 8px', borderRadius:12, background:'rgba(216,90,48,0.9)', color:'#fff', fontSize:10, fontWeight:600 }}>
                      Blood detected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* First aid guide */}
        {guide && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontWeight:600, marginBottom:12 }}>First aid guidance</p>
            <FirstAidGuide guide={guide} />
          </div>
        )}

        {/* Report download */}
        {caseData.reportPdfUrl && (
          <div className="card" style={{ background:'var(--green-light)', border:'1px solid rgba(29,158,117,0.2)', textAlign:'center' }}>
            <p style={{ fontSize:24, marginBottom:10 }}>📄</p>
            <p style={{ fontWeight:600, marginBottom:6 }}>Rescue report ready</p>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>Full timeline, responders, and outcome — all documented.</p>
            <a href={caseData.reportPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Download rescue report
            </a>
          </div>
        )}

      </div>
    </div>
  );
}