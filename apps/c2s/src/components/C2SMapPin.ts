export const C2S_PIN_COLORS = {
    primary: '#047857', // Default / Available / Community-based C2S Group Finder pin
    accent: '#0b9b8a',  // Selected / Church-based C2S Group Finder pin
} as const;

export function c2sPinHtml(color: string): string {
    return `<div class="inline-flex items-center justify-center origin-bottom transition-transform duration-200 hover:scale-110 cursor-pointer" style="width:40px;height:52px;filter:drop-shadow(0 4px 6px rgba(15,23,42,0.22));">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52" style="display:block;overflow:visible;">
            <path d="M20 1C10.059 1 2 9.059 2 19c0 13.5 18 31 18 31S38 32.5 38 19C38 9.059 29.941 1 20 1z"
                  fill="${color}" stroke="#ffffff" stroke-width="2.25"/>
            <circle cx="20" cy="18" r="11.5" fill="#ffffff"/>
            <image href="/c2s.png" x="11" y="9" width="18" height="18" preserveAspectRatio="xMidYMid meet" clip-path="circle(11.5px at 9px 9px)"/>
        </svg>
    </div>`;
}

export function createC2SMapIcon(L: any, color: string) {
    return L.divIcon({
        html: c2sPinHtml(color),
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -54],
        tooltipAnchor: [0, -54],
        className: '',
    });
}
