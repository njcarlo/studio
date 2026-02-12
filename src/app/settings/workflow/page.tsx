"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { writeBatch, doc, collection, query, orderBy } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { LoaderCircle, PlusCircle, GitBranch, Info } from "lucide-react";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase, useUser } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { WorkflowState, WorkflowTransition } from "@/lib/types";
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';


export default function WorkflowSettingsPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data for Workflow
    const workflowStatesRef = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "workflows", "default_workflow", "states"), orderBy('order'));
    }, [firestore, user]);
    const { data: workflowStates, isLoading: statesLoading } = useCollection<WorkflowState>(workflowStatesRef);

    const workflowTransitionsRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "workflows", "default_workflow", "transitions");
    }, [firestore, user]);
    const { data: workflowTransitions, isLoading: transitionsLoading } = useCollection<WorkflowTransition>(workflowTransitionsRef);

    // React Flow State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    
    // Effect to populate React Flow nodes and edges from Firestore data
    useEffect(() => {
        if (workflowStates && workflowTransitions) {
            const initialNodes: Node[] = workflowStates.map(state => ({
                id: state.id,
                position: { x: state.order * 220, y: 100 },
                data: { label: state.name },
                type: ['open', 'approved', 'rejected'].includes(state.id) ? (state.id === 'open' ? 'input' : 'output') : 'default',
            }));
            setNodes(initialNodes);

            const initialEdges: Edge[] = workflowTransitions.map(trans => ({
                id: trans.id,
                source: trans.fromStateId,
                target: trans.toStateId,
                label: `${trans.name} (${(trans.allowedRoles || []).join(', ') || 'any'})`,
                type: 'smoothstep',
                animated: true,
            }));
            setEdges(initialEdges);
        }
    }, [workflowStates, workflowTransitions, setNodes, setEdges]);


    // --- React Flow Handlers ---
    const onConnect = useCallback(async (params: Connection | Edge) => {
        const name = prompt("Enter transition action name (e.g., Approve):");
        if (name && params.source && params.target) {
            const rolesStr = prompt("Enter allowed role IDs, comma-separated (e.g., admin,department_head). Leave blank for anyone.");
            const allowedRoles = rolesStr ? rolesStr.split(',').map(r => r.trim()).filter(Boolean) : [];
            const newTransition = { name, fromStateId: params.source, toStateId: params.target, workflowId: 'default_workflow', allowedRoles };
            try {
                const docRef = await addDocumentNonBlocking(collection(firestore, "workflows", "default_workflow", "transitions"), newTransition);
                if (docRef) {
                    toast({ title: "Transition Added" });
                }
            } catch (e) {
                 toast({ variant: "destructive", title: "Error", description: "Could not add transition." });
            }
        }
    }, [firestore, toast]);

    const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (['open', 'approved', 'rejected'].includes(node.id)) {
            toast({ variant: 'destructive', title: 'Core states cannot be renamed.' });
            return;
        }
        const newName = prompt("Enter new state name:", node.data.label);
        if (newName && newName !== node.data.label) {
            updateDocumentNonBlocking(doc(firestore, "workflows", "default_workflow", "states", node.id), { name: newName });
            toast({ title: "State Renamed" });
        }
    }, [firestore, toast]);
    
    const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        const transition = workflowTransitions?.find(t => t.id === edge.id);
        if (!transition) return;

        const newName = prompt("Enter new transition name:", transition.name);
        const newRolesStr = prompt("Enter allowed roles (comma-separated):", (transition.allowedRoles || []).join(','));
        
        if (newName) {
            const newRoles = newRolesStr ? newRolesStr.split(',').map(r => r.trim()).filter(Boolean) : [];
            updateDocumentNonBlocking(doc(firestore, "workflows", "default_workflow", "transitions", edge.id), { name: newName, allowedRoles: newRoles });
            toast({ title: "Transition Updated" });
        }
    }, [firestore, toast, workflowTransitions]);

    const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
        const batch = writeBatch(firestore);
        for (const node of deletedNodes) {
            if (['open', 'approved', 'rejected'].includes(node.id)) {
                toast({ variant: 'destructive', title: 'Cannot Delete Core State' });
                setNodes((nodes) => [...nodes, node]);
                continue;
            }
            batch.delete(doc(firestore, "workflows", "default_workflow", "states", node.id));

            const connectedTransitions = workflowTransitions?.filter(t => t.fromStateId === node.id || t.toStateId === node.id) || [];
            for (const trans of connectedTransitions) {
                batch.delete(doc(firestore, "workflows", "default_workflow", "transitions", trans.id));
            }
        }
        try {
            await batch.commit();
            toast({ title: "State(s) and connections deleted." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete state(s)." });
        }
    }, [firestore, toast, workflowTransitions, setNodes]);
    
    const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
        const batch = writeBatch(firestore);
        for (const edge of deletedEdges) {
           batch.delete(doc(firestore, "workflows", "default_workflow", "transitions", edge.id));
        }
        try {
            await batch.commit();
            toast({ title: "Transition(s) deleted." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete transition(s)." });
        }
    }, [firestore, toast]);

    const handleAddState = async () => {
        const name = prompt("Enter new state name:");
        if (!name) return;

        const maxOrder = workflowStates ? workflowStates.reduce((max, state) => Math.max(max, state.order), 0) : 0;
        const newOrder = maxOrder + 1;
        
        const newStateData = { name, order: newOrder, workflowId: 'default_workflow' };

        try {
            const docRef = await addDocumentNonBlocking(collection(firestore, "workflows", "default_workflow", "states"), newStateData);
             if (docRef?.id) {
                toast({ title: "State Added", description: `The state "${name}" has been added.` });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Could not add state." });
        }
    };


    const isLoading = isRoleLoading || isUserLoading || statesLoading || transitionsLoading;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!user || !isSuperAdmin) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }
    
    if (!workflowStates || workflowStates.length === 0) {
        return (
          <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Workflow Not Configured</CardTitle>
                    <CardDescription>
                        The approval workflow system has not been initialized. Please go to the main settings page and run the system initializer to create the default workflow. The flowchart editor will become active once the default workflow exists.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/settings">Go to Settings</Link>
                    </Button>
                </CardContent>
            </Card>
          </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <Card className="bg-blue-50 border-blue-200">
                     <CardHeader className="flex flex-row items-start gap-4">
                        <Info className="h-6 w-6 text-blue-600 mt-1"/>
                        <div>
                            <CardTitle className="text-blue-900">Editing Default Workflow</CardTitle>
                            <CardDescription className="text-blue-800">
                                You are currently editing the 'Default Approval Workflow'. Changes made here will affect all modules that use it. All changes are saved automatically.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline flex items-center gap-2"><GitBranch className="h-5 w-5"/>Workflow Editor</CardTitle>
                            <CardDescription>A visual editor for your approval process. Your changes are saved automatically.</CardDescription>
                        </div>
                        <Button size="sm" onClick={handleAddState}><PlusCircle className="h-4 w-4 mr-2" />Add State</Button>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside bg-muted/50 p-4 rounded-md mb-4 text-sm space-y-1">
                            <li><b>Add State</b>: Click the 'Add State' button.</li>
                            <li><b>Rename State</b>: Double-click any state node. Core states (Open, Approved, Rejected) cannot be renamed.</li>
                            <li><b>Delete State</b>: Select a state and press the 'delete' or 'backspace' key. Core states cannot be deleted.</li>
                            <li><b>Add Transition</b>: Drag a connection from the edge of one state to another.</li>
                            <li><b>Edit Transition</b>: Double-click an arrow/transition to edit its name or allowed roles.</li>
                            <li><b>Delete Transition</b>: Select a transition arrow and press the 'delete' or 'backspace' key.</li>
                        </ul>
                        <div className="w-full h-[70vh] rounded-lg border bg-background">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onNodesDelete={onNodesDelete}
                                onEdgesDelete={onEdgesDelete}
                                onNodeDoubleClick={onNodeDoubleClick}
                                onEdgeDoubleClick={onEdgeDoubleClick}
                                fitView
                                proOptions={{ hideAttribution: true }}
                            >
                                <Background />
                                <Controls />
                                <MiniMap />
                            </ReactFlow>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
