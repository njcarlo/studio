'use client';

import { useEffect, useRef } from 'react';
import type { C2SGroup } from '@/lib/data';

interface Props {
    groups: C2SGroup[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function GroupFinderMap({ groups, selectedId, onSelect }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);       // leaflet map instance
    const LRef = useRef<any>(null);         // leaflet lib reference
    const markersRef = useRef<Map<string, any>>(new Map());

    /* ── Init map ONCE ── */
    useEffect(() => {
        if (!containerRef.current) return;

        // Guard: if leaflet already initialised this container, remove it first
        const container = containerRef.current as any;
        if (container._leaflet_id) {
            container._leaflet_id = undefined;
        }

        let destroyed = false;

        import('leaflet').then((L) => {
            if (destroyed || !containerRef.current) return;

            // Prevent double-init after HMR
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
                attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
                maxZoom: 18,
            }).addTo(map);

            mapRef.current = map;
            LRef.current = L;

            // Add initial markers
            groups.forEach((g) => addMarker(L, map, g, g.id === selectedId, onSelect, markersRef));
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

    /* ── Sync markers when groups / selectedId changes ── */
    useEffect(() => {
        const map = mapRef.current;
        const L = LRef.current;
        if (!map || !L) return;

        // Remove existing markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();

        // Re-add
        groups.forEach((g) => addMarker(L, map, g, g.id === selectedId, onSelect, markersRef));

        // Pan + open popup for selected
        if (selectedId) {
            const group = groups.find((g) => g.id === selectedId);
            if (group) {
                map.setView([group.lat, group.lng], Math.max(map.getZoom(), 14), { animate: true });
                const marker = markersRef.current.get(selectedId);
                if (marker) marker.openPopup();
            }
        }
    }, [selectedId, groups]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            ref={containerRef}
            className="w-full h-full rounded-xl overflow-hidden"
        />
    );
}

/* ─── Helpers ─────────────────────────────────────────────── */

function pinSvg(color: string) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`;
}

function makeIcon(L: any, selected: boolean) {
    return L.divIcon({
        html: pinSvg(selected ? '#0b9b8a' : '#e91e8c'),
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -38],
        className: '',
    });
}

function popupHtml(group: C2SGroup) {
    return `
        <div style="font-family:system-ui,sans-serif;min-width:180px;padding:2px 0">
            <div style="font-size:15px;font-weight:900;color:#111827;margin-bottom:4px">${group.name}</div>
            <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:#6b7280;margin-bottom:3px">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#e91e8c">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                ${group.location}
            </div>
            <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:#e91e8c;font-weight:600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#e91e8c">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                </svg>
                ${group.schedule}
            </div>
        </div>`;
}

function addMarker(
    L: any,
    map: any,
    group: C2SGroup,
    selected: boolean,
    onSelect: (id: string) => void,
    markersRef: React.MutableRefObject<Map<string, any>>
) {
    const marker = L.marker([group.lat, group.lng], {
        icon: makeIcon(L, selected),
        title: group.name,
    });

    marker.bindPopup(popupHtml(group), {
        closeButton: false,
        className: 'c2s-popup',
        maxWidth: 240,
        offset: [0, -2],
    });

    marker.on('click', () => {
        onSelect(group.id);
        marker.openPopup();
    });

    if (selected) {
        marker.addTo(map);
        marker.openPopup();
    } else {
        marker.addTo(map);
    }

    markersRef.current.set(group.id, marker);
}
