import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, Download, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

// ── Column mapping from the spreadsheet format ────────────────────────────────
// Columns: Weight | Group | Category | Inventory Code | Items | Role |
//          Location | Assigned to | Purchase Date | Status Code | Status |
//          Status Details | Recommendation

interface ParsedRow {
    weight?: number;
    group?: string;
    category: string;
    inventoryCode?: string;
    name: string;
    role?: string;
    location?: string;
    assignedTo?: string;
    purchaseDate?: string;
    statusCode?: number;
    status?: string;
    statusDetails?: string;
    recommendation?: string;
}

interface ImportResult {
    total: number;
    imported: number;
    skipped: number;
    errors: string[];
}

// Map status code to status text
const STATUS_CODE_MAP: Record<number, string> = {
    1: 'Good Condition',
    2: 'For Repair',
    3: 'For Replacement',
    4: 'For Disposal',
    5: 'For PMS',
};

function parseRows(sheet: XLSX.WorkSheet): ParsedRow[] {
    // Get raw data as array of arrays to handle merged cells / header rows
    const raw = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

    // Find the header row — look for a row containing "Inventory Code" or "Items"
    let headerIdx = -1;
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
        const row = raw[i].map((c: any) => String(c).toLowerCase().trim());
        if (row.some(c => c.includes('inventory code') || c.includes('items'))) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) headerIdx = 0; // fallback: first row is header

    const headers = raw[headerIdx].map((h: any) => String(h).toLowerCase().trim());

    const col = (name: string) => {
        const idx = headers.findIndex(h => h.includes(name));
        return idx >= 0 ? idx : -1;
    };

    const colWeight = col('weight') !== -1 ? col('weight') : 0;
    const colGroup = col('group') !== -1 ? col('group') : 1;
    const colCategory = col('category') !== -1 ? col('category') : 2;
    const colCode = col('inventory code') !== -1 ? col('inventory code') : 3;
    const colName = col('items') !== -1 ? col('items') : (col('item') !== -1 ? col('item') : 4);
    const colRole = col('role') !== -1 ? col('role') : 5;
    const colLocation = col('location') !== -1 ? col('location') : 6;
    const colAssigned = col('assigned') !== -1 ? col('assigned') : 7;
    const colPurchase = col('purchase') !== -1 ? col('purchase') : 8;
    const colStatusCode = col('status code') !== -1 ? col('status code') : (col('status\ncode') !== -1 ? col('status\ncode') : 9);
    const colStatus = col('status') !== -1 ? col('status') : 10;
    const colStatusDetails = col('status details') !== -1 ? col('status details') : 11;
    const colRec = col('recommendation') !== -1 ? col('recommendation') : 12;

    const rows: ParsedRow[] = [];
    for (let i = headerIdx + 1; i < raw.length; i++) {
        const r = raw[i];
        const name = String(r[colName] ?? '').trim();
        const category = String(r[colCategory] ?? '').trim();
        if (!name && !category) continue; // skip empty rows

        const statusCodeRaw = parseInt(String(r[colStatusCode] ?? ''), 10);
        const statusCode = isNaN(statusCodeRaw) ? undefined : statusCodeRaw;

        // Parse purchase date — Excel serial or string
        let purchaseDate: string | undefined;
        const pdRaw = r[colPurchase];
        if (pdRaw) {
            if (typeof pdRaw === 'number') {
                // Excel serial date
                const d = XLSX.SSF.parse_date_code(pdRaw);
                if (d) purchaseDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
            } else {
                purchaseDate = String(pdRaw).trim() || undefined;
            }
        }

        rows.push({
            weight: parseInt(String(r[colWeight] ?? ''), 10) || undefined,
            group: String(r[colGroup] ?? '').trim() || undefined,
            category: category || 'Uncategorized',
            inventoryCode: String(r[colCode] ?? '').trim() || undefined,
            name: name || category,
            role: String(r[colRole] ?? '').trim() || undefined,
            location: String(r[colLocation] ?? '').trim() || undefined,
            assignedTo: String(r[colAssigned] ?? '').trim() || undefined,
            purchaseDate,
            statusCode,
            status: String(r[colStatus] ?? '').trim() || (statusCode ? STATUS_CODE_MAP[statusCode] : undefined),
            statusDetails: String(r[colStatusDetails] ?? '').trim() || undefined,
            recommendation: String(r[colRec] ?? '').trim() || undefined,
        });
    }
    return rows;
}

export function ImportPage() {
    const { ministryId, profile } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState('');
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

    const processFile = (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: 'array', cellDates: false });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = parseRows(sheet);
            setPreview(rows);
            setStep('preview');
            setResult(null);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFile = (file: File) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            alert('Please upload an Excel (.xlsx/.xls) or CSV file.');
            return;
        }
        processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleImport = async () => {
        if (!ministryId && !profile?.isSuperAdmin) return;
        setImporting(true);
        const res: ImportResult = { total: preview.length, imported: 0, skipped: 0, errors: [] };

        // Get or create categories
        const { data: existingCats } = await supabase.from('InventoryCategory').select('id, name');
        const catMap = new Map((existingCats ?? []).map((c: any) => [c.name.toLowerCase(), c.id]));

        for (const row of preview) {
            try {
                // Ensure category exists
                const catKey = row.category.toLowerCase();
                let categoryId = catMap.get(catKey);
                if (!categoryId) {
                    const { data: newCat } = await supabase
                        .from('InventoryCategory')
                        .insert({ name: row.category, isActive: true })
                        .select('id')
                        .single();
                    if (newCat) {
                        categoryId = newCat.id;
                        catMap.set(catKey, categoryId);
                    }
                }
                if (!categoryId) { res.skipped++; res.errors.push(`No category for: ${row.name}`); continue; }

                // Check for duplicate inventory code
                if (row.inventoryCode) {
                    const { data: existing } = await supabase
                        .from('InventoryItem')
                        .select('id')
                        .eq('inventoryCode', row.inventoryCode)
                        .maybeSingle();
                    if (existing) { res.skipped++; continue; }
                }

                const statusText = row.status || (row.statusCode ? STATUS_CODE_MAP[row.statusCode] : 'Good Condition');

                await supabase.from('InventoryItem').insert({
                    name: row.name,
                    categoryId,
                    inventoryCode: row.inventoryCode || null,
                    group: ministryId,
                    role: row.role || null,
                    location: row.location || null,
                    assignedTo: row.assignedTo || null,
                    purchaseDate: row.purchaseDate || null,
                    statusCode: row.statusCode || null,
                    status: statusText,
                    statusDetails: row.statusDetails || null,
                    recommendation: row.recommendation || null,
                    weight: row.weight || null,
                    quantity: 1,
                    type: 'EQUIPMENT',
                });
                res.imported++;
            } catch (e: any) {
                res.skipped++;
                res.errors.push(`${row.name}: ${e.message}`);
            }
        }

        setResult(res);
        setStep('done');
        setImporting(false);
    };

    const reset = () => {
        setStep('upload');
        setPreview([]);
        setFileName('');
        setResult(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const downloadTemplate = () => {
        const headers = ['Weight', 'Group', 'Category', 'Inventory Code', 'Items', 'Role', 'Location', 'Assigned to', 'Purchase Date', 'Status Code', 'Status', 'Status Details', 'Recommendation'];
        const sample = [
            [1, 'A', 'Camera', 'SCAM-01-001', 'Sony FX6 - 01', 'Main Sanc - Cam 1', 'Broadcast Room', 'Broadcast', '1/28/2026', 1, 'Good Condition', '', ''],
            [2, 'A', 'Lens', 'SLENS-01-001', 'Sony 16-35mm f4 - 01', 'Lens - Cam 1', 'Broadcast Room', 'Broadcast', '7/20/2021', 1, 'Good Condition', '', ''],
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
        XLSX.writeFile(wb, 'inventory-import-template.xlsx');
    };

    if (!profile?.canManage) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <p>You need Inventory Officer access to import data.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Import Inventory</h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Upload an Excel or CSV file matching the equipment inventory format
                    </p>
                </div>
                <button className="btn btn-outline" onClick={downloadTemplate} style={{ gap: '0.4rem', fontSize: '0.8125rem' }}>
                    <Download size={14} /> Download Template
                </button>
            </div>

            {/* Step: Upload */}
            {step === 'upload' && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '12px',
                        padding: '3rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: dragging ? 'var(--primary-light)' : 'var(--surface)',
                        transition: 'all 0.15s',
                    }}
                >
                    <FileSpreadsheet size={48} style={{ margin: '0 auto 1rem', color: dragging ? 'var(--primary)' : 'var(--text-muted)', opacity: 0.6 }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        Drop your Excel or CSV file here
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Supports .xlsx, .xls, .csv · Columns: Weight, Group, Category, Inventory Code, Items, Role, Location, Assigned to, Purchase Date, Status Code, Status, Status Details, Recommendation
                    </p>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                </div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileSpreadsheet size={20} color="var(--primary)" />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)' }}>{fileName}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{preview.length} rows detected</div>
                            </div>
                        </div>
                        <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>

                    {/* Preview table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background)', position: 'sticky', top: 0 }}>
                                        {['#', 'Category', 'Inventory Code', 'Item Name', 'Role', 'Location', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 100).map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.5rem 0.875rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                                            <td style={{ padding: '0.5rem 0.875rem', color: 'var(--text-main)' }}>{row.category}</td>
                                            <td style={{ padding: '0.5rem 0.875rem', fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.75rem' }}>{row.inventoryCode || '—'}</td>
                                            <td style={{ padding: '0.5rem 0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{row.name}</td>
                                            <td style={{ padding: '0.5rem 0.875rem', color: 'var(--text-muted)' }}>{row.role || '—'}</td>
                                            <td style={{ padding: '0.5rem 0.875rem', color: 'var(--text-muted)' }}>{row.location || '—'}</td>
                                            <td style={{ padding: '0.5rem 0.875rem' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                                                    backgroundColor: row.statusCode === 1 ? 'var(--success-bg)' : row.statusCode && row.statusCode > 1 ? 'var(--warning-bg)' : 'var(--border)',
                                                    color: row.statusCode === 1 ? 'var(--success)' : row.statusCode && row.statusCode > 1 ? 'var(--warning)' : 'var(--text-muted)',
                                                }}>
                                                    {row.status || (row.statusCode ? STATUS_CODE_MAP[row.statusCode] : 'Unknown')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {preview.length > 100 && (
                                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', borderTop: '1px solid var(--border)' }}>
                                    Showing first 100 of {preview.length} rows
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={reset}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleImport} disabled={importing} style={{ minWidth: '140px' }}>
                            {importing
                                ? <><Loader size={14} style={{ marginRight: '0.4rem', animation: 'spin 1s linear infinite' }} /> Importing…</>
                                : <><Upload size={14} style={{ marginRight: '0.4rem' }} /> Import {preview.length} Items</>
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* Step: Done */}
            {step === 'done' && result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CheckCircle size={28} color="var(--success)" />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Import Complete</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{fileName}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--success-bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>{result.imported}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Imported</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--warning-bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)' }}>{result.skipped}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>Skipped</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{result.total}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total</div>
                            </div>
                        </div>
                        {result.errors.length > 0 && (
                            <div style={{ backgroundColor: 'var(--danger-bg)', borderRadius: '8px', padding: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <AlertTriangle size={15} color="var(--danger)" />
                                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--danger)' }}>{result.errors.length} error{result.errors.length > 1 ? 's' : ''}</span>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                                    {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                                    {result.errors.length > 10 && <li>…and {result.errors.length - 10} more</li>}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={reset}>Import Another File</button>
                        <a href="/dashboard" className="btn btn-primary">View Inventory</a>
                    </div>
                </div>
            )}

            {/* Format guide */}
            {step === 'upload' && (
                <div className="card" style={{ fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Expected Column Format</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        {[
                            ['Weight', 'Row order number'],
                            ['Group', 'Group letter (A, B, etc.)'],
                            ['Category', 'e.g. Camera, Lens'],
                            ['Inventory Code', 'e.g. SCAM-01-001'],
                            ['Items', 'Item name/description'],
                            ['Role', 'Usage role'],
                            ['Location', 'Physical location'],
                            ['Assigned to', 'Person/team'],
                            ['Purchase Date', 'MM/DD/YYYY'],
                            ['Status Code', '1=Good, 2=Repair, 3=Replace, 4=Dispose, 5=PMS'],
                            ['Status', 'Status text (auto from code)'],
                            ['Status Details', 'Additional notes'],
                            ['Recommendation', 'Action recommended'],
                        ].map(([col, desc]) => (
                            <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{col}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
