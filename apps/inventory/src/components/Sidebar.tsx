import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Package,
  LayoutDashboard,
  Tags,
  History,
  FileText,
  Settings,
  Menu,
  X,
  Briefcase,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
  { icon: Briefcase, label: 'Borrowings', id: 'borrowings', path: '/borrowings' },
  { icon: Tags, label: 'Categories', id: 'categories', path: '/categories' },
  { icon: History, label: 'Stock Logs', id: 'logs', path: '/logs' },
  { icon: FileText, label: 'Reports', id: 'reports', path: '/reports' },
  { icon: Settings, label: 'Settings', id: 'settings', path: '/settings' },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.75rem', paddingLeft: '0.25rem' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f6ef7, #3b5bdb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Package size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1a1a2e', letterSpacing: '-0.01em' }}>
          Inventory
        </span>

        {/* Close button – mobile only */}
        <button
          className="sidebar-close-btn icon-btn"
          onClick={() => setMobileOpen(false)}
          style={{ border: 'none', marginLeft: 'auto' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              style={{ textDecoration: 'none' }}
              className={({ isActive }: { isActive: boolean }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Avatar at bottom */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e5ea',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        paddingLeft: '0.25rem'
      }}>
        <div style={{
          width: '34px', height: '34px',
          borderRadius: '50%',
          backgroundColor: '#d1d5db',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.8125rem', color: '#374151',
          flexShrink: 0
        }}>
          JD
        </div>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a2e' }}>John Doe</div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Admin</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar">
        {navContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-btn icon-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        style={{ border: 'none' }}
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`app-sidebar mobile-sidebar ${mobileOpen ? 'mobile-sidebar-open' : ''}`}>
        {navContent}
      </aside>
    </>
  );
}
