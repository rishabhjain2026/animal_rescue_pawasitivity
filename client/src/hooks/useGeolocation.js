import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [coords,  setCoords]  = useState(null);   // { lat, lng }
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { coords, error, loading, getLocation };
};

export default useGeolocation;