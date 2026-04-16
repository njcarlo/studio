import { useState, useEffect } from 'react';
import { User, Building2, Shield, LogOut, Save, Package } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

export function Settings() {
    const { profile, ministryId, signOut } = useAuth();
    const [ministry, setMinistry] = useState<any>(null);
    const [itemCount, setItemCount] = useState<number>(0);
    const [lowStockThreshold, setLowStockThreshold] = useState('5');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!ministryId) return;
        // Load ministry info
        supabase.from('Ministry').select('id, name, description, departmentCode').eq('id', ministryId).maybeSingle()
            .then(({ data }) => setMinistry(data));
        // Count items for this ministry
        supabase.from('InventoryItem').select('id', { count: 'exact', head: true }).eq('group', ministryId)
            .then(({ count }) => setItemCount(count ?? 0));
    }, [ministryId]);

    const handleSave = async () => {
        setSaving(true);
        // In a real app, save settings to a ministry-specific settings table
        await new Promise(r => setTimeout(r, 600));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ministryDisplayName = ministry?.name?.replace(/^[A-Z]-/i, '') ?? profile?.ministryName ?? '—';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px' }}>
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
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Role</div>
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

            {/* Preferences */}
            {profile?.canManage && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Preferences</div>
                    <div>
                        <label className="form-label">Low Stock Alert Threshold</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                className="form-control"
                                type="number"
                                min="0"
                                value={lowStockThreshold}
                                onChange={e => setLowStockThreshold(e.target.value)}
                                style={{ width: '120px' }}
                            />
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                Items at or below this quantity will be flagged as low stock
                            </span>
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
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        You will be returned to the login screen
                    </div>
                </div>
                <button className="btn btn-outline" onClick={signOut} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: '0.4rem' }}>
                    <LogOut size={15} /> Sign Out
                </button>
            </div>
        </div>
    );
}
