import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, ImageBackground, Modal, Platform,
    ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAdmin } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const CACHE_KEY = 'admin_users_cache';

type Tab = 'overview' | 'region' | 'barangay';

interface UserData {
    id: string;
    name?: string;
    email?: string;
    region?: string;
    subRegion?: string;
    barangay?: string;
    tractsGiven: number;
}

const REGION_LABELS: Record<string, string> = {
    NLR: 'North Luzon Region',
    SLR: 'South Luzon Region',
    MMR: 'Metro Manila Region',
    VIS: 'Visayas Region',
    MIN: 'Mindanao Region',
    'COG Dasmarinas': 'COG Dasmarinas',
};

function getLocationLabel(u: UserData): string {
    const regionLabel = REGION_LABELS[u.region || ''] || u.region || '—';
    if (u.barangay) return `${regionLabel} · ${u.barangay}`;
    return regionLabel;
}
    { id: '1', name: 'Juan Dela Cruz', email: 'juan@example.com', region: 'MMR', subRegion: 'Dasmarinas', barangay: 'Burol I', tractsGiven: 154 },
    { id: '2', name: 'Maria Clara', email: 'maria@example.com', region: 'MMR', subRegion: 'Dasmarinas', barangay: 'Salawag', tractsGiven: 89 },
    { id: '3', name: 'Jose Rizal', email: 'jose@example.com', region: 'NLR', subRegion: 'Others', barangay: '', tractsGiven: 320 },
    { id: '4', name: 'Andres Bonifacio', email: 'andres@example.com', region: 'SLR', subRegion: 'Others', barangay: '', tractsGiven: 45 },
    { id: '5', name: 'Emilio Aguinaldo', email: 'emilio@example.com', region: 'MMR', subRegion: 'Dasmarinas', barangay: 'Sampaloc I', tractsGiven: 210 },
];

export default function AdminDashboardScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [tab, setTab] = useState<Tab>('overview');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const usingMock = useRef(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('tract_users')
                .select('id, name, email, region, sub_region, barangay, tracts_given');
            if (error || !data || data.length === 0) throw new Error('No data');
            setUsers(data.map(d => ({
                id: d.id,
                name: d.name,
                email: d.email,
                region: d.region,
                subRegion: d.sub_region,
                barangay: d.barangay,
                tractsGiven: d.tracts_given ?? 0,
            })));
            usingMock.current = false;
        } catch {
            usingMock.current = true;
            setUsers(MOCK_USERS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const totalTracts = users.reduce((s, u) => s + u.tractsGiven, 0);

    // Group by region
    const byRegion = users.reduce<Record<string, number>>((acc, u) => {
        const key = u.region || 'Unknown';
        acc[key] = (acc[key] || 0) + u.tractsGiven;
        return acc;
    }, {});
    const regionRows = Object.entries(byRegion).sort((a, b) => b[1] - a[1]);

    // Group by barangay — only include users who have a barangay set
    const byBarangay = users.reduce<Record<string, number>>((acc, u) => {
        if (!u.barangay) return acc;
        acc[u.barangay] = (acc[u.barangay] || 0) + u.tractsGiven;
        return acc;
    }, {});
    const barangayRows = Object.entries(byBarangay).sort((a, b) => b[1] - a[1]);

    const handleReset = async () => {
        setShowResetConfirm(false);
        setResetting(true);
        try {
            if (usingMock.current) {
                await new Promise(r => setTimeout(r, 800));
                setUsers(prev => prev.map(u => ({ ...u, tractsGiven: 0 })));
            } else {
                const { error } = await supabaseAdmin
                    .from('tract_users')
                    .update({ tracts_given: 0 })
                    .in('id', users.map(u => u.id));
                if (error) throw error;
                await fetchData();
            }
        } catch (err) {
            if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to reset.');
            else console.error('Reset failed:', err);
        } finally {
            setResetting(false);
        }
    };

    const goBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Main');

    if (loading) {
        return (
            <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
                <View style={styles.overlay} />
                <SafeAreaView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#C9A84C" />
                    <Text style={styles.loadingText}>Loading…</Text>
                </SafeAreaView>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        Admin Dashboard{usingMock.current ? '  · DEMO' : ''}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('LiveBoard')} style={styles.resetBtn}>
                        <Ionicons name="tv-outline" size={24} color="#C9A84C" />
                    </TouchableOpacity>                </View>

                {/* Total */}
                <View style={styles.totalBlock}>
                    <Text style={styles.totalCount}>{totalTracts.toLocaleString()}</Text>
                    <Text style={styles.totalLabel}>Total Tracts Given Nationwide</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabBar}>
                    {(['overview', 'region', 'barangay'] as Tab[]).map(t => (
                        <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
                            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                                {t === 'overview' ? 'Users' : t === 'region' ? 'By Region' : 'By Barangay'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={styles.scroll}>
                    {tab === 'overview' && (
                        <View style={styles.card}>
                            <View style={styles.tableHead}>
                                <Text style={[styles.headCell, { flex: 2 }]}>Name</Text>
                                <Text style={[styles.headCell, { flex: 2 }]}>Location</Text>
                                <Text style={[styles.headCell, { flex: 1, textAlign: 'right' }]}>Tracts</Text>
                            </View>
                            {users.sort((a, b) => b.tractsGiven - a.tractsGiven).map((u, i) => (
                                <View key={u.id} style={[styles.row, i === users.length - 1 && styles.lastRow]}>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.rowName}>{u.name || 'Unknown'}</Text>
                                        <Text style={styles.rowSub}>{u.email || '—'}</Text>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.rowSub}>{getLocationLabel(u)}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <View style={[styles.badge, u.tractsGiven === 0 && styles.badgeZero]}>
                                            <Text style={[styles.badgeText, u.tractsGiven === 0 && styles.badgeTextZero]}>{u.tractsGiven}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {tab === 'region' && (
                        <View style={styles.card}>
                            <View style={styles.tableHead}>
                                <Text style={[styles.headCell, { flex: 2 }]}>Region</Text>
                                <Text style={[styles.headCell, { flex: 1 }]}>Users</Text>
                                <Text style={[styles.headCell, { flex: 1, textAlign: 'right' }]}>Tracts</Text>
                            </View>
                            {regionRows.map(([region, count], i) => {
                                const userCount = users.filter(u => (u.region || 'Unknown') === region).length;
                                const pct = totalTracts > 0 ? (count / totalTracts) * 100 : 0;
                                return (
                                    <View key={region} style={[styles.row, i === regionRows.length - 1 && styles.lastRow]}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.rowName}>{REGION_LABELS[region] || region}</Text>
                                            <View style={styles.barBg}>
                                                <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                                            </View>
                                        </View>
                                        <Text style={[styles.rowSub, { flex: 1 }]}>{userCount} users</Text>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{count.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {tab === 'barangay' && (
                        <View style={styles.card}>
                            <View style={styles.tableHead}>
                                <Text style={[styles.headCell, { flex: 2 }]}>Barangay</Text>
                                <Text style={[styles.headCell, { flex: 1 }]}>Users</Text>
                                <Text style={[styles.headCell, { flex: 1, textAlign: 'right' }]}>Tracts</Text>
                            </View>
                            {barangayRows.map(([barangay, count], i) => {
                                const userCount = users.filter(u => (u.barangay || 'No Barangay') === barangay).length;
                                const pct = totalTracts > 0 ? (count / totalTracts) * 100 : 0;
                                return (
                                    <View key={barangay} style={[styles.row, i === barangayRows.length - 1 && styles.lastRow]}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.rowName}>{barangay}</Text>
                                            <View style={styles.barBg}>
                                                <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                                            </View>
                                        </View>
                                        <Text style={[styles.rowSub, { flex: 1 }]}>{userCount} users</Text>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{count.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>

            <Modal visible={showResetConfirm} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Ionicons name="warning-outline" size={42} color="#e74c3c" style={{ marginBottom: 12 }} />
                        <Text style={styles.modalTitle}>Reset All Counts?</Text>
                        <Text style={styles.modalBody}>This will set all user tract counts to zero. This cannot be undone.</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowResetConfirm(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={handleReset}>
                                <Text style={styles.modalConfirmText}>Yes, Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,60,0.82)' },
    safe: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#fff', marginTop: 12, fontSize: 15 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Anton_400Regular' },
    resetBtn: { padding: 4 },

    totalBlock: { alignItems: 'center', paddingVertical: 16 },
    totalCount: { color: '#C9A84C', fontSize: 56, letterSpacing: -2, fontFamily: 'Anton_400Regular' },
    totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },

    tabBar: {
        flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4,
    },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabBtnActive: { backgroundColor: '#C9A84C' },
    tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    tabTextActive: { color: '#1a1a2e' },

    scroll: { paddingHorizontal: 16, paddingBottom: 40 },

    card: {
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 }, elevation: 8, marginBottom: 20,
    },
    tableHead: {
        flexDirection: 'row', backgroundColor: '#f8fafc',
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#e8ecf0',
    },
    headCell: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    lastRow: { borderBottomWidth: 0 },
    rowName: { fontSize: 14, color: '#1e293b', marginBottom: 2 },
    rowSub: { fontSize: 12, color: '#94a3b8' },
    badge: { backgroundColor: '#e8f4fd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeZero: { backgroundColor: '#f1f5f9' },
    badgeText: { color: '#1d6fa4', fontSize: 13 },
    badgeTextZero: { color: '#94a3b8' },

    barBg: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, marginTop: 6, width: '90%' },
    barFill: { height: 4, backgroundColor: '#C9A84C', borderRadius: 2 },

    resetCta: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#e74c3c', borderRadius: 14, paddingVertical: 14,
        shadowColor: '#e74c3c', shadowOpacity: 0.3, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    resetCtaText: { color: '#fff', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
        width: '100%', maxWidth: 400,
    },
    modalTitle: { fontSize: 20, color: '#1e293b', marginBottom: 10, textAlign: 'center' },
    modalBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
    modalCancelText: { fontSize: 15, color: '#64748b' },
    modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#e74c3c', alignItems: 'center' },
    modalConfirmText: { fontSize: 15, color: '#fff' },
});
