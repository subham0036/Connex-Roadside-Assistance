import { useEffect, useState } from "react";

function straightLine(from, to) {
  return [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ];
}

export function useStaffRoute(staff, customer, enabled) {
  const [routePoints, setRoutePoints] = useState([]);

  useEffect(() => {
    if (!enabled || staff?.lat == null || customer?.lat == null) {
      setRoutePoints([]);
      return undefined;
    }

    const from = { lat: Number(staff.lat), lng: Number(staff.lng) };
    const to = { lat: Number(customer.lat), lng: Number(customer.lng) };
    if (Number.isNaN(from.lat) || Number.isNaN(to.lat)) {
      setRoutePoints([]);
      return undefined;
    }

    setRoutePoints(straightLine(from, to));

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;

        if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates?.length) {
          const pts = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoutePoints(pts);
        }
      } catch {
        if (!cancelled) setRoutePoints(straightLine(from, to));
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [staff?.lat, staff?.lng, customer?.lat, customer?.lng, enabled]);

  return routePoints;
}
