'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SatelliteChurch {
    id: string;
    name: string;
    city?: string;
    code: string;
    barangay: string;
    address?: string;
    leader: string;
    contactNumber?: string;
    email?: string;
    status: 'Active' | 'Inactive';
    notes?: string;
}

export const INITIAL_SATELLITES: SatelliteChurch[] = [
    {
        id: 'sat-001',
        name: 'COG Dasmarinas',
        city: 'Dasmariñas City',
        code: 'COG-DASMA',
        barangay: 'Zone IV',
        address: 'Church of God Main Campus, Dasmariñas City',
        leader: 'Ptr. Anthony Velasco',
        contactNumber: '0917 100 0001',
        email: 'dasmarinas@cogdasmarinas.org',
        status: 'Active',
        notes: 'Main Central Campus',
    },
    {
        id: 'sat-002',
        name: 'COG Jabez',
        city: 'Dasmariñas City',
        code: 'COG-JABEZ',
        barangay: 'Sampaloc I',
        address: 'Jabez Christian Center, Dasmariñas City',
        leader: 'Ptr. Jonathan Cruz',
        contactNumber: '0917 100 0002',
        email: 'jabez@cogdasmarinas.org',
        status: 'Active',
        notes: 'Jabez Extension Hub',
    },
    {
        id: 'sat-003',
        name: 'COG Silang',
        city: 'Silang',
        code: 'COG-SILANG',
        barangay: 'Biga I',
        address: 'Silang Extension Chapel, Silang, Cavite',
        leader: 'Ptr. Daniel Santos',
        contactNumber: '0917 100 0003',
        email: 'silang@cogdasmarinas.org',
        status: 'Active',
        notes: 'Silang Upland Campus',
    },
    {
        id: 'sat-004',
        name: 'COG Trece',
        city: 'Trece Martires City',
        code: 'COG-TRECE',
        barangay: 'San Agustin',
        address: 'Trece Martires Provincial Chapel',
        leader: 'Ptr. Roberto Cruz',
        contactNumber: '0917 100 0004',
        email: 'trece@cogdasmarinas.org',
        status: 'Active',
        notes: 'Trece Provincial Satellite',
    },
    {
        id: 'sat-005',
        name: 'Orchard Residences Satellite',
        city: 'Dasmariñas City',
        code: 'ORCHARD-01',
        barangay: 'Burol Main',
        address: 'Orchard Residences, Block 3 Lot 5',
        leader: 'Juan Dela Cruz',
        contactNumber: '0917 123 4567',
        email: 'juan.dc@cogdasmarinas.org',
        status: 'Active',
        notes: 'Community extension satellite hub.',
    },
    {
        id: 'sat-006',
        name: 'Salitran Satellite',
        city: 'Dasmariñas City',
        code: 'SALITRAN-01',
        barangay: 'Salitran III',
        address: 'Salitran Central Hub',
        leader: 'Maria Santos',
        contactNumber: '0918 234 5678',
        email: 'salitran@cogdasmarinas.org',
        status: 'Active',
        notes: 'Salitran neighborhood satellite.',
    },
];

const STORAGE_KEY = 'c2s_satellite_churches_v2';

interface SatelliteContextType {
    satellites: SatelliteChurch[];
    activeSatellites: SatelliteChurch[];
    addSatellite: (satellite: Omit<SatelliteChurch, 'id'>) => SatelliteChurch;
    updateSatellite: (id: string, updates: Partial<SatelliteChurch>) => void;
    deleteSatellite: (id: string) => void;
    getSatelliteById: (id: string) => SatelliteChurch | undefined;
}

const SatelliteContext = createContext<SatelliteContextType | undefined>(undefined);

export function SatelliteProvider({ children }: { children: React.ReactNode }) {
    const [satellites, setSatellites] = useState<SatelliteChurch[]>(() => {
        if (typeof window === 'undefined') return INITIAL_SATELLITES;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {
            // fallback
        }
        return INITIAL_SATELLITES;
    });

    const persist = (data: SatelliteChurch[]) => {
        setSatellites(data);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                window.dispatchEvent(new Event('c2s_satellites_updated'));
            } catch {
                // ignore
            }
        }
    };

    useEffect(() => {
        const handleSync = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) setSatellites(parsed);
                }
            } catch {
                // ignore
            }
        };

        window.addEventListener('storage', handleSync);
        window.addEventListener('c2s_satellites_updated', handleSync);
        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('c2s_satellites_updated', handleSync);
        };
    }, []);

    const activeSatellites = satellites.filter(s => s.status === 'Active');

    const addSatellite = (satelliteData: Omit<SatelliteChurch, 'id'>): SatelliteChurch => {
        const newSat: SatelliteChurch = {
            ...satelliteData,
            id: `sat-${Date.now()}`,
        };
        const updated = [newSat, ...satellites];
        persist(updated);
        return newSat;
    };

    const updateSatellite = (id: string, updates: Partial<SatelliteChurch>) => {
        const updated = satellites.map(s => (s.id === id ? { ...s, ...updates } : s));
        persist(updated);
    };

    const deleteSatellite = (id: string) => {
        const updated = satellites.filter(s => s.id !== id);
        persist(updated);
    };

    const getSatelliteById = (id: string) => {
        return satellites.find(s => s.id === id);
    };

    return (
        <SatelliteContext.Provider
            value={{
                satellites,
                activeSatellites,
                addSatellite,
                updateSatellite,
                deleteSatellite,
                getSatelliteById,
            }}
        >
            {children}
        </SatelliteContext.Provider>
    );
}

export function useSatellites() {
    const context = useContext(SatelliteContext);
    if (!context) {
        throw new Error('useSatellites must be used within a SatelliteProvider');
    }
    return context;
}
