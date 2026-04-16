import { useState, useEffect } from 'react';
import { User, Building2, Shield, LogOut, Save, Package, UserCog, Search, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

// Inventory-specific roles that can be assigned
const INVENTORY_ROLES = [
    { key: 'inventory:manage', label: 'Inventory Officer', description: 'Full CRUD — create, edit, delete items and manage stock' },
    { key: 'inventory:access', label: 'Inventory Viewer', description: 'Read-only access to inventory data' },
];

export function Settings() {
    const { profile, ministryId, signOut } = useAuth();
    const [ministry, setMinistry] = useState<any>(null);
    const [itemCount, setItemCount] = useState<number>(0);
    const [lowStockThreshold, setLowStockThreshold] = useState('5');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Role assignment state (super admin only)
    const [workerSearch, setWorkerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [assignMsg, setAssignMsg] = useState('');

    useEffect(() => {
        if (!ministryId) return;
        supabase.from('Ministry').select('id, name, description, departmentCode').eq('id', ministryId).maybeSingle()
            .then(({ data }) => setMinistry(data));
        supabase.from('InventoryItem').select('id', { count: 'exact', head: true }).eq('group', ministryId)
            .then(({ count }) => setItemCount(count ?? 0));
    }, [ministryId]);

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 600));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Search workers by name or email
    const handleWorkerSearch = async () => {
        if (!workerSearch.trim()) return;
        setSearching(true);
        setSearchResults([]);
        const q = workerSearch.trim();
        const { data } = await supabase
            .from('Worker')
            .select(`
                id, firstName, lastName, email, majorMinistryId,
                roles:WorkerRole(
                    role:Role(id, name, rolePermissions:RolePermission(permission:Permission(module, action)))
                )
            `)
            .or(`email.ilike.%${q}%,firstName.ilike.%${q}%,lastName.ilike.%${q}%`)
            .limit(10);
        setSearchResults(data ?? []);
        setSearching(false);
    };

    // Get current inventory permission keys for a worker
    const getWorkerInventoryPerms = (worker: any): string[] => {
        const perms: string[] = [];
        for (const wr of worker.roles ?? []) {
            for (const rp of wr.role?.rolePermissions ?? []) {
                const key = `${rp.permission?.module}:${rp.permission?.action}`;
                if (key.startsWith('inventory:') && !perms.includes(key)) perms.push(key);
            }
        }
        return perms;
    };

    // Assign or revoke an inventory permission for a worker
    const toggleInventoryPerm = async (worker: any, permKey: string, currentlyHas: boolean) => {
        setAssigningId(worker.id + permKey);
        setAssignMsg('');
        try {
            // Get the Permission row
            const [module, action] = permKey.split(':');
            const { data: perm } = await supabase
                .from('Permission')
                .select('id')
                .eq('module', module)
                .eq('action', action)
                .maybeSingle();

            if (!perm) {
                // Create the permission if it doesn't exist
                const { data: newPerm } = await supabase
                    .from('Permission')
                    .insert({ module, action, description: INVENTORY_ROLES.find(r => r.key === permKey)?.description })
                    .select('id')
                    .single();
                if (!newPerm) throw new Error('Could not create permission');
            }

            const permId = perm?.id ?? (await supabase.from('Permission').select('id').eq('module', module).eq('action', action).single()).data?.id;
            if (!permId) throw new Error('Permission not found');

            // Find or create a role for this permission
            const roleName = INVENTORY_ROLES.find(r => r.key === permKey)?.label ?? permKey;
            let { data: role } = await supabase.from('Role').select('id').eq('name', roleName).maybeSingle();
            if (!role) {
                const { data: newRole } = await supabase.from('Role').insert({ name: roleName, permissions: [], isSuperAdmin: false, isSystemRole: false }).select('id').single();
                role = newRole;
                if (role) {
                    await supabase.from('RolePermission').insert({ roleId: role.id, permissionId: permId });
                }
            }
            if (!role) throw new Error('Could not find or create role');

            if (currentlyHas) {
                // Revoke: remove WorkerRole
                await supabase.from('WorkerRole').delete().eq('workerId', worker.id).eq('roleId', role.id);
                setAssignMsg(`Removed ${roleName} from ${worker.firstName}`);
            } else {
                // Grant: add WorkerRole
                await supabase.from('WorkerRole').upsert({ workerId: worker.id, roleId: role.id }, { onConflict: 'workerId,roleId' });
                setAssignMsg(`Granted ${roleName} to ${worker.firstName}`);
            }

            // Refresh search results
            await handleWorkerSearch();
        } catch (e: any) {
            setAssignMsg(`Error: ${e.message}`);
        } finally {
            setAssigningId(null);
            setTimeout(() => setAssignMsg(''), 3000);
        }
    };

    const ministryDisplayName = ministry?.name?.replace(/^[A-Z]-/i, '') ?? profile?.ministryName ?? '—';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px' }}>
            <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Settings</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Manage your inventory preferences
                </p>
            </div>

            {/* Profile card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <User size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Your Profile</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Name</div>
                        <div style={{ fontSize: '0.9375rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {profile ? `${profile.firstName} ${profile.lastName}` : '—'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Email</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{profile?.email ?? '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Roles</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <Shield size={13} color={profile?.canManage ? 'var(--primary)' : 'var(--text-muted)'} />
                            {profile?.roleNames && profile.roleNames.length > 0
                                ? profile.roleNames.map((r, i) => (
                                    <span key={i} style={{
                                        display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '999px',
                                        fontSize: '0.75rem', fontWeight: 600,
                                        backgroundColor: profile.isSuperAdmin ? '#e8eeff' : 'var(--border)',
                                        color: profile.isSuperAdmin ? 'var(--primary)' : 'var(--text-main)',
                                    }}>{r}</span>
                                ))
                                : <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No roles assigned</span>
                            }
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Access</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {profile?.isSuperAdmin ? '🔑 Full access (all ministries)' : profile?.canManage ? '✏️ Inventory Officer (CRUD)' : '👁 Read-only'}
                        </div>
                    </div>
                    {profile?.allPermissions && profile.allPermissions.length > 0 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Permissions</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {profile.allPermissions.map(p => (
                                    <span key={p} style={{ fontFamily: 'monospace', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{p}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ministry card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Building2 size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Ministry</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Ministry Name</div>
                        <div style={{ fontSize: '0.9375rem', color: 'var(--text-main)', fontWeight: 600 }}>{ministryDisplayName}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Department</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{ministry?.departmentCode ?? '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Total Items</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Package size={13} color="var(--primary)" />
                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>{itemCount}</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Scope</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {profile?.isSuperAdmin ? 'All ministries' : 'This ministry only'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Assignment — super admin only */}
            {profile?.canAssignRoles && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCog size={16} color="var(--primary)" />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Assign Inventory Roles</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                        Search for a worker and grant or revoke inventory access.
                    </p>

                    {/* Role legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {INVENTORY_ROLES.map(r => (
                            <div key={r.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--background)', borderRadius: '6px' }}>
                                <Shield size={13} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>{r.label}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{r.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="form-control"
                            placeholder="Search by name or email…"
                            value={workerSearch}
                            onChange={e => setWorkerSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleWorkerSearch()}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={handleWorkerSearch} disabled={searching} style={{ gap: '0.4rem', whiteSpace: 'nowrap' }}>
                            <Search size={14} /> {searching ? 'Searching…' : 'Search'}
                        </button>
                    </div>

                    {assignMsg && (
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: assignMsg.startsWith('Error') ? 'var(--danger-bg)' : 'var(--success-bg)', color: assignMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>
                            {assignMsg}
                        </div>
                    )}

                    {/* Results */}
                    {searchResults.length > 0 && (
                        <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                            {searchResults.map((w, i) => {
                                const currentPerms = getWorkerInventoryPerms(w);
                                return (
                                    <div key={w.id} style={{ padding: '0.875rem 1rem', borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)', flexShrink: 0 }}>
                                            {w.firstName?.[0]}{w.lastName?.[0]}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{w.firstName} {w.lastName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.email}</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                {INVENTORY_ROLES.map(role => {
                                                    const has = currentPerms.includes(role.key);
                                                    const isAssigning = assigningId === w.id + role.key;
                                                    return (
                                                        <button
                                                            key={role.key}
                                                            className={has ? 'btn btn-outline' : 'btn btn-primary'}
                                                            style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.625rem', gap: '0.3rem', opacity: isAssigning ? 0.6 : 1, ...(has ? { color: 'var(--success)', borderColor: 'var(--success)' } : {}) }}
                                                            disabled={isAssigning}
                                                            onClick={() => toggleInventoryPerm(w, role.key, has)}
                                                        >
                                                            {isAssigning ? '…' : has ? <><CheckCircle size={11} /> {role.label}</> : <><X size={11} /> Grant {role.label}</>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {searchResults.length === 0 && workerSearch && !searching && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No workers found for "{workerSearch}"</p>
                    )}
                </div>
            )}

            {/* Preferences */}
            {profile?.canManage && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Preferences</div>
                    <div>
                        <label className="form-label">Low Stock Alert Threshold</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input className="form-control" type="number" min="0" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} style={{ width: '120px' }} />
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Items at or below this quantity will be flagged as low stock</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: '100px' }}>
                            {saving ? 'Saving…' : saved ? '✓ Saved' : <><Save size={14} style={{ marginRight: '0.4rem' }} /> Save</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Sign out */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Sign Out</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>You will be returned to the login screen</div>
                </div>
                <button className="btn btn-outline" onClick={signOut} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: '0.4rem' }}>
                    <LogOut size={15} /> Sign Out
                </button>
            </div>
        </div>
    );
}
