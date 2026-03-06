'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * UI store — holds lightweight global UI state that doesn't belong
 * in a server-side data store or per-component local state.
 *
 * Good candidates: sidebar open/closed, active filters that need to
 * be shared across routes, global loading overlays.
 */
export interface UIState {
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        (set) => ({
            isSidebarOpen: true,

            setSidebarOpen: (open) =>
                set({ isSidebarOpen: open }, false, 'ui/setSidebarOpen'),

            toggleSidebar: () =>
                set((s) => ({ isSidebarOpen: !s.isSidebarOpen }), false, 'ui/toggleSidebar'),
        }),
        { name: 'UIStore' }
    )
);
