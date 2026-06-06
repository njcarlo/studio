import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, ImageBackground, Modal, Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabaseAdmin } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };

type Tab = 'overview' | 'region' | 'barangay' | 'reporters';

interface UserData {
    id: string;
    name?: string;
    email?: string;
    region?: string;
    subRegion?: string;
    barangay?: string;
    tractsGiven: number;
    isCorrespondent: boolean;
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

export default function AdminDashboardScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [tab, setTab] = useState<Tab>('overview');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [reporterSearch, setReporterSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('tract_users')
                .select('id, name, email, region, sub_region, barangay, tracts_given, is_correspondent');
            if (error) throw error;
            setUsers((data ?? []).map(d => ({
                id: d.id,
                name: d.name,
                email: d.email,
                region: d.region,
                subRegion: d.sub_region,
                barangay: d.barangay,
                tractsGiven: d.tracts_given ?? 0,
                isCorrespondent: d.is_correspondent ?? false,
            })));
        } catch (e) {
            console.error('fetchData error', e);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleToggleCorrespondent = async (userId: string, current: boolean) => {
        setTogglingId(userId);
        try {
            const { error } = await supabaseAdmin
                .from('tract_users')
                .update({ is_correspondent: !current })
                .eq('id', userId);
            if (error) throw error;
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, isCorrespondent: !current } : u
            ));
        } catch (e: any) {
            if (Platform.OS !== 'web') Alert.alert('Error', e.message || 'Failed to update.');
            else console.error('Toggle correspondent failed:', e);
        } finally {
            setTogglingId(null);
        }
    };

    const totalTracts = users.reduce((s, u) => s + u.tractsGiven, 0);
    const activeReporters = users.filter(u => u.isCorrespondent);
    const nonReporters = users.filter(u => !u.isCorrespondent);

    const filteredNonReporters = reporterSearch.trim()
        ? nonReporters.filter(u =>
            (u.name || '').toLowerCase().includes(reporterSearch.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(reporterSearch.toLowerCase()) ||
            (u.region || '').toLowerCase().includes(reporterSearch.toLowerCase())
        )
        : nonReporters;

    const byRegion = users.reduce<Record<string, number>>((acc, u) => {
        const key = u.region || 'Unknown';
        acc[key] = (acc[key] || 0) + u.tractsGiven;
        return acc;
    }, {});
    const regionRows = Object.entries(byRegion).sort((a, b) => b[1] - a[1]);

    const byBarangay = users.reduce<Record<string, number>>((acc, u) => {
        if (!u.barangay) return acc;
        acc[u.barangay] = (acc[u.barangay] || 0) + u.tractsGiven;
        return acc;
    }, {});
    const barangayRows = Object.entries(byBarangay).sort((a, b) => b[1] - a[1]);

    const handleReset = async () => {
        setShowResetConfirm(false);
        try {
            const { error } = await supabaseAdmin
                .from('tract_users')
                .update({ tracts_given: 0 })
                .in('id', users.map(u => u.id));
            if (error) throw error;
            await fetchData();
        } catch (err) {
            if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to reset.');
            else console.error('Reset failed:', err);
        }
    };

    const goBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Main');

    const TABS: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Users' },
        { key: 'region', label: 'Region' },
        { key: 'barangay', label: 'Barangay' },
        { key: 'reporters', label: 'Reporters' },
    ];

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
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('NewsFeed')} style={styles.headerBtn}>
                            <Ionicons name="newspaper-outline" size={22} color="#C9A84C" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('LiveBoard')} style={styles.headerBtn}>
                            <Ionicons name="tv-outline" size={22} color="#C9A84C" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBlock}>
                        <Text style={styles.statCount}>{totalTracts.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Tracts Given</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBlock}>
                        <Text style={[styles.statCount, { color: '#C9A84C' }]}>{activeReporters.length}</Text>
                        <Text style={styles.statLabel}>Reporters</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBlock}>
                        <Text style={styles.statCount}>{users.length}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabBar}>
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                            onPress={() => setTab(t.key)}
                        >
                            {t.key === 'reporters' && (
                                <Ionicons
                                    name="camera"
                                    size={11}
                                    color={tab === t.key ? '#1a1a2e' : 'rgba(255,255,255,0.6)'}
                                    style={{ marginBottom: 1 }}
                                />
                            )}
                            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* ── USERS OVERVIEW ── */}
                    {tab === 'overview' && (
                        <View style={styles.card}>
                            <View style={styles.tableHead}>
                                <Text style={[styles.headCell, { flex: 2 }]}>Name</Text>
                                <Text style={[styles.headCell, { flex: 2 }]}>Location</Text>
                                <Text style={[styles.headCell, { flex: 1, textAlign: 'right' }]}>Tracts</Text>
                            </View>
                            {[...users].sort((a, b) => b.tractsGiven - a.tractsGiven).map((u, i, arr) => (
                                <View key={u.id} style={[styles.row, i === arr.length - 1 && styles.lastRow]}>
                                    <View style={{ flex: 2 }}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.rowName}>{u.name || 'Unknown'}</Text>
                                            {u.isCorrespondent && (
                                                <View style={styles.correspondentBadge}>
                                                    <Ionicons name="camera" size={10} color="#fff" />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.rowSub}>{u.email || '—'}</Text>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.rowSub}>{getLocationLabel(u)}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <View style={[styles.badge, u.tractsGiven === 0 && styles.badgeZero]}>
                                            <Text style={[styles.badgeText, u.tractsGiven === 0 && styles.badgeTextZero]}>
                                                {u.tractsGiven}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ── BY REGION ── */}
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

                    {/* ── BY BARANGAY ── */}
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

                    {/* ── REPORTERS MANAGEMENT ── */}
                    {tab === 'reporters' && (
                        <>
                            {/* Active reporters section */}
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionHeaderLeft}>
                                    <Ionicons name="camera" size={16} color="#C9A84C" />
                                    <Text style={styles.sectionTitle}>Active Reporters</Text>
                                </View>
                                <View style={styles.sectionCount}>
                                    <Text style={styles.sectionCountText}>{activeReporters.length}</Text>
                                </View>
                            </View>

                            {activeReporters.length === 0 ? (
                                <View style={styles.emptySection}>
                                    <Text style={styles.emptySectionText}>No reporters assigned yet.</Text>
                                </View>
                            ) : (
                                <View style={styles.card}>
                                    {activeReporters.map((u, i) => (
                                        <View key={u.id} style={[styles.reporterRow, i === activeReporters.length - 1 && styles.lastRow]}>
                                            <View style={styles.reporterAvatar}>
                                                <Text style={styles.reporterAvatarText}>
                                                    {(u.name || u.email || '?')[0].toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.reporterInfo}>
                                                <Text style={styles.reporterName}>{u.name || 'Unknown'}</Text>
                                                <Text style={styles.reporterMeta}>
                                                    {u.email || '—'} · {REGION_LABELS[u.region || ''] || u.region || '—'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.removeBtn}
                                                onPress={() => handleToggleCorrespondent(u.id, true)}
                                                disabled={togglingId === u.id}
                                            >
                                                {togglingId === u.id ? (
                                                    <ActivityIndicator size="small" color="#e74c3c" />
                                                ) : (
                                                    <Text style={styles.removeBtnText}>Remove</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Add reporter section */}
                            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                                <View style={styles.sectionHeaderLeft}>
                                    <Ionicons name="person-add-outline" size={16} color="rgba(255,255,255,0.7)" />
                                    <Text style={[styles.sectionTitle, { color: 'rgba(255,255,255,0.7)' }]}>
                                        Add Reporter
                                    </Text>
                                </View>
                                <Text style={styles.sectionCountText}>{nonReporters.length} users</Text>
                            </View>

                            {/* Search */}
                            <View style={styles.searchBar}>
                                <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search by name, email, or region…"
                                    placeholderTextColor="#94a3b8"
                                    value={reporterSearch}
                                    onChangeText={setReporterSearch}
                                    autoCapitalize="none"
                                />
                                {reporterSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setReporterSearch('')}>
                                        <Ionicons name="close-circle" size={16} color="#94a3b8" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {filteredNonReporters.length === 0 ? (
                                <View style={styles.emptySection}>
                                    <Text style={styles.emptySectionText}>
                                        {reporterSearch ? 'No users match your search.' : 'All users are already reporters.'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.card}>
                                    {filteredNonReporters.map((u, i) => (
                                        <View key={u.id} style={[styles.reporterRow, i === filteredNonReporters.length - 1 && styles.lastRow]}>
                                            <View style={[styles.reporterAvatar, styles.reporterAvatarMuted]}>
                                                <Text style={[styles.reporterAvatarText, { color: '#64748b' }]}>
                                                    {(u.name || u.email || '?')[0].toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.reporterInfo}>
                                                <Text style={styles.reporterName}>{u.name || 'Unknown'}</Text>
                                                <Text style={styles.reporterMeta}>
                                                    {u.email || '—'} · {REGION_LABELS[u.region || ''] || u.region || '—'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.addBtn}
                                                onPress={() => handleToggleCorrespondent(u.id, false)}
                                                disabled={togglingId === u.id}
                                            >
                                                {togglingId === u.id ? (
                                                    <ActivityIndicator size="small" color="#1a1a2e" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="camera-outline" size={14} color="#1a1a2e" style={{ marginRight: 4 }} />
                                                        <Text style={styles.addBtnText}>Add</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
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
    headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Anton_400Regular', flex: 1, marginLeft: 8 },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerBtn: { padding: 4 },

    statsRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 4,
    },
    statBlock: { flex: 1, alignItems: 'center' },
    statCount: { color: '#fff', fontSize: 28, fontFamily: 'Anton_400Regular', letterSpacing: -1 },
    statLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },

    tabBar: {
        flexDirection: 'row', marginHorizontal: 16, marginVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4,
    },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, justifyContent: 'center' },
    tabBtnActive: { backgroundColor: '#C9A84C' },
    tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
    tabTextActive: { color: '#1a1a2e', fontFamily: 'Anton_400Regular' },

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
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    lastRow: { borderBottomWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowName: { fontSize: 14, color: '#1e293b', marginBottom: 2 },
    rowSub: { fontSize: 12, color: '#94a3b8' },

    correspondentBadge: {
        backgroundColor: '#C9A84C', width: 18, height: 18, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center',
    },

    badge: { backgroundColor: '#e8f4fd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeZero: { backgroundColor: '#f1f5f9' },
    badgeText: { color: '#1d6fa4', fontSize: 13 },
    badgeTextZero: { color: '#94a3b8' },

    barBg: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, marginTop: 6, width: '90%' },
    barFill: { height: 4, backgroundColor: '#C9A84C', borderRadius: 2 },

    // Reporter tab
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { color: '#C9A84C', fontSize: 13, fontFamily: 'Anton_400Regular', letterSpacing: 0.5 },
    sectionCount: {
        backgroundColor: '#C9A84C', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 3,
    },
    sectionCountText: { color: '#1a1a2e', fontSize: 12, fontFamily: 'Anton_400Regular' },

    emptySection: {
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
        paddingVertical: 20, alignItems: 'center', marginBottom: 20,
    },
    emptySectionText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

    reporterRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
        gap: 12,
    },
    reporterAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(201,168,76,0.15)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#C9A84C',
    },
    reporterAvatarMuted: {
        backgroundColor: '#f1f5f9', borderColor: '#e2e8f0',
    },
    reporterAvatarText: { fontSize: 16, color: '#C9A84C', fontFamily: 'Anton_400Regular' },
    reporterInfo: { flex: 1 },
    reporterName: { fontSize: 14, color: '#1e293b', marginBottom: 2 },
    reporterMeta: { fontSize: 11, color: '#94a3b8' },

    addBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#C9A84C', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 10,
    },
    addBtnText: { color: '#1a1a2e', fontSize: 13, fontFamily: 'Anton_400Regular' },

    removeBtn: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#fca5a5',
    },
    removeBtnText: { color: '#e74c3c', fontSize: 13 },

    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
        marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },

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
