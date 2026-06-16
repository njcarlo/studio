import './inventory.css';

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="inv-root" style={{ padding: '1.25rem', minHeight: '100%', backgroundColor: 'var(--background)' }}>
            {children}
        </div>
    );
}
