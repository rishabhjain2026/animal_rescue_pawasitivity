// About page
export function AboutPage() {
  return (
    <div style={{ minHeight:'calc(100vh - var(--nav-h))', padding:'80px 24px', background:'var(--bg)' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(32px,5vw,52px)', marginBottom:20, lineHeight:1.1 }}>
          About Pawsitivity
        </h1>
        <p style={{ fontSize:17, color:'var(--text-muted)', lineHeight:1.8, marginBottom:40 }}>
          Pawsitivity is India's first ML-assisted animal rescue coordination platform for helping NGO. We connect people who spot injured or sick animals with the nearest verified vet and trained volunteer at earliest.
        </p>

        {[
          { title:'The problem we solve', body:'Every day, thousands of animals suffer on Indian streets with no one to help. Good samaritans want to act but don\'t know who to call, where to go, or what to do. Vets exist but have no system to receive emergency cases. Volunteers are willing but invisible.' },
          { title:'How we work', body:'When a case is reported, our system scores its severity using AI image analysis and the reporter\'s own input. We then dispatch the nearest available trained volunteer first — they stabilise the animal. A vet is simultaneously alerted. If no one responds in 5 minutes, the case automatically escalates to the next nearest responder.' },
          { title:'For domestic pets', body:'Pet owners can register their animal, get a permanent health PIN and QR code, book vet appointments (clinic or home visit), and track their pet\'s full medical history in one place.' },
          { title:'Open to all', body:'Pawsitivity is free for the public. Vets and volunteers register on the platform and are verified before activation. We are starting with dogs as a test case and plan to expand to all species.' },
        ].map(section => (
          <div key={section.title} style={{ marginBottom:36 }}>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:12, color:'var(--green)' }}>{section.title}</h2>
            <p style={{ fontSize:15, color:'var(--text-muted)', lineHeight:1.8 }}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AboutPage;

// ── Register page (re-export from Login.jsx pattern) ──────────────────────────
export { Register } from './Login';