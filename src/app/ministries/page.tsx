"use client";

import React from "react";
import { collection } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartHandshake, User as UserIcon, Users, LoaderCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import type { Ministry, User, Department } from "@/lib/types";

export default function MinistriesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const ministriesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "ministries");
  }, [firestore, user]);
  const { data: ministries, isLoading: ministriesLoading } = useCollection<Ministry>(ministriesRef);

  const usersRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "users");
  }, [firestore, user]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersRef);

  const getUser = (userId: string) => users?.find(w => w.id === userId);
  
  const isLoading = ministriesLoading || usersLoading;

  const departments: Department[] = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Ministries</h1>
      </div>
      
      {isLoading && (
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      )}

      <div className="space-y-8 mt-4">
        {!isLoading && departments.map(department => {
          const departmentMinistries = ministries?.filter(m => m.department === department);
          
          if (!departmentMinistries || departmentMinistries.length === 0) {
            return null;
          }

          return (
            <div key={department}>
              <h2 className="text-xl font-headline font-semibold mb-4 border-b pb-2">{department}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {departmentMinistries.map(ministry => {
                  const leader = getUser(ministry.leaderId);
                  const members = users?.filter(w => w.primaryMinistryId === ministry.id || w.secondaryMinistryId === ministry.id) || [];

                  return (
                    <Card key={ministry.id}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <HeartHandshake className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{ministry.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{ministry.description}</p>
                        
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <UserIcon className="h-4 w-4" />
                            Leader
                          </h4>
                          {leader ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={leader.avatarUrl} alt={`${leader.firstName} ${leader.lastName}`} />
                                    <AvatarFallback>{leader.firstName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{`${leader.firstName} ${leader.lastName}`}</p>
                                    <p className="text-xs text-muted-foreground">{leader.roleId}</p>
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
                                        <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                                        <AvatarFallback>{member.firstName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{`${member.firstName} ${member.lastName}`}</p>
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
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
