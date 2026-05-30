import { useEffect, useState } from "react";
import api from "../config/api";

function sameCoords(a, b) {
  if (!a || !b) return false;
  return (
    Math.abs(Number(a.lat) - Number(b.lat)) < 0.00003 &&
    Math.abs(Number(a.lng) - Number(b.lng)) < 0.00003
  );
}

export function useStaffTracking(requestId, enabled) {
  const [staffLocation, setStaffLocation] = useState(null);

  useEffect(() => {
    if (!enabled || !requestId) {
      setStaffLocation(null);
      return undefined;
    }

    const fetchLoc = async () => {
      try {
        const res = await api.get(`/api/location/staff/${requestId}`);
        if (res.data?.location) {
          const next = res.data.location;
          setStaffLocation((prev) => (sameCoords(prev, next) ? prev : next));
        }
      } catch {
        /* ignore */
      }
    };

    fetchLoc();
    const interval = setInterval(fetchLoc, 5000);
    return () => clearInterval(interval);
  }, [requestId, enabled]);

  return staffLocation;
}

export function usePublishStaffLocation(requestId, enabled) {
  useEffect(() => {
    if (!enabled || !requestId || !navigator.geolocation) return undefined;

    const pushLocation = (pos) => {
      api
        .post("/api/location/staff", {
          requestId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        .catch(() => {});
    };

    const watchId = navigator.geolocation.watchPosition(pushLocation, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 8000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [requestId, enabled]);
}
