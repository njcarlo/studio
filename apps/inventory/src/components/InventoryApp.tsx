'use client';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { BorrowingsPage } from './BorrowingsPage';
import { Categories } from './Categories';
import { StockLogs } from './StockLogs';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { LoginScreen } from './LoginScreen';
import { Package } from 'lucide-react';

const queryClient = new QueryClient();

function AppRoutes() {
    const { user, profile, isLoading, signOut } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center',
                justifyContent: 'center', backgroundColor: 'var(--background)',
                flexDirection: 'column', gap: '1rem',
            }}>
                <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4f6ef7, #3b5bdb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Package size={22} color="#fff" />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
            </div>
        );
    }

    if (!user) return <LoginScreen />;

    // Worker exists but has no inventory permission at all
    if (profile && !profile.canAccess && !profile.canManage) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center',
                justifyContent: 'center', backgroundColor: 'var(--background)',
                flexDirection: 'column', gap: '1rem', padding: '2rem',
            }}>
                <div style={{ fontSize: '2rem' }}>🔒</div>
                <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Access Denied</h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '360px' }}>
                    You don't have permission to access the Inventory module.
                    Contact your administrator to request the <strong>Inventory Officer</strong> role.
                </p>
                <button className="btn btn-outline" onClick={signOut}>Sign Out</button>
            </div>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Dashboard />} />
                <Route path="/borrowings" element={<BorrowingsPage />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/logs" element={<StockLogs />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Layout>
    );
}

export function InventoryApp() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}
