// In-memory OTP store for MVP.
// Production: replace with Redis (SET key EX 300)
// Structure: { phone: { otp, expiresAt, attempts } }

const store = new Map();

const set = (phone, otp) => {
  store.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
  });
};

const get = (phone) => store.get(phone);

const increment = (phone) => {
  const entry = store.get(phone);
  if (entry) entry.attempts += 1;
};

const clear = (phone) => store.delete(phone);

module.exports = { set, get, increment, clear };

