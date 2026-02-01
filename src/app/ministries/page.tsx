"use client";

import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { workers, ministries } from "@/lib/placeholder-data";
import { HeartHandshake, User, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MinistriesPage() {
  const getWorker = (workerId: string) => workers.find(w => w.id === workerId);

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Ministries</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ministries.map(ministry => {
          const leader = getWorker(ministry.leaderId);
          const members = ministry.memberIds.map(getWorker).filter(Boolean);

          return (
            <Card key={ministry.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{ministry.name}</CardTitle>
                    <CardDescription>
                      <Badge variant={ministry.type === 'Primary' ? 'default' : 'secondary'}>
                        {ministry.type} Ministry
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{ministry.description}</p>
                
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Leader
                  </h4>
                  {leader ? (
                     <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={leader.avatarUrl} alt={leader.name} />
                            <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{leader.name}</p>
                            <p className="text-xs text-muted-foreground">{leader.role}</p>
                        </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No leader assigned.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                     <Users className="h-4 w-4" />
                    Members ({members.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      {members.map(member => member && (
                        <Tooltip key={member.id}>
                          <TooltipTrigger>
                             <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{member.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
