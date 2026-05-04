

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAdmin }  from '../context/AdminContext';
import { useToast }  from '../context/ToastContext';
import {
  getAdminStats, getMapPins, getMonthlySummary,
  getPendingVets, getApprovedVets, approveVet, denyVet, revokeVet,
  getPendingVols, getApprovedVols, approveVolunteer, denyVolunteer, revokeVolunteer,
  getStreetCases,
} from '../api/admin.api';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// const mkSvgIcon = (color, emoji) => new L.Icon({
//   iconUrl: 'data:image/svg+xml;base64,' + btoa(
//     `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
//       <path d="M15 0C6.716 0 0 6.716 0 15c0 10 15 23 15 23S30 25 30 15C30 6.716 23.284 0 15 0z" fill="${color}"/>
//       <circle cx="15" cy="15" r="9" fill="white"/>
//       <text x="15" y="19.5" text-anchor="middle" font-size="12">${emoji}</text>
//     </svg>`
//   ),
//   iconSize:[30,38], iconAnchor:[15,38], popupAnchor:[0,-38],
// });

const mkSvgIcon = (color, emoji) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10 15 23 15 23S30 25 30 15C30 6.716 23.284 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="9" fill="white"/>
      <text x="15" y="19.5" text-anchor="middle" font-size="12">${emoji}</text>
    </svg>
  `;

  return new L.Icon({
    iconUrl:
      'data:image/svg+xml;base64,' +
      window.btoa(unescape(encodeURIComponent(svg))),
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38],
  });
};

const vetIcon       = mkSvgIcon('#1D9E75','🩺');
const volunteerIcon = mkSvgIcon('#EF9F27','🤝');

// ── Shared UI atoms ───────────────────────────────────────────────────────────
const Stat = ({ val, label, icon, color='var(--green)', alert }) => (
  <div style={{ background:'var(--surface)', borderRadius:12, padding:'16px 18px', border:`1px solid ${alert?'var(--coral)':'var(--border)'}`, position:'relative', overflow:'hidden' }}>
    {alert && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'var(--coral)' }} />}
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{ fontFamily:'var(--font-serif)', fontSize:28, color, lineHeight:1, marginBottom:5 }}>{val ?? 0}</p>
        <p style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500 }}>{label}</p>
      </div>
      <span style={{ fontSize:22, opacity:0.6 }}>{icon}</span>
    </div>
  </div>
);

const Pill = ({ status }) => {
  const map = { completed:{bg:'#EAF3DE',c:'#3B6D11'}, cancelled:{bg:'#FCEBEB',c:'#A32D2D'}, reported:{bg:'#E6F1FB',c:'#185FA5'}, dispatched:{bg:'#FAEEDA',c:'#854F0B'}, 'rescue-in-progress':{bg:'#FAEEDA',c:'#854F0B'}, rescued:{bg:'#EAF3DE',c:'#3B6D11'}, confirmed:{bg:'#E1F5EE',c:'#0F6E56'}, pending:{bg:'#F1EFE8',c:'#5F5E5A'} };
  const s = map[status] || {bg:'#F1EFE8',c:'#5F5E5A'};
  return <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:s.bg, color:s.c, whiteSpace:'nowrap' }}>{status?.replace(/-/g,' ')}</span>;
};

const Empty = ({ icon, text }) => (
  <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text-muted)' }}>
    <p style={{ fontSize:32, marginBottom:10 }}>{icon}</p>
    <p style={{ fontSize:13 }}>{text}</p>
  </div>
);

const Loader = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
    <span className="spinner" style={{ width:32, height:32, borderWidth:3 }} />
  </div>
);

// ── Approval card (vet + volunteer) ──────────────────────────────────────────
function ApprovalCard({ person, type, onApprove, onDeny, onRevoke, approved=false }) {
  const [expanded,    setExpanded]    = useState(false);
  const [acting,      setActing]      = useState(false);
  const [denyReason,  setDenyReason]  = useState('');
  const [showDenyBox, setShowDenyBox] = useState(false);
  const act = async fn => { setActing(true); try { await fn(); } finally { setActing(false); } };
  const isVet = type === 'vet';
  const accent = isVet ? '#185FA5' : '#EF9F27';
  const accentBg = isVet ? '#E6F1FB' : '#FAEEDA';

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', flexWrap:'wrap' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:accentBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
          {isVet ? '🩺' : '🤝'}
        </div>
        <div style={{ flex:1, minWidth:140 }}>
          <p style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{person.user?.name}</p>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>
            {isVet ? `${person.clinicName} · ${person.city}` : `${person.city}, ${person.state}`}
          </p>
          <p style={{ fontSize:11, color:'var(--text-hint)', marginTop:1 }}>
            {isVet ? `License: ${person.licenseNumber}` : `Skill: ${person.skillLevel} · ${person.hasVehicle?'Has vehicle':'No vehicle'}`}
            {' · Applied '}{new Date(person.createdAt||person.joinedAt).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          {isVet && person.specializations?.map(s=>(
            <span key={s} style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, color:accent, background:accentBg }}>{s}</span>
          ))}
          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600,
            color: approved?'#0F6E56':'#854F0B', background: approved?'#E1F5EE':'#FAEEDA' }}>
            {approved?'Approved':'Pending'}
          </span>
        </div>
        <button onClick={()=>setExpanded(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--text-muted)' }}>
          {expanded?'Less ▲':'Details ▼'}
        </button>
      </div>

      {expanded && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'14px 18px', background:'var(--bg)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:10, marginBottom:14 }}>
            {(isVet ? [
              ['Email', person.user?.email], ['Phone', person.user?.phone],
              ['Address', person.clinicAddress], ['Pincode', person.pincode],
              ['Consult fee', `₹${person.consultationFee}`],
              ['Home visit', person.offersHomeVisit?`Yes — ₹${person.homeVisitFee} (${person.homeVisitRadius}km)`:'No'],
              ['Schedule', person.availabilitySlots?.map(s=>`${s.day} ${s.startTime}–${s.endTime}`).join(', ')||'—'],
            ] : [
              ['Email', person.user?.email], ['Phone', person.user?.phone],
              ['Has vehicle', person.hasVehicle?'Yes':'No'], ['Radius', `${person.operatingRadius} km`],
              ['Total rescues', person.totalRescues],
              ['Certifications', person.certifications?.join(', ')||'—'],
              ['Emergency contact', person.emergencyContact?.name ? `${person.emergencyContact.name} (${person.emergencyContact.phone})` : '—'],
            ]).map(([l,v])=>(
              <div key={l}><p style={{ fontSize:11, color:'var(--text-hint)', marginBottom:2 }}>{l}</p><p style={{ fontSize:12, wordBreak:'break-word' }}>{v||'—'}</p></div>
            ))}
          </div>

          {person.documents?.length>0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:6 }}>Documents</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {person.documents.map((d,i)=>(
                  <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, padding:'3px 10px', borderRadius:20, border:'1px solid var(--border-md)', color:accent }}>
                    📄 {d.name||`Doc ${i+1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!approved ? (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <button onClick={()=>act(onApprove)} disabled={acting}
                style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'var(--green)', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity:acting?0.7:1 }}>
                {acting?<span className="spinner" style={{ borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.3)', width:13, height:13, borderWidth:2 }}/>:'✓'} Approve
              </button>
              {!showDenyBox ? (
                <button onClick={()=>setShowDenyBox(true)}
                  style={{ padding:'8px 18px', borderRadius:8, border:'1.5px solid var(--coral)', background:'transparent', color:'var(--coral)', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                  ✕ Deny
                </button>
              ) : (
                <div style={{ display:'flex', gap:8, flex:1, flexWrap:'wrap' }}>
                  <input className="form-input" placeholder="Reason (optional)" value={denyReason}
                    onChange={e=>setDenyReason(e.target.value)} style={{ flex:1, minWidth:180, padding:'7px 12px', fontSize:13 }} />
                  <button onClick={()=>act(()=>onDeny(denyReason))} disabled={acting}
                    style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'var(--coral)', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    Confirm deny
                  </button>
                  <button onClick={()=>setShowDenyBox(false)}
                    style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', fontSize:12, cursor:'pointer', color:'var(--text-muted)' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={()=>act(onRevoke)} disabled={acting}
              style={{ padding:'7px 16px', borderRadius:8, border:'1.5px solid var(--coral)', background:'transparent', color:'var(--coral)', fontWeight:600, fontSize:12, cursor:'pointer' }}>
              Revoke approval
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Network map ───────────────────────────────────────────────────────────────
function NetworkMap({ pins }) {
  const [filter, setFilter] = useState('all');
  const filtered = pins.filter(p => filter==='all' || p.type===filter);
  const vCount = pins.filter(p=>p.type==='vet').length;
  const volCount= pins.filter(p=>p.type==='volunteer').length;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:16 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#1D9E75', display:'inline-block' }} />
            Vets ({vCount})
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#EF9F27', display:'inline-block' }} />
            Volunteers ({volCount})
          </span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['all','All'],['vet','Vets'],['volunteer','Volunteers']].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{
              padding:'4px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
              border:`1.5px solid ${filter===k?'var(--green)':'var(--border-md)'}`,
              background: filter===k?'var(--green)':'transparent',
              color: filter===k?'#fff':'var(--text-muted)', transition:'all 0.15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {pins.length===0 && (
        <div style={{ padding:'12px 16px', background:'var(--amber-light)', borderRadius:10, border:'1px solid rgba(239,159,39,0.3)', fontSize:13, color:'#854F0B', marginBottom:14 }}>
          No approved vets or volunteers with GPS coordinates yet. Approve applications to see them appear on the map.
        </div>
      )}

      <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid var(--border)' }}>
        <MapContainer center={[20.5937,78.9629]} zoom={5} style={{ height:520, width:'100%' }} scrollWheelZoom={true}>
          <TileLayer attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filtered.map(pin => pin.lat && pin.lng ? (
            <Marker key={`${pin.type}-${pin.id}`} position={[pin.lat, pin.lng]} icon={pin.type==='vet'?vetIcon:volunteerIcon}>
              <Popup>
                <div style={{ fontFamily:'system-ui', minWidth:160 }}>
                  <p style={{ fontWeight:700, fontSize:13, marginBottom:4, color:pin.type==='vet'?'#185FA5':'#854F0B' }}>
                    {pin.type==='vet'?'🩺 Vet':'🤝 Volunteer'}
                  </p>
                  <p style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{pin.name}</p>
                  {pin.clinic && <p style={{ fontSize:12, color:'#666', marginBottom:2 }}>{pin.clinic}</p>}
                  <p style={{ fontSize:12, color:'#666', marginBottom:4 }}>{pin.city}</p>
                  {pin.phone && <p style={{ fontSize:12, color:'#185FA5', marginBottom:4 }}>{pin.phone}</p>}
                  {pin.specializations && <p style={{ fontSize:11, color:'#888' }}>Specializations: {pin.specializations.join(', ')}</p>}
                  {pin.fee && <p style={{ fontSize:11, color:'#888' }}>Consult: ₹{pin.fee}</p>}
                  {pin.skill && <p style={{ fontSize:11, color:'#888' }}>Skill: {pin.skill}</p>}
                  {pin.status && <p style={{ fontSize:11, fontWeight:600, color:pin.status==='available'?'#1D9E75':'#888', marginTop:4 }}>● {pin.status}</p>}
                </div>
              </Popup>
            </Marker>
          ) : null)}
        </MapContainer>
      </div>
    </div>
  );
}

// ── Monthly summary table ─────────────────────────────────────────────────────
function MonthlySummaryTable({ data }) {
  const [monthFilter, setMonthFilter] = useState('');
  if (!data?.byLocation?.length) return <Empty icon="📋" text="No case data yet" />;
  const months = [...new Set(data.byLocation.map(r=>r._id.month))].sort().reverse();
  const filtered = monthFilter ? data.byLocation.filter(r=>r._id.month===monthFilter) : data.byLocation.slice(0,60);

  return (
    <div>
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
        <select className="form-input form-select" value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}
          style={{ maxWidth:180, padding:'7px 10px', fontSize:13 }}>
          <option value="">All months</option>
          {months.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        {monthFilter && <button onClick={()=>setMonthFilter('')} style={{ fontSize:12, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>Clear ✕</button>}
        <p style={{ fontSize:12, color:'var(--text-hint)', marginLeft:'auto' }}>{filtered.length} entries</p>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'var(--bg)', borderBottom:'2px solid var(--border)' }}>
              {['Month','Location','Total','Resolved','Active'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row,i)=>{
              const pct = row.total>0?Math.round((row.resolved/row.total)*100):0;
              return (
                <tr key={i} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'var(--surface)':'var(--bg)' }}>
                  <td style={{ padding:'10px 14px', fontWeight:500 }}>{row._id.month}</td>
                  <td style={{ padding:'10px 14px', color:'var(--text-muted)', maxWidth:220 }}>
                    <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row._id.city?.split(',')[0]||'Unknown'}</span>
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:600 }}>{row.total}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:56, height:5, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:'var(--green)', borderRadius:4 }} />
                      </div>
                      <span style={{ color:'var(--green)', fontWeight:500 }}>{row.resolved} <span style={{ fontSize:10, color:'var(--text-hint)' }}>({pct}%)</span></span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    {row.active>0 ? <span style={{ color:'var(--coral)', fontWeight:600 }}>{row.active}</span> : <span style={{ color:'var(--text-hint)' }}>0</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Cases section ─────────────────────────────────────────────────────────────
function CasesSection() {
  const toast = useToast();
  const [subTab,       setSubTab]       = useState('list');
  const [caseType,     setCaseType]     = useState('street');
  const [streetCases,  setStreetCases]  = useState([]);
  const [monthly,      setMonthly]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [month,        setMonth]        = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(()=>{
    getMonthlySummary().then(r=>setMonthly(r.data)).catch(()=>{});
    fetchCases();
  },[]);

  const fetchCases = useCallback(()=>{
    setLoading(true);
    const params={};
    if(month) params.month=month;
    else { if(dateFrom) params.from=dateFrom; if(dateTo) params.to=dateTo; }
    if(statusFilter) params.status=statusFilter;
    getStreetCases(params).then((r) => setStreetCases(r.data))
      .catch(()=>toast.error('Failed to load cases')).finally(()=>setLoading(false));
  },[month,dateFrom,dateTo,statusFilter]);

  const STATUSES = ['reported','dispatched','volunteer-enroute','vet-dispatched','rescue-in-progress','rescued','completed','cancelled'];
  const cases = streetCases;

  return (
    <div>
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        {[{k:'list',l:'Case list'},{k:'monthly',l:'Monthly summary'}].map(t=>(
          <button key={t.k} onClick={()=>setSubTab(t.k)} style={{
            padding:'9px 18px', fontSize:13, fontWeight:subTab===t.k?600:400,
            color:subTab===t.k?'var(--green)':'var(--text-muted)',
            background:'transparent', border:'none', cursor:'pointer',
            borderBottom:subTab===t.k?'2px solid var(--green)':'2px solid transparent', marginBottom:-1,
          }}>{t.l}</button>
        ))}
      </div>

      {subTab==='monthly' ? <MonthlySummaryTable data={monthly} /> : (
        <>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end', padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:16 }}>
            <div className="form-group" style={{ minWidth:130 }}>
              <label className="form-label">Type</label>
              <select className="form-input form-select" value={caseType} onChange={e=>setCaseType(e.target.value)} style={{ padding:'7px 10px', fontSize:13 }} disabled>
                <option value="street">Street rescue</option>
              </select>
            </div>
            <div className="form-group" style={{ minWidth:130 }}>
              <label className="form-label">Month</label>
              <input className="form-input" type="month" value={month} onChange={e=>{setMonth(e.target.value);setDateFrom('');setDateTo('');}} style={{ padding:'7px 10px', fontSize:13 }} />
            </div>
            <div className="form-group" style={{ minWidth:120 }}>
              <label className="form-label">From</label>
              <input className="form-input" type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setMonth('');}} style={{ padding:'7px 10px', fontSize:13 }} />
            </div>
            <div className="form-group" style={{ minWidth:120 }}>
              <label className="form-label">To</label>
              <input className="form-input" type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setMonth('');}} style={{ padding:'7px 10px', fontSize:13 }} />
            </div>
            <div className="form-group" style={{ minWidth:150 }}>
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:'7px 10px', fontSize:13 }}>
                <option value="">All statuses</option>
                {STATUSES.map(s=><option key={s} value={s}>{s.replace(/-/g,' ')}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:8, alignSelf:'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={fetchCases}>Apply</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setDateFrom('');setDateTo('');setMonth('');setStatusFilter('');}}>Clear</button>
            </div>
          </div>

          <p style={{ fontSize:12, color:'var(--text-hint)', marginBottom:12 }}>
            {cases.length} case{cases.length!==1?'s':''} {month?`in ${month}`:dateFrom?`from ${dateFrom}`:''}{statusFilter?` · ${statusFilter}`:''}
          </p>

          {loading ? <Loader /> : cases.length===0 ? <Empty icon="📂" text="No cases match your filter" /> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:700 }}>
                <thead>
                  <tr style={{ background:'var(--bg)', borderBottom:'2px solid var(--border)' }}>
                    {['Date & time','Case details','Reporter','Assigned to','Location','Stage'].map(h=>(
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c,i) => (
                    <tr key={c._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'var(--surface)':'var(--bg)' }}>
                      <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>
                        <p style={{ fontWeight:500 }}>{new Date(c.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</p>
                        <p style={{ fontSize:11, color:'var(--text-hint)' }}>{new Date(c.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                      </td>
                      <td style={{ padding:'10px 12px', maxWidth:180 }}>
                        <p style={{ fontWeight:500, textTransform:'capitalize', marginBottom:3 }}>{c.injuryType?.replace(/-/g,' ')}</p>
                        <p style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{c.landmark||'No landmark'}</p>
                        <div style={{ display:'flex', gap:2, marginTop:4 }}>
                          {[1,2,3,4,5].map(n=>(
                            <div key={n} style={{ width:7, height:7, borderRadius:'50%', background: n<=c.severityScore?(c.severityScore>=4?'var(--coral)':c.severityScore>=3?'var(--amber)':'var(--green)'):'var(--border)' }} />
                          ))}
                          <span style={{ fontSize:10, color:'var(--text-hint)', marginLeft:4 }}>Sev {c.severityScore}/5</span>
                        </div>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <p style={{ fontWeight:500 }}>{c.reporter?.name||'Guest'}</p>
                        <p style={{ fontSize:11, color:'var(--text-muted)' }}>{c.reporterPhone}</p>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        {c.assignedVet
                          ? <><p style={{ fontWeight:500 }}>🩺 {c.assignedVet.user?.name}</p><p style={{ fontSize:10, color:'var(--text-muted)' }}>Vet</p></>
                          : c.assignedVolunteer
                          ? <><p style={{ fontWeight:500 }}>🤝 {c.assignedVolunteer.user?.name}</p><p style={{ fontSize:10, color:'var(--text-muted)' }}>Volunteer</p></>
                          : <span style={{ fontSize:11, color:'var(--text-hint)' }}>—</span>
                        }
                      </td>
                      <td style={{ padding:'10px 12px', maxWidth:140 }}>
                        <p style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {c.location?.address?.split(',')[0]||'—'}
                        </p>
                      </td>
                      <td style={{ padding:'10px 12px' }}><Pill status={c.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { admin, logout } = useAdmin();
  const navigate          = useNavigate();
  const toast             = useToast();

  const [page,         setPage]         = useState('overview');
  const [stats,        setStats]        = useState(null);
  const [mapPins,      setMapPins]      = useState([]);
  const [pendingVets,  setPendingVets]  = useState([]);
  const [approvedVets, setApprovedVets] = useState([]);
  const [pendingVols,  setPendingVols]  = useState([]);
  const [approvedVols, setApprovedVols] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingVets,  setLoadingVets]  = useState(false);
  const [loadingVols,  setLoadingVols]  = useState(false);

  const refreshPins = () => getMapPins().then(r=>setMapPins(r.data)).catch(()=>{});

  useEffect(()=>{
    Promise.all([getAdminStats(), getMapPins()])
      .then(([s,m])=>{ setStats(s.data); setMapPins(m.data); })
      .catch(()=>toast.error('Failed to load overview'))
      .finally(()=>setLoadingStats(false));
  },[]);

  useEffect(()=>{
    if(page==='vets'){
      setLoadingVets(true);
      Promise.all([getPendingVets(),getApprovedVets()])
        .then(([p,a])=>{ setPendingVets(p.data); setApprovedVets(a.data); })
        .catch(()=>toast.error('Failed to load vets'))
        .finally(()=>setLoadingVets(false));
    }
  },[page]);

  useEffect(()=>{
    if(page==='volunteers'){
      setLoadingVols(true);
      Promise.all([getPendingVols(),getApprovedVols()])
        .then(([p,a])=>{ setPendingVols(p.data); setApprovedVols(a.data); })
        .catch(()=>toast.error('Failed to load volunteers'))
        .finally(()=>setLoadingVols(false));
    }
  },[page]);

  // Vet actions
  const actVet = { 
    approve: async id=>{ try{ await approveVet(id); toast.success('Vet approved'); setPendingVets(p=>p.filter(v=>v._id!==id)); setStats(s=>s?{...s,totals:{...s.totals,pendingVets:s.totals.pendingVets-1,vets:s.totals.vets+1}}:s); refreshPins(); }catch(e){toast.error(e.response?.data?.message||'Failed');} },
    deny:    async (id,r)=>{ try{ await denyVet(id,r); toast.success('Denied'); setPendingVets(p=>p.filter(v=>v._id!==id)); setStats(s=>s?{...s,totals:{...s.totals,pendingVets:s.totals.pendingVets-1}}:s); }catch(e){toast.error(e.response?.data?.message||'Failed');} },
    revoke:  async id=>{ try{ await revokeVet(id); toast.success('Revoked'); setApprovedVets(p=>p.filter(v=>v._id!==id)); refreshPins(); }catch(e){toast.error(e.response?.data?.message||'Failed');} },
  };

  // Volunteer actions
  const actVol = {
    approve: async id=>{ try{ await approveVolunteer(id); toast.success('Volunteer approved'); setPendingVols(p=>p.filter(v=>v._id!==id)); setStats(s=>s?{...s,totals:{...s.totals,pendingVolunteers:s.totals.pendingVolunteers-1,volunteers:s.totals.volunteers+1}}:s); refreshPins(); }catch(e){toast.error(e.response?.data?.message||'Failed');} },
    deny:    async (id,r)=>{ try{ await denyVolunteer(id,r); toast.success('Denied'); setPendingVols(p=>p.filter(v=>v._id!==id)); }catch(e){toast.error(e.response?.data?.message||'Failed');} },
    revoke:  async id=>{ try{ await revokeVolunteer(id); toast.success('Revoked'); setApprovedVols(p=>p.filter(v=>v._id!==id)); refreshPins(); }catch(e){toast.error(e.response?.data?.message||'Failed');} },
  };

  const navItems = [
    { key:'overview',   icon:'📊', label:'Overview' },
    { key:'vets',       icon:'🩺', label:'Vet requests',       badge:stats?.totals?.pendingVets },
    { key:'volunteers', icon:'🤝', label:'Volunteer requests',  badge:stats?.totals?.pendingVolunteers },
    { key:'map',        icon:'🗺️', label:'Network map' },
    { key:'cases',      icon:'📋', label:'Cases' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'var(--font-sans)', background:'var(--bg)' }}>

      {/* Sidebar */}
      <div style={{ width:220, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>
        <div style={{ padding:'20px 18px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:20, color:'var(--green)' }}>🐾</span>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--green)' }}>PawRescue</span>
          </div>
          <span style={{ fontSize:11, background:'var(--coral-light)', color:'var(--coral)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>Admin Panel</span>
        </div>

        <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>setPage(item.key)} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              width:'100%', padding:'10px 12px', borderRadius:8, marginBottom:2,
              border:'none', cursor:'pointer', textAlign:'left', transition:'all 0.15s',
              background:page===item.key?'var(--green-light)':'transparent',
              color:page===item.key?'var(--green-mid)':'var(--text-muted)',
              fontWeight:page===item.key?600:400, fontSize:13,
            }}>
              <span style={{ display:'flex', alignItems:'center', gap:9 }}>
                <span>{item.icon}</span>{item.label}
              </span>
              {item.badge>0 && (
                <span style={{ padding:'1px 7px', borderRadius:20, fontSize:11, fontWeight:700, background:'var(--coral)', color:'#fff', minWidth:20, textAlign:'center' }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)' }}>
          <button onClick={()=>{ logout(); navigate('/admin/login'); }} style={{
            display:'flex', alignItems:'center', gap:8, width:'100%',
            padding:'9px 12px', borderRadius:8, border:'none', cursor:'pointer',
            background:'transparent', color:'var(--text-muted)', fontSize:13, transition:'background 0.15s',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--coral-light)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            ← Log out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflow:'auto' }}>
        <div style={{ padding:'18px 28px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-serif)', fontSize:20, marginBottom:1 }}>
              {navItems.find(n=>n.key===page)?.icon} {navItems.find(n=>n.key===page)?.label}
            </h1>
            <p style={{ fontSize:11, color:'var(--text-hint)' }}>
              {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
            </p>
          </div>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>Logged in as <strong>Admin</strong></span>
        </div>

        <div style={{ padding:'24px 28px' }}>

          {/* Overview */}
          {page==='overview' && (loadingStats ? <Loader /> : stats ? (
            <div className="page-enter">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
                <Stat val={stats.totals.street}            label="Street cases"         icon="🐕" />
                <Stat val={stats.totals.resolved}          label="Total resolved"       icon="✅" color="var(--green)" />
                <Stat val={stats.totals.active}            label="Active rescues"       icon="🚨" color="var(--coral)" />
                <Stat val={stats.totals.vets}              label="Active vets"          icon="🩺" color="#185FA5" />
                <Stat val={stats.totals.pendingVets}       label="Pending vet apps"     icon="⏳" color="var(--amber)" alert={stats.totals.pendingVets>0} />
                <Stat val={stats.totals.volunteers}        label="Volunteers"           icon="🤝" />
                <Stat val={stats.totals.pendingVolunteers} label="Pending volunteers"   icon="⏳" color="var(--amber)" alert={stats.totals.pendingVolunteers>0} />
                <Stat val={stats.totals.users}             label="Users"                icon="👤" />
              </div>

              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:18 }}>
                <p style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Street cases — last 14 days</p>
                {!stats.daily?.length ? <Empty icon="📊" text="No data yet" /> : (
                  <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:90 }}>
                    {stats.daily.map(d=>{
                      const max=Math.max(...stats.daily.map(x=>x.count),1);
                      return (
                        <div key={d._id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }} title={`${d._id}: ${d.count}`}>
                          <span style={{ fontSize:9, color:'var(--text-hint)' }}>{d.count}</span>
                          <div style={{ width:'100%', borderRadius:'3px 3px 0 0', background:'var(--green)', height:`${Math.max((d.count/max)*70,4)}px`, transition:'height 0.4s' }} />
                          <span style={{ fontSize:8, color:'var(--text-hint)', writingMode:'vertical-lr', transform:'rotate(180deg)' }}>{d._id?.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
                  <p style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Injury breakdown</p>
                  {stats?.injuries?.map((inj,i)=>{
                    const pct=stats.totals.street>0?Math.round((inj.count/stats.totals.street)*100):0;
                    return (
                      <div key={inj._id} style={{ marginBottom:9 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:12, textTransform:'capitalize' }}>{inj._id?.replace(/-/g,' ')}</span>
                          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{inj.count} ({pct}%)</span>
                        </div>
                        <div style={{ height:5, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, borderRadius:4, background:['var(--coral)','var(--amber)','var(--green)','#185FA5','#8B5CF6','var(--green-mid)','#aaa'][i%7] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
                  <p style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Severity distribution</p>
                  <div style={{ display:'flex', gap:8 }}>
                    {[1,2,3,4,5].map(score=>{
                      const found=stats.severity?.find(s=>s._id===score);
                      const c=score>=4?'var(--coral)':score>=3?'var(--amber)':'var(--green)';
                      return (
                        <div key={score} style={{ flex:1, textAlign:'center', padding:'12px 4px', borderRadius:8, border:`1px solid ${c}22`, background:c+'0a' }}>
                          <p style={{ fontFamily:'var(--font-serif)', fontSize:22, color:c, lineHeight:1 }}>{found?.count||0}</p>
                          <p style={{ fontSize:10, color:c, fontWeight:600, marginTop:4 }}>L{score}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null)}

          {/* Vets */}
          {page==='vets' && (loadingVets ? <Loader /> : (
            <div className="page-enter">
              <section style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <h2 style={{ fontSize:16, fontWeight:600 }}>Pending applications</h2>
                  {pendingVets.length>0 && <span style={{ padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700, background:'var(--coral-light)', color:'var(--coral)' }}>{pendingVets.length}</span>}
                </div>
                {pendingVets.length===0 ? <Empty icon="✅" text="No pending vet applications" /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {pendingVets.map(v=>(
                      <ApprovalCard key={v._id} person={v} type="vet"
                        onApprove={()=>actVet.approve(v._id)}
                        onDeny={r=>actVet.deny(v._id,r)} />
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Approved vets <span style={{ fontSize:13, color:'var(--text-hint)', fontWeight:400 }}>({approvedVets.length})</span></h2>
                {approvedVets.length===0 ? <Empty icon="🩺" text="No approved vets yet" /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {approvedVets.map(v=>(
                      <ApprovalCard key={v._id} person={v} type="vet" approved
                        onRevoke={()=>actVet.revoke(v._id)} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ))}

          {/* Volunteers */}
          {page==='volunteers' && (loadingVols ? <Loader /> : (
            <div className="page-enter">
              <section style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <h2 style={{ fontSize:16, fontWeight:600 }}>Pending applications</h2>
                  {pendingVols.length>0 && <span style={{ padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700, background:'var(--coral-light)', color:'var(--coral)' }}>{pendingVols.length}</span>}
                </div>
                {pendingVols.length===0 ? <Empty icon="✅" text="No pending volunteer applications" /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {pendingVols.map(v=>(
                      <ApprovalCard key={v._id} person={v} type="volunteer"
                        onApprove={()=>actVol.approve(v._id)}
                        onDeny={r=>actVol.deny(v._id,r)} />
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Approved volunteers <span style={{ fontSize:13, color:'var(--text-hint)', fontWeight:400 }}>({approvedVols.length})</span></h2>
                {approvedVols.length===0 ? <Empty icon="🤝" text="No approved volunteers yet" /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {approvedVols.map(v=>(
                      <ApprovalCard key={v._id} person={v} type="volunteer" approved
                        onRevoke={()=>actVol.revoke(v._id)} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ))}

          {/* Map */}
          {page==='map' && (
            <div className="page-enter">
              <NetworkMap pins={mapPins} />
            </div>
          )}

          {/* Cases */}
          {page==='cases' && (
            <div className="page-enter">
              <CasesSection />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}