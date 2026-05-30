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
  height = "100%",
  centerType = "customer",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
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

    return () => {
      safeRemoveMap(mapRef.current);
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [centerKey]);

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

    if (points.length > 1 && !boundsFittedRef.current) {
      try {
        map.fitBounds(points, { padding: [48, 48], maxZoom: 15, animate: false });
        boundsFittedRef.current = true;
      } catch {
        /* ignore bounds errors */
      }
    }
  }, [markersKey, centerKey, label, centerType]);

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
