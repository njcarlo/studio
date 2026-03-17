import { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { X } from 'lucide-react';

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
  });

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
      });
    } else {
      setFormData({
        name: '',
        categoryId: '',
        type: 'Equipment',
        stock: 0,
        status: 'In Stock',
        locationId: '',
      });
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            {item ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="icon-btn" style={{ border: 'none', width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="modal-body">

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

              <Field label="Status">
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </Field>
            </div>

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
