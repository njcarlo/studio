
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { writeBatch, doc, serverTimestamp, collection, query, orderBy } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { LoaderCircle, Shield, AlertTriangle, PlusCircle, Trash2, Save, GanttChartSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore, useDoc, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useUser } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { Role, WorkflowState, WorkflowTransition } from "@/lib/types";
import { allPermissions, type Permission } from "@/lib/permissions";
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

export default function SettingsPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Check if the admin role exists to determine if seeding is needed.
    const adminRoleRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'roles', 'admin');
    }, [firestore, user]);
    const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);
    
    // Data for Role Matrix
    const rolesRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "roles");
    }, [firestore, user]);
    const { data: roles, isLoading: rolesLoading } = useCollection<Role>(rolesRef);

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

    // State for inline role editing
    const [editableRoles, setEditableRoles] = useState<Role[]>([]);

    useEffect(() => {
        if (roles) {
            setEditableRoles(roles.sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [roles]);
    
    // Effect to populate React Flow nodes and edges from Firestore data
    useEffect(() => {
        if (workflowStates && workflowTransitions) {
            const initialNodes: Node[] = workflowStates.map(state => ({
                id: state.id,
                position: { x: state.order * 220, y: 100 },
                data: { label: state.name },
                type: ['pending', 'approved', 'rejected'].includes(state.id) ? 'input' : 'default',
            }));
            setNodes(initialNodes);

            const initialEdges: Edge[] = workflowTransitions.map(trans => ({
                id: trans.id,
                source: trans.fromStateId,
                target: trans.toStateId,
                label: trans.name,
                type: 'smoothstep',
                animated: true,
            }));
            setEdges(initialEdges);
        }
    }, [workflowStates, workflowTransitions, setNodes, setEdges]);


    // Role Matrix Handlers
    const handleRoleChange = (roleId: string, field: 'name' | 'privilege', value: any, privilegeKey?: Permission) => {
        setEditableRoles(currentRoles =>
            currentRoles.map(role => {
                if (role.id === roleId) {
                    if (field === 'name') {
                        return { ...role, name: value };
                    }
                    if (field === 'privilege' && privilegeKey) {
                        const newPrivileges = { ...role.privileges };
                        if (value) {
                            newPrivileges[privilegeKey] = true;
                        } else {
                            delete newPrivileges[privilegeKey];
                        }
                        return { ...role, privileges: newPrivileges };
                    }
                }
                return role;
            })
        );
    };

    const handleSaveRole = async (roleData: Role) => {
        const { id, ...data } = roleData;
        if (!data.name) {
            toast({ variant: 'destructive', title: 'Role name is required.' });
            return;
        }
        try {
            if (id.startsWith('new_')) {
                await addDocumentNonBlocking(collection(firestore, "roles"), data);
                toast({ title: "Role Added", description: `The "${data.name}" role has been created.` });
            } else {
                await updateDocumentNonBlocking(doc(firestore, "roles", id), data);
                toast({ title: "Role Updated", description: `The "${data.name}" role has been saved.` });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the role." });
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (id === 'admin') {
            toast({ variant: 'destructive', title: 'Cannot Delete Admin Role' });
            return;
        }
        if (id.startsWith('new_')) {
            setEditableRoles(currentRoles => currentRoles.filter(r => r.id !== id));
        } else {
            try {
                await deleteDocumentNonBlocking(doc(firestore, "roles", id));
                toast({ title: "Role Deleted" });
            } catch (error) {
                toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete role." });
            }
        }
    };

    const handleAddRoleRow = () => {
        const newId = `new_${Date.now()}`;
        setEditableRoles(currentRoles => [...currentRoles, { id: newId, name: '', privileges: {} }]);
    };
    
    // --- React Flow Handlers ---
    const onConnect = useCallback(async (params: Connection | Edge) => {
        const name = prompt("Enter transition action name (e.g., Approve):");
        if (name && params.source && params.target) {
            const newTransition = { name, fromStateId: params.source, toStateId: params.target, workflowId: 'default_workflow' };
            try {
                const docRef = await addDocumentNonBlocking(collection(firestore, "workflows", "default_workflow", "transitions"), newTransition);
                if (docRef) {
                    toast({ title: "Transition Added" });
                    setEdges((eds) => addEdge({ ...params, id: docRef.id, label: name, type: 'smoothstep', animated: true }, eds));
                }
            } catch (e) {
                 toast({ variant: "destructive", title: "Error", description: "Could not add transition." });
            }
        }
    }, [firestore, setEdges, toast]);

    const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (['pending', 'approved', 'rejected'].includes(node.id)) {
            toast({ variant: 'destructive', title: 'Core states cannot be renamed.' });
            return;
        }
        const newName = prompt("Enter new state name:", node.data.label);
        if (newName && newName !== node.data.label) {
            setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, label: newName } } : n));
            updateDocumentNonBlocking(doc(firestore, "workflows", "default_workflow", "states", node.id), { name: newName });
            toast({ title: "State Renamed" });
        }
    }, [setNodes, firestore, toast]);

    const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
        const batch = writeBatch(firestore);
        for (const node of deletedNodes) {
            if (['pending', 'approved', 'rejected'].includes(node.id)) {
                toast({ variant: 'destructive', title: 'Cannot Delete Core State' });
                // Re-add the node to the UI to prevent its deletion
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

    const handleAddState = () => {
        const name = prompt("Enter new state name:");
        if (!name) return;

        const maxOrder = workflowStates ? workflowStates.reduce((max, state) => Math.max(max, state.order), 0) : 0;
        const newOrder = maxOrder + 1;
        
        const newState = { name, order: newOrder, workflowId: 'default_workflow' };

        addDocumentNonBlocking(collection(firestore, "workflows", "default_workflow", "states"), newState).then(docRef => {
            if(docRef) toast({ title: "State Added", description: `Please refresh to see it in the flowchart.` });
        });
    };

    // System Initializer
    const initializeSystem = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Not Logged In" });
            return;
        }
        try {
            const batch = writeBatch(firestore);
            const rolesData = { admin: { name: 'Admin', privileges: { 'manage_users': true, 'manage_roles': true, 'manage_content': true, 'manage_approvals': true, 'operate_scanner': true, 'manage_meal_stubs': true, } }, editor: { name: 'Editor', privileges: { 'manage_content': true } }, viewer: { name: 'Viewer', privileges: {} } };
            for (const [roleId, roleData] of Object.entries(rolesData)) { batch.set(doc(firestore, 'roles', roleId), roleData); }
            batch.set(doc(firestore, 'users', user.uid), { roleId: 'admin', status: 'Active', }, { merge: true });
            const workflowId = "default_workflow";
            batch.set(doc(firestore, 'workflows', workflowId), { name: 'Default Approval Workflow', description: 'The standard workflow for all approval requests.' });
            const states = [ { id: 'pending', name: 'Pending', order: 1 }, { id: 'in_review', name: 'In Review', order: 2 }, { id: 'approved', name: 'Approved', order: 3 }, { id: 'rejected', name: 'Rejected', order: 4 }, ];
            for (const state of states) { batch.set(doc(firestore, `workflows/${workflowId}/states`, state.id), { name: state.name, order: state.order, workflowId: workflowId });}
            const transitions = [ { id: 'start_review', name: 'Start Review', from: 'pending', to: 'in_review' }, { id: 'approve', name: 'Approve', from: 'in_review', to: 'approved' }, { id: 'reject', name: 'Reject', from: 'in_review', to: 'rejected' }, ];
            for (const transition of transitions) { batch.set(doc(firestore, `workflows/${workflowId}/transitions`, transition.id), { name: transition.name, fromStateId: transition.from, toStateId: transition.to, workflowId: workflowId });}
            await batch.commit();
            toast({ title: "System Initialized", description: "Default roles and workflows have been created. Please refresh." });
        } catch (dbError: any) {
            toast({ variant: "destructive", title: "Database Seed Failed", description: "Could not seed the database." });
        }
    };

    const isLoading = isRoleLoading || isAdminRoleLoading || isUserLoading || rolesLoading || statesLoading || transitionsLoading;

    const needsSeeding = !adminRole && !isAdminRoleLoading;
    const canAccess = isSuperAdmin || needsSeeding;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!user) {
         return <AppLayout><Card><CardHeader><CardTitle>Not Logged In</CardTitle><CardDescription>You must be logged in to access this page.</CardDescription></CardHeader></Card></AppLayout>;
    }
    
    if (!canAccess) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">System Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage core application settings and user roles.</p>

            <div className="mt-4 space-y-6">
                 {needsSeeding && (
                    <Card className="border-amber-500 bg-amber-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle /> Initial Setup Required</CardTitle>
                            <CardDescription>
                                Your application has not been initialized. Click the button below to create the default roles and make your account the master administrator.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={initializeSystem} variant="default">Initialize System</Button>
                        </CardContent>
                    </Card>
                )}
                
                {isSuperAdmin && (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="font-headline">Role & Permission Matrix</CardTitle>
                                    <CardDescription>Add roles and assign privileges inline.</CardDescription>
                                </div>
                                <Button size="sm" onClick={handleAddRoleRow}><PlusCircle className="h-4 w-4 mr-2" />Add Role</Button>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px] sticky left-0 bg-card z-10 p-2">Role Name</TableHead>
                                            {allPermissions.map(permission => (
                                                <TableHead key={permission} className="p-2 text-center min-w-[110px]">
                                                    <span className="capitalize text-xs font-medium">{permission.replace(/manage_|operate_/g, '').replace(/_/g, ' ')}</span>
                                                </TableHead>
                                            ))}
                                            <TableHead className="w-[100px] sticky right-0 bg-card z-10 p-2 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableRoles?.map(role => (
                                            <TableRow key={role.id}>
                                                <TableCell className="p-2 font-medium sticky left-0 bg-card">
                                                    <Input
                                                        value={role.name}
                                                        onChange={e => handleRoleChange(role.id, 'name', e.target.value)}
                                                        disabled={role.id === 'admin'}
                                                        placeholder="New Role Name"
                                                        className="w-full h-9"
                                                    />
                                                </TableCell>
                                                {allPermissions.map(permission => (
                                                    <TableCell key={`${role.id}-${permission}`} className="p-2 text-center">
                                                        <Checkbox
                                                            checked={!!role.privileges?.[permission]}
                                                            onCheckedChange={(checked) => handleRoleChange(role.id, 'privilege', !!checked, permission)}
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="p-2 text-right sticky right-0 bg-card space-x-0">
                                                    <Button variant="ghost" size="icon" onClick={() => handleSaveRole(role)}><Save className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id)} disabled={role.id === 'admin'}><Trash2 className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="font-headline flex items-center gap-2"><GanttChartSquare className="h-5 w-5"/>Workflow Configuration</CardTitle>
                                    <CardDescription>Visually edit your approval workflow. Double-click states to rename, and drag between nodes to create transitions.</CardDescription>
                                </div>
                                <Button size="sm" onClick={handleAddState}><PlusCircle className="h-4 w-4 mr-2" />Add State</Button>
                            </CardHeader>
                            <CardContent>
                               <div className="w-full h-[600px] rounded-lg border bg-background">
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        onConnect={onConnect}
                                        onNodesDelete={onNodesDelete}
                                        onEdgesDelete={onEdgesDelete}
                                        onNodeDoubleClick={onNodeDoubleClick}
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Shield /> System Seed</CardTitle>
                                <CardDescription>
                                    This will create (or reset) the default user roles and approval workflow. This can be used to recover admin access or restore the default workflow.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={initializeSystem}>
                                    Initialize / Reset System
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}

            </div>
        </AppLayout>
    );
}
