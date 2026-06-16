'use client';

import { useState, useEffect } from 'react';
import { useInventory } from '@/hooks/use-inventory';
import { useInventoryAuth } from '@/hooks/use-inventory-auth';
import { X, Upload, Image as ImageIcon, Lock } from 'lucide-react';
import { uploadItemPhoto } from '@/utils/inventory-upload';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSaved?: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export function ItemModal({ isOpen, onClose, item, onSaved }: ItemModalProps) {
  const { ministryId, profile } = useInventoryAuth();
  const { categories, locations, fetchCategories, fetchLocations, createItem, updateItem } = useInventory(ministryId);
  const canSetCode = profile?.canSetCode ?? false;

  const blankForm = {
    name: '', categoryId: '', type: 'EQUIPMENT', quantity: 0, status: 'In Stock',
    location: '', inventoryCode: '', imageUrl: '', isApprovalRequired: false,
    aisle: '', shelf: '', bin: '',
  };

  const [formData, setFormData] = useState(blankForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categories.length === 0) fetchCategories();
      if (locations.length === 0) fetchLocations();
    }
  }, [isOpen, categories.length, locations.length, fetchCategories, fetchLocations]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        categoryId: item.categoryId || '',
        type: item.type || 'EQUIPMENT',
        quantity: item.quantity ?? 0,
        status: item.status || 'In Stock',
        location: item.location || '',
        inventoryCode: item.inventoryCode || '',
        imageUrl: item.imageUrl || '',
        isApprovalRequired: item.isApprovalRequired || false,
        aisle: item.aisle || '',
        shelf: item.shelf || '',
        bin: item.bin || '',
      });
    } else {
      setFormData(blankForm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        type: formData.type,
        quantity: formData.quantity,
        status: formData.status,
        location: formData.location,
        inventoryCode: formData.inventoryCode || undefined,
        imageUrl: formData.imageUrl || undefined,
        isApprovalRequired: formData.isApprovalRequired,
        aisle: formData.aisle || undefined,
        shelf: formData.shelf || undefined,
        bin: formData.bin || undefined,
      };
      if (item) {
        await updateItem(item.id, payload);
      } else {
        await createItem(payload);
      }
      if (onSaved) onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true);
    try {
      const url = await uploadItemPhoto(e.target.files[0], item?.id);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{item ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="icon-btn" style={{ border: 'none', width: '32px', height: '32px' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ overflowY: 'auto' }}>

            {/* Photo Upload */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {formData.imageUrl ? <img src={formData.imageUrl} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={32} color="#9ca3af" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Item Photo</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>Upload an image to easily identify this item.</div>
                <label className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.3rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', gap: '0.35rem' }}>
                  <Upload size={12} />
                  {uploadingImage ? 'Uploading...' : 'Choose File'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
            </div>

            <div className="form-row-2col">
              <Field label="Item Name">
                <input required autoFocus className="form-control" placeholder="e.g. Dell XPS 15 Laptop" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </Field>
              {(canSetCode || (item && item.inventoryCode)) && (
                <Field label="Inventory Code">
                  {canSetCode ? (
                    <input className="form-control" placeholder="Auto-generated if empty" value={formData.inventoryCode} onChange={e => setFormData(prev => ({ ...prev, inventoryCode: e.target.value }))} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', background: '#f3f4f6', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.85rem', fontFamily: 'monospace', color: '#6b7280' }}>
                      <Lock size={13} />{item?.inventoryCode || '—'}
                    </div>
                  )}
                </Field>
              )}
            </div>

            <div className="form-row-2col">
              <Field label="Category">
                <select required className="form-control" value={formData.categoryId} onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select className="form-control" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="CONSUMABLE">Consumable</option>
                </select>
              </Field>
            </div>

            <div className="form-row-2col">
              <Field label="Initial Quantity">
                <input type="number" required min="0" className="form-control" value={formData.quantity} onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} />
              </Field>
              <Field label="Location">
                <input className="form-control" placeholder="e.g. Storage Room A" value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Field label="Aisle"><input className="form-control" placeholder="A1" value={formData.aisle} onChange={e => setFormData(prev => ({ ...prev, aisle: e.target.value }))} /></Field>
              <Field label="Shelf"><input className="form-control" placeholder="S2" value={formData.shelf} onChange={e => setFormData(prev => ({ ...prev, shelf: e.target.value }))} /></Field>
              <Field label="Bin"><input className="form-control" placeholder="B3" value={formData.bin} onChange={e => setFormData(prev => ({ ...prev, bin: e.target.value }))} /></Field>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={formData.isApprovalRequired} onChange={e => setFormData(prev => ({ ...prev, isApprovalRequired: e.target.checked }))} />
              <span>High Value (Requires Approval to Borrow)</span>
            </label>

          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : item ? 'Save Changes' : 'Create Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
