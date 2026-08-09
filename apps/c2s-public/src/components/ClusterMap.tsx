'use client';

import { useEffect, useRef } from 'react';

export interface ClusterMapGroup {
    id: string;
    name: string;
    barangay: string;
    type: 'Community-based' | 'Church-based';
    members: number;
    capacity: number;
    mentor: string;
    status: string;
    lat: number;
    lng: number;
}

interface Props {
    groups: ClusterMapGroup[];
    accentColor?: string; // defaults to '#0b9b8a'
}

// Dasmariñas City, Cavite barangay approximate coords
// Center: 14.3294, 120.9367
export const DASMARIÑAS_GROUPS: ClusterMapGroup[] = [
    {
        id: 'cg1', name: 'Orchard Residences', barangay: 'Burol',
        type: 'Community-based', members: 5, capacity: 12,
        mentor: 'Juan Dela Cruz', status: 'Open',
        lat: 14.3450, lng: 120.9280,
    },
    {
        id: 'cg2', name: 'DBB-B', barangay: 'Paliparan III',
        type: 'Church-based', members: 4, capacity: 11,
        mentor: 'Pedro Santos', status: 'Open',
        lat: 14.3380, lng: 120.9520,
    },
    {
        id: 'cg3', name: 'Greenfields 1', barangay: 'Sampaloc I',
        type: 'Community-based', members: 3, capacity: 7,
        mentor: 'Maria Reyes', status: 'Open',
        lat: 14.3180, lng: 120.9400,
    },
    {
        id: 'cg4', name: 'Salitran Heights', barangay: 'Salitran III',
        type: 'Community-based', members: 10, capacity: 10,
        mentor: 'Lena Santos', status: 'Full',
        lat: 14.3320, lng: 120.9200,
    },
    {
        id: 'cg5', name: 'Emmanuel Homes', barangay: 'Emmanuel Bergado I',
        type: 'Community-based', members: 6, capacity: 10,
        mentor: 'Ana Lim', status: 'Open',
        lat: 14.3550, lng: 120.9350,
    },
    {
        id: 'cg6', name: 'Fatima Sector', barangay: 'Fatima I',
        type: 'Church-based', members: 8, capacity: 10,
        mentor: 'Carmen Villanueva', status: 'Open',
        lat: 14.3480, lng: 120.9450,
    },
];

export default function ClusterMap({ groups, accentColor = '#0b9b8a' }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const LRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());

    useEffect(() => {
        if (!containerRef.current) return;
        let destroyed = false;

        const container = containerRef.current as any;
        if (container._leaflet_id) {
            container._leaflet_id = undefined;
        }

        import('leaflet').then((L) => {
            if (destroyed || !containerRef.current) return;
            const el = containerRef.current as any;
            if (el._leaflet_id) return;

            delete (L.Icon.Default.prototype as any)._getIconUrl;

            const map = L.map(containerRef.current, {
                center: [14.3294, 120.9367],
                zoom: 13,
                zoomControl: true,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            mapRef.current = map;
            LRef.current = L;

            groups.forEach((g) => addMarker(L, map, g, accentColor, markersRef));
        });

        return () => {
            destroyed = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                LRef.current = null;
                markersRef.current.clear();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-render markers when groups change (e.g. filter toggle)
    useEffect(() => {
        const map = mapRef.current;
        const L = LRef.current;
        if (!map || !L) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();

        groups.forEach((g) => addMarker(L, map, g, accentColor, markersRef));
    }, [groups, accentColor]);

    return <div ref={containerRef} className="w-full h-full" />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function markerSvg(color: string, count: number) {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
  </filter>
  <path d="M20 1C10.059 1 2 9.059 2 19c0 13.5 18 31 18 31S38 32.5 38 19C38 9.059 29.941 1 20 1z"
        fill="${color}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
  <circle cx="20" cy="18" r="10" fill="white" fill-opacity="0.95"/>
  <text x="20" y="23" text-anchor="middle" font-size="11" font-weight="800"
        font-family="system-ui,sans-serif" fill="${color}">${count}</text>
</svg>`;
}

function popupHtml(g: ClusterMapGroup) {
    const pct = Math.round((g.members / g.capacity) * 100);
    const typeColor = g.type === 'Community-based' ? '#0b9b8a' : '#1971c2';
    const statusColor = g.status === 'Open' ? '#166534' : g.status === 'Full' ? '#92400e' : '#6b7280';
    const statusBg    = g.status === 'Open' ? '#dcfce7' : g.status === 'Full' ? '#fef9c3' : '#f3f4f6';
    return `
<div style="font-family:system-ui,sans-serif;min-width:200px;padding:4px 0">
  <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:6px;line-height:1.2">${g.name}</div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;background:${typeColor}22;color:${typeColor}">${g.type}</span>
    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;background:${statusBg};color:${statusColor}">${g.status}</span>
  </div>
  <div style="font-size:11px;color:#6b7280;margin-bottom:3px">
    📍 <strong style="color:#374151">${g.barangay}</strong>
  </div>
  <div style="font-size:11px;color:#6b7280;margin-bottom:8px">
    👤 Mentor: <strong style="color:#374151">${g.mentor}</strong>
  </div>
  <div style="margin-bottom:4px">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;margin-bottom:3px">
      <span>Members</span><span style="font-weight:600;color:#374151">${g.members} / ${g.capacity}</span>
    </div>
    <div style="height:6px;background:#e5e7eb;border-radius:9999px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${pct >= 100 ? '#e67700' : '#0b9b8a'};border-radius:9999px"></div>
    </div>
  </div>
</div>`;
}

function addMarker(
    L: any,
    map: any,
    g: ClusterMapGroup,
    accentColor: string,
    markersRef: React.MutableRefObject<Map<string, any>>
) {
    const color = g.type === 'Church-based' ? '#1971c2' : accentColor;

    const icon = L.divIcon({
        html: markerSvg(color, g.members),
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -54],
        className: '',
    });

    const marker = L.marker([g.lat, g.lng], { icon, title: g.name });

    marker.bindPopup(popupHtml(g), {
        closeButton: true,
        className: 'cluster-map-popup',
        maxWidth: 260,
        offset: [0, -2],
    });

    marker.on('click', () => marker.openPopup());
    marker.addTo(map);
    markersRef.current.set(g.id, marker);
}
