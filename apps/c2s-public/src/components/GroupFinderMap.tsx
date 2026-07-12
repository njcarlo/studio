"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@studio/ui";
import { MapPin, Calendar, Users } from "lucide-react";

export type MapGroup = {
  id: string;
  name: string;
  location?: string | null;
  meetingSchedule?: string | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  mapLng?: number | null;
  mapLat?: number | null;
};

const DASMARINAS_CENTER: [number, number] = [14.3294, 120.9367];

function pinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const AVAILABLE_ICON = pinIcon("#ec4899");
const SELECTED_ICON = pinIcon("#14b8a6");

function FlyToSelected({ pins, selectedGroupId }: { pins: MapGroup[]; selectedGroupId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedGroupId) return;
    const pin = pins.find((p) => p.id === selectedGroupId);
    if (pin?.mapLat != null && pin?.mapLng != null) {
      map.flyTo([pin.mapLat, pin.mapLng], Math.max(map.getZoom(), 14), { duration: 0.5 });
    }
  }, [selectedGroupId, pins, map]);
  return null;
}

export function GroupFinderMap({
  groups,
  selectedGroupId,
  onSelectGroup,
  onJoin,
}: {
  groups: MapGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onJoin: (group: MapGroup) => void;
}) {
  const pins = groups.filter((g) => g.mapLng != null && g.mapLat != null);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Dasmariñas City</h3>
          <p className="text-xs text-muted-foreground">{pins.length} C2S groups nearby</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
          <MapPin className="h-3.5 w-3.5" /> Live Map
        </span>
      </div>

      <div className="relative flex-1 min-h-[420px]">
        <MapContainer
          center={DASMARINAS_CENTER}
          zoom={13}
          scrollWheelZoom={false}
          className="absolute inset-0 h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToSelected pins={pins} selectedGroupId={selectedGroupId} />
          {pins.map((g) => {
            const selected = selectedGroupId === g.id;
            return (
              <Marker
                key={g.id}
                position={[g.mapLat as number, g.mapLng as number]}
                icon={selected ? SELECTED_ICON : AVAILABLE_ICON}
                eventHandlers={{ click: () => onSelectGroup(selected ? null : g.id) }}
              >
                <Popup>
                  <div className="space-y-2 min-w-[180px]">
                    <p className="font-semibold text-gray-900">{g.name}</p>
                    {g.location && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {g.location}
                      </p>
                    )}
                    {g.meetingSchedule && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> {g.meetingSchedule}
                      </p>
                    )}
                    {(g.ageRangeMin || g.ageRangeMax) && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> Ages {g.ageRangeMin ?? "?"}-{g.ageRangeMax ?? "?"}
                      </p>
                    )}
                    <Button size="sm" className="w-full bg-brand text-brand-foreground hover:opacity-90" onClick={() => onJoin(g)}>
                      Join C2S Group
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-pink-500" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-500" /> Selected
        </span>
      </div>
    </div>
  );
}
