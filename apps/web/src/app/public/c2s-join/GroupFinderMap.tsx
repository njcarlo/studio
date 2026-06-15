"use client";

import { Popover, PopoverContent, PopoverTrigger, Button } from "@studio/ui";
import { MapPin, Calendar, Users } from "lucide-react";
import { cn } from "@studio/ui";

export type MapGroup = {
  id: string;
  name: string;
  location?: string | null;
  meetingSchedule?: string | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  mapX?: number | null;
  mapY?: number | null;
};

const MAP_LABELS = [
  { text: "DASMARIÑAS", x: 38, y: 8 },
  { text: "Paliparan", x: 84, y: 18 },
  { text: "San Agustin", x: 86, y: 64 },
  { text: "Salawag", x: 10, y: 90 },
];

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
  const pins = groups.filter((g) => g.mapX != null && g.mapY != null);

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

      <div className="relative flex-1 min-h-[420px] bg-teal-50/60 overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path
            d="M30,6 C55,2 82,10 90,28 C97,45 94,64 83,79 C70,94 48,98 32,90 C14,83 5,64 7,45 C9,26 17,12 30,6 Z"
            fill="#fde7c4"
            stroke="#f3d9a8"
            strokeWidth="0.5"
          />
          <path d="M5,55 C30,50 60,58 98,48" fill="none" stroke="#d9eef0" strokeWidth="0.6" />
          <path d="M48,2 C44,35 50,68 58,98" fill="none" stroke="#d9eef0" strokeWidth="0.6" />
        </svg>

        {MAP_LABELS.map((label) => (
          <span
            key={label.text}
            className="absolute -translate-x-1/2 text-[10px] font-semibold text-pink-400/80 tracking-wide whitespace-nowrap"
            style={{ left: `${label.x}%`, top: `${label.y}%` }}
          >
            {label.text}
          </span>
        ))}

        {pins.map((g) => {
          const selected = selectedGroupId === g.id;
          return (
            <Popover
              key={g.id}
              open={selected}
              onOpenChange={(open) => onSelectGroup(open ? g.id : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={g.name}
                  onClick={() => onSelectGroup(selected ? null : g.id)}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-full drop-shadow transition-transform hover:scale-110",
                    selected ? "text-teal-500" : "text-pink-500"
                  )}
                  style={{ left: `${g.mapX}%`, top: `${g.mapY}%` }}
                >
                  <MapPin className="h-7 w-7" fill="currentColor" stroke="white" strokeWidth={1.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-2">
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
                <Button size="sm" className="w-full bg-rose-500 hover:bg-rose-600" onClick={() => onJoin(g)}>
                  Join C2S Group
                </Button>
              </PopoverContent>
            </Popover>
          );
        })}
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
