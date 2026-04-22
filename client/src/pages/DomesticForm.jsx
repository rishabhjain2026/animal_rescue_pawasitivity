import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPets, getVetsByCity, bookAppointment, registerDomestic, getVetSlots } from '../api/cases.api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function DomesticForm() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [step,     setStep]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [pets,     setPets]     = useState([]);
  const [vets,     setVets]     = useState([]);
  const [slots,    setSlots]    = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [form, setForm] = useState({
    petId:       '',
    complaint:   '',
    symptoms:    '',
    vetId:       '',
    apptType:    'clinic',
    apptDate:    '',
    apptSlot:    '',
    homeAddress: '',
  });

  useEffect(() => {
    getMyPets().then((r) => setPets(r.data)).catch(() => {});
    if (user?.city) {
      getVetsByCity(user.city).then((r) => setVets(r.data)).catch(() => {});
    }
  }, [user]);

  // Load slots when vet + date chosen
  useEffect(() => {
    if (form.vetId && form.apptDate) {
      setSlotsLoading(true);
      getVetSlots(form.vetId, form.apptDate)
        .then((r) => setSlots(r.data.slots || []))
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    }
  }, [form.vetId, form.apptDate]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Register the case first
      const caseRes = await registerDomestic({
        petId:     form.petId,
        vetId:     form.vetId,
        complaint: form.complaint,
        symptoms:  JSON.stringify(form.symptoms.split(',').map(s => s.trim()).filter(Boolean)),
      });

      // Then book appointment
      await bookAppointment({
        petId:       form.petId,
        vetId:       form.vetId,
        caseId:      caseRes.data.case._id,
        type:        form.apptType,
        date:        form.apptDate,
        timeSlot:    form.apptSlot,
        homeAddress: form.homeAddress,
      });

      toast.success('Case registered and appointment booked!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedVet = vets.find((v) => v._id === form.vetId);
  const selectedPet = pets.find((p) => p._id === form.petId);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate  = tomorrow.toISOString().split('T')[0];

  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', background:'var(--bg)', padding:'40px 24px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>

        <div style={{ marginBottom:32 }}>
          <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, background:'var(--green-light)', color:'var(--green-mid)', fontSize:12, fontWeight:600, marginBottom:12 }}>
            Domestic animal
          </span>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:32, marginBottom:8 }}>Book a vet appointment</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>Register a health case for your pet and schedule a vet visit.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:8, marginBottom:32 }}>
          {['Your pet','Complaint','Choose vet','Appointment'].map((label, i) => (
            <div key={label} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:4, borderRadius:4, marginBottom:6,
                background: step > i+1 ? 'var(--green)' : step === i+1 ? 'var(--green)' : 'var(--border-md)', transition:'background 0.3s' }} />
              <span style={{ fontSize:10, color: step === i+1 ? 'var(--green)' : 'var(--text-hint)', fontWeight: step === i+1 ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Pet selection ── */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="page-enter">
            {pets.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:40 }}>
                <p style={{ fontSize:32, marginBottom:12 }}>🐾</p>
                <p style={{ fontWeight:600, marginBottom:8 }}>No pets registered yet</p>
                <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>Register your pet first to get a permanent health PIN and QR passport.</p>
                <button className="btn btn-primary" onClick={() => navigate('/my-pets/register')}>Register my pet</button>
              </div>
            ) : (
              <>
                <p style={{ fontWeight:500, fontSize:15 }}>Select the pet that needs attention:</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {pets.map((pet) => (
                    <button
                      key={pet._id}
                      onClick={() => setForm((p) => ({ ...p, petId: pet._id }))}
                      style={{
                        display:'flex', alignItems:'center', gap:16, padding:'16px 20px',
                        borderRadius:'var(--radius-md)',
                        border: `2px solid ${form.petId === pet._id ? 'var(--green)' : 'var(--border)'}`,
                        background: form.petId === pet._id ? 'var(--green-light)' : 'var(--surface)',
                        cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                      }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                        {pet.species === 'dog' ? '🐕' : '🐈'}
                      </div>
                      <div>
                        <p style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{pet.name}</p>
                        <p style={{ fontSize:13, color:'var(--text-muted)' }}>{pet.breed || pet.species} · PIN: {pet.pin}</p>
                      </div>
                      {form.petId === pet._id && (
                        <svg style={{ marginLeft:'auto' }} width="20" height="20" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="9" fill="var(--green)" /><path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/my-pets/register')}>
                  + Register a new pet
                </button>
              </>
            )}
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(2)} disabled={!form.petId}>
              Next
            </button>
          </div>
        )}

        {/* ── Step 2: Complaint ── */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }} className="page-enter">
            <div className="form-group">
              <label className="form-label">Main complaint <span style={{ color:'var(--coral)' }}>*</span></label>
              <textarea className="form-input" rows={4} placeholder="e.g. Limping since yesterday, not eating, fever noticed..." value={form.complaint} onChange={set('complaint')} style={{ resize:'vertical' }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Symptoms (comma-separated)</label>
              <input className="form-input" placeholder="e.g. vomiting, lethargy, loss of appetite" value={form.symptoms} onChange={set('symptoms')} />
              <span className="form-hint">Helps the vet prepare before the appointment</span>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={() => setStep(3)} disabled={!form.complaint}>Next — Choose vet</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Choose vet ── */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="page-enter">
            {vets.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:32 }}>
                <p style={{ color:'var(--text-muted)', fontSize:14 }}>No vets found in {user?.city}. Try searching another city.</p>
              </div>
            ) : (
              vets.map((vet) => (
                <button
                  key={vet._id}
                  onClick={() => setForm((p) => ({ ...p, vetId: vet._id, apptSlot:'' }))}
                  style={{
                    display:'flex', alignItems:'flex-start', gap:16, padding:'18px 20px',
                    borderRadius:'var(--radius-md)', textAlign:'left', cursor:'pointer', width:'100%',
                    border: `2px solid ${form.vetId === vet._id ? 'var(--green)' : 'var(--border)'}`,
                    background: form.vetId === vet._id ? 'var(--green-light)' : 'var(--surface)',
                    transition:'all 0.15s',
                  }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'#E6F1FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🩺</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{vet.user?.name}</p>
                    <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:6 }}>{vet.clinicName} · {vet.city}</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, padding:'2px 10px', borderRadius:20, background:'var(--green-light)', color:'var(--green-mid)' }}>
                        ₹{vet.consultationFee} clinic
                      </span>
                      {vet.offersHomeVisit && (
                        <span style={{ fontSize:12, padding:'2px 10px', borderRadius:20, background:'#E6F1FB', color:'#185FA5' }}>
                          ₹{vet.homeVisitFee} home visit
                        </span>
                      )}
                      {vet.specializations?.map((s) => (
                        <span key={s} style={{ fontSize:12, padding:'2px 10px', borderRadius:20, background:'var(--border)', color:'var(--text-muted)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  {form.vetId === vet._id && (
                    <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink:0 }}>
                      <circle cx="10" cy="10" r="9" fill="var(--green)" /><path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              ))
            )}
            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={() => setStep(4)} disabled={!form.vetId}>Next — Book slot</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Appointment ── */}
        {step === 4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }} className="page-enter">

            <div className="form-group">
              <label className="form-label">Visit type</label>
              <div style={{ display:'flex', gap:12 }}>
                {[{val:'clinic',label:'Clinic visit'},{val:'home-visit',label:'Home visit', disabled:!selectedVet?.offersHomeVisit}].map(opt => (
                  <button
                    key={opt.val}
                    disabled={opt.disabled}
                    onClick={() => setForm((p) => ({ ...p, apptType: opt.val }))}
                    style={{
                      flex:1, padding:'12px 0', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:500, cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      border: `2px solid ${form.apptType === opt.val ? 'var(--green)' : 'var(--border)'}`,
                      background: form.apptType === opt.val ? 'var(--green-light)' : 'var(--surface)',
                      color: opt.disabled ? 'var(--text-hint)' : 'var(--text)',
                      transition:'all 0.15s',
                    }}>
                    {opt.label}
                    {opt.disabled && <span style={{ display:'block', fontSize:11, color:'var(--text-hint)', marginTop:2 }}>Not available</span>}
                  </button>
                ))}
              </div>
            </div>

            {form.apptType === 'home-visit' && (
              <div className="form-group">
                <label className="form-label">Your home address</label>
                <textarea className="form-input" rows={2} placeholder="Full address with flat/house number" value={form.homeAddress} onChange={set('homeAddress')} style={{ resize:'vertical' }} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Preferred date</label>
              <input className="form-input" type="date" min={minDate} value={form.apptDate} onChange={set('apptDate')} />
            </div>

            {form.apptDate && (
              <div className="form-group">
                <label className="form-label">Available time slots</label>
                {slotsLoading ? (
                  <div style={{ padding:20, textAlign:'center' }}><span className="spinner" /></div>
                ) : slots.length === 0 ? (
                  <p style={{ fontSize:13, color:'var(--text-muted)', padding:12 }}>No slots available on this date. Try another day.</p>
                ) : (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:4 }}>
                    {slots.map((slot) => (
                      <button key={slot} onClick={() => setForm((p) => ({ ...p, apptSlot: slot }))}
                        style={{
                          padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer',
                          border: `1.5px solid ${form.apptSlot === slot ? 'var(--green)' : 'var(--border-md)'}`,
                          background: form.apptSlot === slot ? 'var(--green)' : 'var(--surface)',
                          color: form.apptSlot === slot ? '#fff' : 'var(--text)',
                          transition:'all 0.15s',
                        }}>{slot}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Booking summary */}
            {form.apptSlot && (
              <div className="card" style={{ background:'var(--green-light)', border:'1px solid rgba(29,158,117,0.2)' }}>
                <p style={{ fontWeight:600, marginBottom:12 }}>Booking summary</p>
                {[
                  ['Pet',      selectedPet?.name],
                  ['Vet',      selectedVet?.user?.name],
                  ['Clinic',   selectedVet?.clinicName],
                  ['Type',     form.apptType === 'clinic' ? 'Clinic visit' : 'Home visit'],
                  ['Date',     form.apptDate],
                  ['Time',     form.apptSlot],
                  ['Fee',      `₹${form.apptType === 'home-visit' ? selectedVet?.homeVisitFee : selectedVet?.consultationFee}`],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(29,158,117,0.1)', fontSize:13 }}>
                    <span style={{ color:'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontWeight:500 }}>{v}</span>
                  </div>
                ))}
                <p style={{ fontSize:12, color:'var(--green-mid)', marginTop:10 }}>
                  You will receive a 30-minute reminder before your appointment.
                </p>
              </div>
            )}

            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(3)}>Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex:2 }} onClick={handleSubmit}
                disabled={loading || !form.apptSlot}>
                {loading ? <><span className="spinner" /> Booking...</> : 'Confirm appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}