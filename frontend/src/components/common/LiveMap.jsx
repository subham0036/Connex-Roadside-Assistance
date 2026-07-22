import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import "./LiveMap.css";

const COLORS = {
  customer: "#3b82f6",
  staff: "#22c55e",
  garage: "#d4af37",
  default: "#94a3b8",
};

function makeIcon(color) {
  return L.divIcon({
    className: "connex-marker",
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 4px 14px rgba(0,0,0,0.45);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function safeRemoveMap(map) {
  if (!map) return;
  try {
    map.stop();
    map.eachLayer((layer) => {
      try {
        map.removeLayer(layer);
      } catch {
        /* ignore */
      }
    });
    map.off();
    map.remove();
  } catch {
    /* leaflet teardown race */
  }
}

export default function LiveMap({
  lat,
  lng,
  label,
  markers = [],
  routePoints = [],
  height = "100%",
  centerType = "customer",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const boundsFittedRef = useRef(false);

  const latNum = Number(lat);
  const lngNum = Number(lng);

  const centerKey = useMemo(() => {
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return null;
    return `${latNum.toFixed(5)},${lngNum.toFixed(5)}`;
  }, [latNum, lngNum]);

  const markersKey = useMemo(
    () =>
      JSON.stringify(
        (markers || []).map((m) => ({
          lat: Number(m.lat),
          lng: Number(m.lng),
          type: m.type,
          label: m.label,
        }))
      ),
    [markers]
  );

  const routeKey = useMemo(
    () =>
      JSON.stringify(
        (routePoints || []).map(([a, b]) => [Number(a).toFixed(5), Number(b).toFixed(5)])
      ),
    [routePoints]
  );

  useEffect(() => {
    if (!centerKey || !containerRef.current) return undefined;

    const [cLat, cLng] = centerKey.split(",").map(Number);
    boundsFittedRef.current = false;

    if (mapRef.current) {
      safeRemoveMap(mapRef.current);
      mapRef.current = null;
      markersLayerRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      inertia: false,
    }).setView([cLat, cLng], 14);

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      safeRemoveMap(mapRef.current);
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, [centerKey]);

  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer || !centerKey) return;

    routeLayer.clearLayers();
    const routeList = routeKey ? JSON.parse(routeKey) : [];
    if (routeList.length < 2) return;

    const latLngs = routeList.map(([a, b]) => [Number(a), Number(b)]);

    L.polyline(latLngs, {
      color: "#991b1b",
      weight: 9,
      opacity: 0.25,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(routeLayer);

    L.polyline(latLngs, {
      color: "#ef4444",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      className: "connex-route-line",
    }).addTo(routeLayer);
  }, [routeKey, centerKey]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !centerKey) return;

    const [cLat, cLng] = centerKey.split(",").map(Number);
    layer.clearLayers();

    const points = [[cLat, cLng]];
    const centerColor = COLORS[centerType] || COLORS.customer;

    L.marker([cLat, cLng], { icon: makeIcon(centerColor) })
      .addTo(layer)
      .bindPopup(label || "Location", { autoPan: false, closeOnClick: true });

    const markerList = markersKey ? JSON.parse(markersKey) : [];
    markerList.forEach((m) => {
      const mLat = Number(m.lat);
      const mLng = Number(m.lng);
      if (Number.isNaN(mLat) || Number.isNaN(mLng)) return;
      if (Math.abs(mLat - cLat) < 1e-6 && Math.abs(mLng - cLng) < 1e-6) return;
      const color = COLORS[m.type] || COLORS.default;
      L.marker([mLat, mLng], { icon: makeIcon(color) })
        .addTo(layer)
        .bindPopup(m.label || m.type || "Location", { autoPan: false, closeOnClick: true });
      points.push([mLat, mLng]);
    });

    const routeList = routeKey ? JSON.parse(routeKey) : [];
    routeList.forEach(([a, b]) => points.push([Number(a), Number(b)]));

    if (points.length > 1) {
      try {
        map.fitBounds(points, {
          padding: [48, 48],
          maxZoom: 15,
          animate: boundsFittedRef.current,
        });
        boundsFittedRef.current = true;
      } catch {
        /* ignore bounds errors */
      }
    }
  }, [markersKey, routeKey, centerKey, label, centerType]);

  if (!centerKey) {
    return (
      <div className="map-empty" style={{ height, minHeight: 200 }}>
        Map unavailable
      </div>
    );
  }

  return (
    <div className="connex-live-map-wrap" style={{ height, minHeight: 280 }}>
      <div ref={containerRef} className="connex-live-map" />
    </div>
  );
}
