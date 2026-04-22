const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send 30-min appointment reminder to pet owner
const scheduleReminder = async (user, vet, appointment) => {
  try {
    const petName = appointment.pet?.name || 'your pet';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#1D9E75;">PawRescue Reminder</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your appointment for <strong>${petName}</strong> is in <strong>30 minutes</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="color:#888;padding:6px 0;">Vet</td>
              <td style="padding:6px 0;font-weight:500;">${vet.user.name}</td></tr>
          <tr><td style="color:#888;padding:6px 0;">Clinic</td>
              <td style="padding:6px 0;">${vet.clinicName}</td></tr>
          <tr><td style="color:#888;padding:6px 0;">Type</td>
              <td style="padding:6px 0;">${appointment.type === 'home-visit' ? 'Home Visit' : 'Clinic Visit'}</td></tr>
          <tr><td style="color:#888;padding:6px 0;">Time</td>
              <td style="padding:6px 0;">${appointment.timeSlot}</td></tr>
        </table>
        <p style="margin-top:24px;color:#888;font-size:13px;">PawRescue — Every life matters.</p>
      </div>`;

    await transporter.sendMail({
      from:    `"PawRescue" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: `Reminder: Appointment for ${petName} in 30 minutes`,
      html,
    });
  } catch (err) {
    console.error('Reminder email failed:', err.message);
  }
};

// Notify a vet or volunteer about a new street rescue dispatch
const notifyResponder = async (type, responder, streetCase) => {
  try {
    const user  = responder.user;
    const loc   = streetCase.location;
    const gmaps = `https://maps.google.com/?q=${loc.coordinates[1]},${loc.coordinates[0]}`;

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#D85A30;">Street Rescue Alert</h2>
        <p>Hi <strong>${user.name}</strong>, a street animal needs urgent help near you.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="color:#888;padding:6px 0;">Severity</td>
              <td style="padding:6px 0;font-weight:500;color:${severityColor(streetCase.severityScore)};">
                ${streetCase.severityScore}/5</td></tr>
          <tr><td style="color:#888;padding:6px 0;">Injury</td>
              <td style="padding:6px 0;">${streetCase.injuryType}</td></tr>
          <tr><td style="color:#888;padding:6px 0;">Landmark</td>
              <td style="padding:6px 0;">${streetCase.landmark || 'See GPS location'}</td></tr>
          <tr><td style="color:#888;padding:6px 0;">Location</td>
              <td style="padding:6px 0;"><a href="${gmaps}">Open in Maps</a></td></tr>
          <tr><td style="color:#888;padding:6px 0;">Reporter</td>
              <td style="padding:6px 0;">${streetCase.reporterPhone}</td></tr>
        </table>
        <p>Please log into PawRescue dashboard to <strong>accept or reject</strong> this request.</p>
        <p style="color:#999;font-size:12px;">This request will auto-escalate if not responded to within 5 minutes.</p>
      </div>`;

    await transporter.sendMail({
      from:    `"PawRescue Rescue System" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: `[URGENT] Street Rescue Dispatch — Severity ${streetCase.severityScore}/5`,
      html,
    });
  } catch (err) {
    console.error('Responder notification failed:', err.message);
  }
};

// Notify original reporter when case is completed with PDF link
const notifyReporter = async (streetCase) => {
  try {
    const User = require('../models/User');
    const reporter = await User.findById(streetCase.reporter);
    if (!reporter) return;

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#1D9E75;">Rescue Completed</h2>
        <p>Hi <strong>${reporter.name}</strong>, the animal you reported has been rescued.</p>
        <p>Thank you for making a difference. Your rescue report is attached below.</p>
        ${streetCase.reportPdfUrl
          ? `<p><a href="${streetCase.reportPdfUrl}" style="color:#1D9E75;">Download Rescue Report (PDF)</a></p>`
          : ''}
        <p style="color:#999;font-size:12px;">PawRescue — Every life matters.</p>
      </div>`;

    await transporter.sendMail({
      from:    `"PawRescue" <${process.env.EMAIL_USER}>`,
      to:      reporter.email,
      subject: 'Rescue completed — Your report is ready',
      html,
    });
  } catch (err) {
    console.error('Reporter notification failed:', err.message);
  }
};

const severityColor = (score) => {
  if (score >= 4) return '#E24B4A';
  if (score >= 3) return '#EF9F27';
  return '#1D9E75';
};

module.exports = { scheduleReminder, notifyResponder, notifyReporter };