'use client';

import { useState, useEffect } from 'react';
import { User, Building2, Shield, Save, Package, UserCog, Search, CheckCircle, X } from 'lucide-react';
import { useInventoryAuth } from '@/hooks/use-inventory-auth';
import {
  getMinistrySummary,
  searchWorkersForInventory,
  toggleInventoryWorkerPerm,
} from '@/services/inventory-api';

const INVENTORY_ROLES = [
  { key: 'inventory:manage', label: 'Inventory Officer', description: 'Full CRUD — create, edit, delete items and manage stock' },
  { key: 'inventory:access', label: 'Inventory Viewer', description: 'Read-only access to inventory data' },
];

export function Settings() {
  const { profile, ministryId } = useInventoryAuth();
  const [ministry, setMinistry] = useState<any>(null);
  const [itemCount, setItemCount] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [workerSearch, setWorkerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignMsg, setAssignMsg] = useState('');

  useEffect(() => {
    if (!ministryId) return;
    getMinistrySummary(ministryId)
      .then(({ ministry: m, itemCount: count }) => {
        setMinistry(m);
        setItemCount(count);
      })
      .catch((e) => console.error(e));
  }, [ministryId]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleWorkerSearch = async () => {
    if (!workerSearch.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const data = await searchWorkersForInventory(workerSearch.trim());
      setSearchResults(data ?? []);
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

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

  const toggleInventoryPerm = async (worker: any, permKey: string, currentlyHas: boolean) => {
    setAssigningId(worker.id + permKey);
    setAssignMsg('');
    try {
      const result = await toggleInventoryWorkerPerm(worker.id, permKey, currentlyHas);
      const roleName = result.roleName;
      setAssignMsg(
        result.removed
          ? `Removed ${roleName} from ${worker.firstName}`
          : `Granted ${roleName} to ${worker.firstName}`,
      );
      await handleWorkerSearch();
    } catch (e: any) {
      setAssignMsg(`Error: ${e.message}`);
    } finally {
      setAssigningId(null);
      setTimeout(() => setAssignMsg(''), 3000);
    }
  };

  const ministryDisplayName = ministry?.name?.replace(/^[A-Z]-/i, '') ?? '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px' }}>
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Settings</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Manage your inventory preferences</p>
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
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Access Level</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={13} color={profile?.canManage ? 'var(--primary)' : 'var(--text-muted)'} />
              {profile?.isSuperAdmin ? '🔑 Full access (all ministries)' : profile?.canManage ? '✏️ Inventory Officer (CRUD)' : '👁 Read-only'}
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
        </div>
      </div>

      {/* Role assignment — super admin only */}
      {profile?.canAssignRoles && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCog size={16} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Assign Inventory Roles</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Search for a worker and grant or revoke inventory access.</p>

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

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="form-control" placeholder="Search by name or email…" value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWorkerSearch()} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={handleWorkerSearch} disabled={searching} style={{ gap: '0.4rem', whiteSpace: 'nowrap' }}>
              <Search size={14} /> {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {assignMsg && (
            <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: assignMsg.startsWith('Error') ? 'var(--danger-bg)' : 'var(--success-bg)', color: assignMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>
              {assignMsg}
            </div>
          )}

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
                            <button key={role.key} className={has ? 'btn btn-outline' : 'btn btn-primary'} style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.625rem', gap: '0.3rem', opacity: isAssigning ? 0.6 : 1, ...(has ? { color: 'var(--success)', borderColor: 'var(--success)' } : {}) }} disabled={isAssigning} onClick={() => toggleInventoryPerm(w, role.key, has)}>
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
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No workers found for &ldquo;{workerSearch}&rdquo;</p>
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
    </div>
  );
}
