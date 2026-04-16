import { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadItemPhoto } from '../utils/upload';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSaved?: () => void;
}

// ✅ IMPORTANT: Field is defined OUTSIDE ItemModal to prevent React from treating
// it as a new component type on every render (which would unmount/remount inputs
// and lose keyboard focus after each keystroke).
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export function ItemModal({ isOpen, onClose, item, onSaved }: ItemModalProps) {
  const { categories, locations, fetchCategories, fetchLocations, createItem, updateItem } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    type: 'Equipment',
    stock: 0,
    status: 'In Stock',
    locationId: '',
    inventoryCode: '',
    imageUrl: '',
    isKit: false,
    isApprovalRequired: false,
    nextMaintenanceDate: '',
    aisle: '',
    shelf: '',
    bin: '',
    parentId: '',
  });

  const [kits, setKits] = useState<any[]>([]);

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
        type: item.type || 'Equipment',
        stock: item.stock || 0,
        status: item.status || 'In Stock',
        locationId: item.locationId || '',
        inventoryCode: item.inventoryCode || '',
        imageUrl: item.imageUrl || '',
        isKit: item.isKit || false,
        isApprovalRequired: item.isApprovalRequired || false,
        nextMaintenanceDate: item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toISOString().split('T')[0] : '',
        aisle: item.aisle || '',
        shelf: item.shelf || '',
        bin: item.bin || '',
        parentId: item.parentId || '',
      });
    } else {
      setFormData({
        name: '',
        categoryId: '',
        type: 'Equipment',
        stock: 0,
        status: 'In Stock',
        locationId: '',
        inventoryCode: '',
        imageUrl: '',
        isKit: false,
        isApprovalRequired: false,
        nextMaintenanceDate: '',
        aisle: '',
        shelf: '',
        bin: '',
        parentId: '',
      });
    }

    if (isOpen) {
      fetch('/api/inventory/items?isKit=true&take=100').then(r => r.json()).then(data => setKits((data.items || []).filter((k: any) => k.id !== item?.id))).catch(() => {});
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (item) {
        await updateItem(item.id, formData);
      } else {
        await createItem(formData);
      }
      if (onSaved) onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const url = await uploadItemPhoto(file);
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
      <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            {item ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="icon-btn" style={{ border: 'none', width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>

            {/* Photo Upload Area */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={32} color="#9ca3af" />
                )}
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
                <input
                  required
                  autoFocus
                  className="form-control"
                  placeholder="e.g. Dell XPS 15 Laptop"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </Field>

              <Field label="Inventory Code">
                <input
                  className="form-control"
                  placeholder="Auto-generated if empty"
                  value={formData.inventoryCode}
                  onChange={e => setFormData(prev => ({ ...prev, inventoryCode: e.target.value }))}
                />
              </Field>
            </div>

            <div className="form-row-2col">
              <Field label="Category">
                <select
                  required
                  className="form-control"
                  value={formData.categoryId}
                  onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Type">
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Equipment">Equipment</option>
                  <option value="Consumable">Consumable</option>
                </select>
              </Field>
            </div>

            <div className="form-row-2col">
              <Field label="Initial Stock">
                <input
                  type="text"
                  required min="0"
                  className="form-control"
                  value={formData.stock}
                  onChange={e => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                />
              </Field>

              <Field label="Location">
                <select
                  required
                  className="form-control"
                  value={formData.locationId}
                  onChange={e => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                >
                  <option value="">Select location</option>
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Granular Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Field label="Aisle">
                <input
                  className="form-control"
                  placeholder="e.g. A1"
                  value={formData.aisle}
                  onChange={e => setFormData(prev => ({ ...prev, aisle: e.target.value }))}
                />
              </Field>
              <Field label="Shelf">
                <input
                  className="form-control"
                  placeholder="e.g. S2"
                  value={formData.shelf}
                  onChange={e => setFormData(prev => ({ ...prev, shelf: e.target.value }))}
                />
              </Field>
              <Field label="Bin">
                <input
                  className="form-control"
                  placeholder="e.g. B3"
                  value={formData.bin}
                  onChange={e => setFormData(prev => ({ ...prev, bin: e.target.value }))}
                />
              </Field>
            </div>

            <div className="form-row-2col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isApprovalRequired}
                    onChange={e => setFormData(prev => ({ ...prev, isApprovalRequired: e.target.checked }))}
                  />
                  <span>High Value (Requires Approval)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isKit}
                    onChange={e => setFormData(prev => ({ ...prev, isKit: e.target.checked }))}
                  />
                  <span>Is Kit/Bundle</span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Parent Kit Assignment */}
                {!formData.isKit && (
                  <Field label="Assign to Parent Kit (Optional)">
                    <select
                      className="form-control"
                      value={formData.parentId}
                      onChange={e => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                    >
                      <option value="">No Parent Kit</option>
                      {kits.map((k: any) => (
                        <option key={k.id} value={k.id}>{k.name} ({k.inventoryCode || k.id.slice(0, 8)})</option>
                      ))}
                    </select>
                  </Field>
                )}

                {formData.type === 'Equipment' && (
                  <Field label="Next Maintenance Date (PMS)">
                    <input
                      type="date"
                      className="form-control"
                      value={formData.nextMaintenanceDate}
                      onChange={e => setFormData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                    />
                  </Field>
                )}
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : item ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
