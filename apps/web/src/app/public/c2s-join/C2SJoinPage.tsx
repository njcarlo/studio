"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@studio/ui";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Input } from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import { cn } from "@studio/ui";
import { Search, MapPin, Calendar, Users, LoaderCircle } from "lucide-react";
import { getTenantConfig } from "@studio/core-engine/tenant";
import { getPublicC2SGroups } from "@/actions/c2s";
import { JoinGroupDialog, type JoinGroup } from "./JoinGroupDialog";

const GroupFinderMap = dynamic(
  () => import("./GroupFinderMap").then((m) => m.GroupFinderMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border bg-white shadow-sm flex items-center justify-center h-full min-h-[420px]">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
  },
);

const ALL = "all";

/** Approximate color treatment for a tag based on the mockup's badge palette. */
function tagClassName(tag: string): string {
  if (/^new$/i.test(tag)) return "bg-amber-100 text-amber-700 border-transparent";
  if (/single|men only|women only/i.test(tag)) return "bg-pink-100 text-pink-700 border-transparent";
  if (/couples|college|young adults|youth/i.test(tag)) return "bg-teal-100 text-teal-700 border-transparent";
  return "bg-gray-100 text-gray-700 border-transparent";
}

function isNew(createdAt: unknown): boolean {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt as string);
  if (isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 1000 * 60 * 60 * 24 * 30;
}

export default function C2SJoinPage() {
  const tenant = getTenantConfig();
  const { data: groups, isLoading } = useQuery({
    queryKey: ["public-c2s-groups"],
    queryFn: async () => {
      const res = await getPublicC2SGroups();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState(ALL);
  const [meetupDay, setMeetupDay] = useState(ALL);
  const [barangay, setBarangay] = useState(ALL);
  const [demographic, setDemographic] = useState(ALL);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [joinGroup, setJoinGroup] = useState<JoinGroup | null>(null);

  const ageGroupOptions = useMemo(
    () => Array.from(new Set((groups ?? []).map((g) => g.ageGroupLabel).filter((v): v is string => !!v))),
    [groups],
  );
  const meetupDayOptions = useMemo(
    () => Array.from(new Set((groups ?? []).map((g) => g.meetupDay).filter((v): v is string => !!v))),
    [groups],
  );
  const barangayOptions = useMemo(
    () => Array.from(new Set((groups ?? []).map((g) => g.location).filter((v): v is string => !!v))),
    [groups],
  );
  const demographicOptions = useMemo(
    () => Array.from(new Set((groups ?? []).flatMap((g) => g.demographics ?? []))),
    [groups],
  );

  const filteredGroups = useMemo(() => {
    return (groups ?? []).filter((g) => {
      if (search.trim()) {
        const haystack = `${g.name} ${g.location ?? ""}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      if (ageGroup !== ALL && g.ageGroupLabel !== ageGroup) return false;
      if (meetupDay !== ALL && g.meetupDay !== meetupDay) return false;
      if (barangay !== ALL && g.location !== barangay) return false;
      if (demographic !== ALL && !(g.demographics ?? []).includes(demographic)) return false;
      return true;
    });
  }, [groups, search, ageGroup, meetupDay, barangay, demographic]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-3">
          <img src={tenant.logoUrl || "/cog-logo.png"} alt={tenant.brandName} className="h-10 w-10" />
          <div>
            <p className="font-bold text-gray-900 leading-tight">{tenant.brandName}</p>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">Connect2Souls</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="space-y-3">
          <Badge className="bg-teal-100 text-teal-700 border-transparent">Find your community</Badge>
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-2 flex-wrap">
            <span className="flex items-baseline">
              <span className="text-rose-500">C</span>
              <span className="text-teal-500">2</span>
              <span className="text-amber-500">S</span>
            </span>
            <span>Group Finder</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Discover a Connect2Souls group near you in Dasmariñas City — built for real
            friendships, growth in faith, and a place to belong.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search C2S Group, Barangay, or Subdivision"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Age Group
                </label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {ageGroupOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Meetup Day
                </label>
                <Select value={meetupDay} onValueChange={setMeetupDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {meetupDayOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Barangay/Subdivision
                </label>
                <Select value={barangay} onValueChange={setBarangay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {barangayOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Demographics
                </label>
                <Select value={demographic} onValueChange={setDemographic}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {demographicOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{filteredGroups.length} groups found</p>
                <p className="text-sm text-muted-foreground">Tap a card to see it on the map</p>
              </div>

              {filteredGroups.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-muted-foreground">
                  No groups match your search. Try different filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredGroups.map((group) => {
                    const selected = selectedGroupId === group.id;
                    return (
                      <Card
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        className={cn(
                          "cursor-pointer transition-shadow hover:shadow-md",
                          selected && "ring-2 ring-teal-400"
                        )}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {isNew(group.createdAt) && (
                              <Badge className={tagClassName("New")}>New</Badge>
                            )}
                            {group.ageGroupLabel && (
                              <Badge className={tagClassName(group.ageGroupLabel)}>{group.ageGroupLabel}</Badge>
                            )}
                            {(group.demographics ?? []).map((tag) => (
                              <Badge key={tag} className={tagClassName(tag)}>{tag}</Badge>
                            ))}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {group.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" /> {group.location}
                              </div>
                            )}
                            {(group.meetingSchedule || group.meetupDay) && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" /> {group.meetingSchedule || group.meetupDay}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              size="sm"
                              className="bg-rose-500 hover:bg-rose-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setJoinGroup({ id: group.id, name: group.name, location: group.location });
                              }}
                            >
                              Join C2S Group
                            </Button>
                            {(group.ageRangeMin || group.ageRangeMax) && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" /> Ages {group.ageRangeMin ?? "?"}-{group.ageRangeMax ?? "?"}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-1 lg:sticky lg:top-6">
              <GroupFinderMap
                groups={filteredGroups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
                onJoin={(g) => setJoinGroup({ id: g.id, name: g.name, location: g.location })}
              />
            </div>
          </div>
        )}
      </main>

      <JoinGroupDialog group={joinGroup} onOpenChange={(open) => !open && setJoinGroup(null)} />
    </div>
  );
}
