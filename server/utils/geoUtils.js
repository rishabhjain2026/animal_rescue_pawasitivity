const axios = require('axios');

// Haversine formula — distance between two lat/lng points in km
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R   = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a   =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => (deg * Math.PI) / 180;

// Reverse geocode lat/lng to human-readable address
// Uses OpenStreetMap Nominatim (free, no API key needed for low volume)
const reverseGeocode = async (lat, lng) => {
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json' },
      headers: { 'User-Agent': 'PawRescue/1.0' },
      timeout: 5000,
    });
    return data.display_name || `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;  // fallback to raw coords
  }
};

// Check if a point is within a vet's home-visit radius
const isWithinRadius = (vetLat, vetLng, userLat, userLng, radiusKm) => {
  return haversineDistance(vetLat, vetLng, userLat, userLng) <= radiusKm;
};

module.exports = { haversineDistance, reverseGeocode, isWithinRadius };