'use client';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { BorrowingsPage } from './BorrowingsPage';
import { Categories } from './Categories';
import { StockLogs } from './StockLogs';
import { Reports } from './Reports';
import { Settings } from './Settings';

const queryClient = new QueryClient();

export function InventoryApp() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
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
            </BrowserRouter>
        </QueryClientProvider>
    );
}
