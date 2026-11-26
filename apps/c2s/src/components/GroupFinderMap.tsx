'use client';

import { useEffect, useRef } from 'react';
import type { C2SGroup } from '@/lib/data';
import { C2S_PIN_COLORS, createC2SMapIcon } from '@/components/C2SMapPin';

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

function makeIcon(L: any, selected: boolean) {
    return createC2SMapIcon(L, selected ? C2S_PIN_COLORS.accent : C2S_PIN_COLORS.primary);
}

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function pinDetailsHtml(group: C2SGroup, footerText?: string, footerColor = '#047857') {
    const isOpen = group.status === 'Open';
    const statusBg = isOpen ? '#dcfce7' : '#f3f4f6';
    const statusColor = isOpen ? '#047857' : '#6b7280';

    return `
        <div style="font-family:Inter,system-ui,sans-serif;min-width:190px;padding:1px 0">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.02em;padding:2px 8px;border-radius:9999px;background:#f0fdf4;color:#065f46;border:1px solid #bbf7d0">${escapeHtml(group.ageGroup)}</span>
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;background:${statusBg};color:${statusColor}">${escapeHtml(group.status)}</span>
            </div>
            <div style="font-size:14.5px;font-weight:800;color:#0f172a;line-height:1.25;margin-bottom:6px">${escapeHtml(group.name)}</div>
            <div style="display:flex;flex-direction:column;gap:4px">
                <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#475569;line-height:1.35">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#047857" style="flex-shrink:0">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span>${escapeHtml(group.location)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#047857;font-weight:600;line-height:1.35">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#047857" style="flex-shrink:0">
                        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                    </svg>
                    <span>${escapeHtml(group.schedule)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#64748b;line-height:1.35">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#64748b" style="flex-shrink:0">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                    <span>${escapeHtml(group.ageRange)} · Led by ${escapeHtml(group.leader)}</span>
                </div>
            </div>
            ${footerText ? `
                <div style="margin-top:8px;padding-top:6px;border-top:1px solid #f1f5f9;font-size:11px;font-weight:600;color:${footerColor};display:flex;align-items:center;justify-content:space-between">
                    <span>${escapeHtml(footerText)}</span>
                    <span style="opacity:0.8">→</span>
                </div>
            ` : ''}
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
        alt: group.name,
    });

    marker.bindTooltip(
        pinDetailsHtml(
            group,
            selected ? 'Selected group' : 'Click pin to view group',
            selected ? '#0b9b8a' : '#047857'
        ),
        {
            direction: 'top',
            offset: [0, -2],
            opacity: 1,
            className: 'c2s-tooltip',
        }
    );

    marker.bindPopup(pinDetailsHtml(group), {
        closeButton: false,
        className: 'c2s-popup',
        maxWidth: 265,
        offset: [0, -2],
    });

    marker.on('tooltipopen', () => {
        if (marker.isPopupOpen()) {
            marker.closeTooltip();
        }
    });

    marker.on('popupopen', () => {
        marker.closeTooltip();
    });

    marker.on('click', () => {
        marker.closeTooltip();
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
