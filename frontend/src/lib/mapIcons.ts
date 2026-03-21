// src/lib/mapIcons.ts
import L from 'leaflet'

export const proMarker = L.divIcon({
  className: '',
  html: `<div style="
    background:#10b981;
    width:14px;height:14px;
    border-radius:50%;
    border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,0.4)
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export const standardMarker = L.divIcon({
  className: '',
  html: `<div style="
    background:#f97316;
    width:14px;height:14px;
    border-radius:50%;
    border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,0.4)
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export const userMarker = L.divIcon({
  className: '',
  html: `<div style="
    background:#3b82f6;
    width:16px;height:16px;
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 1px 6px rgba(59,130,246,0.6)
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})