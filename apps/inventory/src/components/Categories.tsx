import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Save, Tags } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useAuth } from '../lib/auth-context';
import { createCategory, updateCategory } from '../lib/inventory-api';
import { supabase } from '../lib/supabase';

const COLOR_OPTIONS = [
    '#3b5bdb', '#2f9e44', '#e67700', '#c92a2a', '#862e9c',
    '#1098ad', '#d6336c', '#495057', '#f59f00', '#0ca678',
];

const ICON_OPTIONS = ['📦', '🔧', '💡', '🖥️', '📋', '🎨', '🔌', '📷', '🎵', '🏷️'];

interface CategoryForm {
    name: string;
    description: string;
    color: string;
    icon: string;
    group: string;
}

const EMPTY_FORM: CategoryForm = { name: '', description: '', color: '#3b5bdb', icon: '📦', group: '' };

export function Categories() {
    const { categories, fetchCategories } = useInventory();
    const { ministryId, profile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const openAdd = () => {
        setForm({ ...EMPTY_FORM, group: ministryId ?? '' });
        setEditingId(null);
        setError('');
        setShowModal(true);
    };

    const openEdit = (cat: any) => {
        setForm({
            name: cat.name ?? '',
            description: cat.description ?? '',
            color: cat.color ?? '#3b5bdb',
            icon: cat.icon ?? '📦',
            group: cat.group ?? ministryId ?? '',
        });
        setEditingId(cat.id);
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Category name is required.'); return; }
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await updateCategory(editingId, { name: form.name, description: form.description, color: form.color, icon: form.icon });
            } else {
                await createCategory({ name: form.name, description: form.description, color: form.color, icon: form.icon, group: form.group });
            }
            await fetchCategories();
            setShowModal(false);
        } catch (e: any) {
            setError(e.message || 'Failed to save category.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category? Items using it will lose their category.')) return;
        setDeletingId(id);
        try {
            await supabase.from('InventoryCategory').update({ isActive: false }).eq('id', id);
            await fetchCategories();
        } finally {
            setDeletingId(null);
        }
    };

    const canManage = profile?.canManage ?? false;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Categories</h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Organise inventory items by category
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={openAdd} style={{ gap: '0.4rem' }}>
                        <Plus size={15} /> Add Category
                    </button>
                )}
            </div>

            {/* Grid */}
            {categories.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Tags size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600 }}>No categories yet</p>
                    <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Add a category to start organising your inventory.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                    {categories.map((cat: any) => (
                        <div key={cat.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    backgroundColor: cat.color ? `${cat.color}20` : '#e8eeff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.25rem', flexShrink: 0,
                                }}>
                                    {cat.icon || '📦'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {cat.name}
                                    </div>
                                    {cat.description && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {cat.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {canManage && (
                                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.625rem' }}>
                                    <button className="btn btn-outline" style={{ flex: 1, height: '30px', fontSize: '0.8rem', padding: '0' }} onClick={() => openEdit(cat)}>
                                        <Pencil size={13} style={{ marginRight: '0.3rem' }} /> Edit
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ height: '30px', width: '30px', padding: '0', color: 'var(--danger)', borderColor: 'var(--danger)', opacity: deletingId === cat.id ? 0.5 : 1 }}
                                        onClick={() => handleDelete(cat.id)}
                                        disabled={deletingId === cat.id}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                                {editingId ? 'Edit Category' : 'Add Category'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div style={{ padding: '0.625rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8125rem' }}>
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="form-label">Name *</label>
                                <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Audio Equipment" autoFocus />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <input className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                            </div>
                            <div>
                                <label className="form-label">Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {COLOR_OPTIONS.map(c => (
                                        <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                                            style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, border: form.color === c ? '3px solid var(--text-main)' : '2px solid transparent', cursor: 'pointer' }} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Icon</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {ICON_OPTIONS.map(ic => (
                                        <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                                            style={{ width: '36px', height: '36px', borderRadius: '8px', fontSize: '1.25rem', border: form.icon === ic ? '2px solid var(--primary)' : '1px solid var(--border)', background: form.icon === ic ? 'var(--primary-light)' : 'var(--surface)', cursor: 'pointer' }}>
                                            {ic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving…' : <><Save size={14} style={{ marginRight: '0.4rem' }} /> Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
