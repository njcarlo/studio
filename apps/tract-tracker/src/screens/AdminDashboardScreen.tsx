import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, supabaseAdmin } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import AnimatedCounter from '../components/AnimatedCounter';

interface UserData {
    id: string;
    name?: string;
    email?: string;
    region?: string;
    barangay?: string;
    tractsGiven?: number;
}

interface MetricsData {
    totalTracts: number;
    activeUsers: number;
    regionsCovered: number;
    topBarangay: string;
}

const MOCK_USERS: UserData[] = [
    { id: '1', name: 'Juan Dela Cruz', email: 'juan@example.com', region: 'MMR', barangay: 'Burol I', tractsGiven: 154 },
    { id: '2', name: 'Maria Clara', email: 'maria@example.com', region: 'MMR', barangay: 'Salawag', tractsGiven: 89 },
    { id: '3', name: 'Jose Rizal', email: 'jose@example.com', region: 'MMR', barangay: 'Paliparan III', tractsGiven: 320 },
    { id: '4', name: 'Andres Bonifacio', email: 'andres@example.com', region: 'MMR', barangay: 'Datu Esmael', tractsGiven: 45 },
    { id: '5', name: 'Emilio Aguinaldo', email: 'emilio@example.com', region: 'MMR', barangay: 'Sampaloc I', tractsGiven: 210 },
];

const INITIAL_MOCK_METRICS: MetricsData = {
    totalTracts: 8900,
    activeUsers: 142,
    regionsCovered: 5,
    topBarangay: 'Sampaloc',
};

const METRIC_CONFIGS = [
    { key: 'totalTracts', label: 'Total Tracts', icon: 'documents-outline' as const, color: '#e74c3c', bg: '#fdecea' },
    { key: 'activeUsers', label: 'Active Users', icon: 'people-outline' as const, color: '#3498db', bg: '#e8f4fd' },
    { key: 'regionsCovered', label: 'Regions Reached', icon: 'map-outline' as const, color: '#27ae60', bg: '#e8f7ee' },
];

export default function AdminDashboardScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { width } = useWindowDimensions();
    const isWide = width >= 640;

    const [users, setUsers] = useState<UserData[]>([]);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const usingMock = useRef(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tract_users')
                .select('id, name, email, region, barangay, tracts_given');
            if (error || !data || data.length === 0) throw new Error('No data');

            const fetched: UserData[] = data.map(d => ({
                id: d.id,
                name: d.name,
                email: d.email,
                region: d.region,
                barangay: d.barangay,
                tractsGiven: d.tracts_given ?? 0,
            }));
            setUsers(fetched);

            const total = fetched.reduce((acc, u) => acc + (u.tractsGiven || 0), 0);
            const regionSet = new Set(fetched.map(u => u.region).filter(Boolean));
            const barangayCounts: Record<string, number> = {};
            fetched.forEach(u => {
                if (u.barangay) barangayCounts[u.barangay] = (barangayCounts[u.barangay] || 0) + (u.tractsGiven || 0);
            });
            const topBarangay = Object.entries(barangayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
            setMetrics({ totalTracts: total, activeUsers: fetched.length, regionsCovered: regionSet.size, topBarangay });
        } catch {
            usingMock.current = true;
            setUsers(MOCK_USERS);
            setMetrics(INITIAL_MOCK_METRICS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleReset = async () => {
        setShowResetConfirm(false);
        setResetting(true);
        try {
            if (usingMock.current) {
                // Mock reset — zero out local state
                await new Promise(r => setTimeout(r, 800));
                setUsers(prev => prev.map(u => ({ ...u, tractsGiven: 0 })));
                setMetrics(prev => prev ? { ...prev, totalTracts: 0 } : prev);
            } else {
                // Real Supabase batch update — uses admin client to bypass RLS
                const { error } = await supabaseAdmin
                    .from('tract_users')
                    .update({ tracts_given: 0 })
                    .in('id', users.map(u => u.id));
                if (error) throw error;
                await fetchData();
            }
        } catch (err) {
            if (Platform.OS !== 'web') {
                Alert.alert('Error', 'Failed to reset data. Please try again.');
            } else {
                console.error('Reset failed:', err);
            }
        } finally {
            setResetting(false);
        }
    };

    const goBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Main');

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#e74c3c" /><Text style={styles.loadingText}>Loading admin data…</Text></SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}><TouchableOpacity onPress={goBack} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color="#333" /></TouchableOpacity><View style={styles.headerCenter}><Text style={styles.headerTitle}>Admin Dashboard {usingMock.current && <Text style={styles.mockBadge}>DEMO DATA</Text>}</Text></View><TouchableOpacity onPress={() => setShowResetConfirm(true)} style={styles.resetBtn} disabled={resetting}>{resetting ? <ActivityIndicator size="small" color="#e74c3c" /> : <Ionicons name="refresh-circle-outline" size={26} color="#e74c3c" />}</TouchableOpacity></View>

            <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>

                {/* Metric Cards */}
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={[styles.metricsRow, isWide && styles.metricsRowWide]}>{METRIC_CONFIGS.map(cfg => (
                    <View key={cfg.key} style={[styles.metricCard, { backgroundColor: cfg.bg }, isWide && styles.metricCardWide]}><Ionicons name={cfg.icon} size={28} color={cfg.color} style={styles.metricIcon} /><AnimatedCounter value={(metrics as any)?.[cfg.key] ?? 0} fontSize={isWide ? 42 : 34} color={cfg.color} /><Text style={[styles.metricLabel, { color: cfg.color }]}>{cfg.label}</Text></View>))}</View>

                <View style={styles.topBadgeRow}><View style={styles.topBadge}><Ionicons name="star" size={20} color="#f1c40f" /><Text style={styles.topBadgeText}>Top Barangay: <Text style={styles.topBadgeValue}>{metrics?.topBarangay ?? '—'}</Text></Text></View></View>

                <TouchableOpacity style={styles.resetCta} onPress={() => setShowResetConfirm(true)} disabled={resetting}><Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.resetCtaText}>{resetting ? 'Resetting…' : 'Reset All Tract Counts'}</Text></TouchableOpacity>

                {/* User Table */}
                <Text style={styles.sectionTitle}>User Directory</Text>
                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={[styles.tableHeadCell, { flex: 2 }]}>Name</Text>
                        <Text style={[styles.tableHeadCell, { flex: 2 }]}>Location</Text>
                        <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'right' }]}>Tracts</Text>
                    </View>
                    {users.map((user, i) => (
                        <View key={user.id} style={[styles.tableRow, i === users.length - 1 && styles.lastRow]}><View style={{ flex: 2 }}><Text style={styles.userName}>{user.name ?? 'Unknown'}</Text><Text style={styles.userEmail}>{user.email ?? '—'}</Text></View><View style={{ flex: 2, justifyContent: 'center' }}><Text style={styles.userLocation}>{[user.region, user.barangay].filter(Boolean).join(' • ')}</Text></View><View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}><View style={[styles.tractBadge, (user.tractsGiven ?? 0) === 0 && styles.tractBadgeZero]}><Text style={[styles.tractBadgeText, (user.tractsGiven ?? 0) === 0 && styles.tractBadgeTextZero]}>{user.tractsGiven ?? 0}</Text></View></View></View>
                    ))}
                </View>
            </ScrollView>

            {/* Confirm Reset Modal */}
            <Modal visible={showResetConfirm} transparent animationType="fade">
                <View style={styles.modalOverlay}><View style={styles.modalCard}><Ionicons name="warning-outline" size={42} color="#e74c3c" style={{ marginBottom: 12 }} /><Text style={styles.modalTitle}>Reset All Counts?</Text><Text style={styles.modalBody}>This will set all user tract counts to zero. This action cannot be undone.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.modalCancel} onPress={() => setShowResetConfirm(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.modalConfirm} onPress={handleReset}><Text style={styles.modalConfirmText}>Yes, Reset</Text></TouchableOpacity></View></View></View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f4f8' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
    loadingText: { marginTop: 12, fontSize: 15, color: '#666' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e8ecf0',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    backBtn: { padding: 4 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
    mockBadge: { fontSize: 9, fontWeight: '700', color: '#e67e22', letterSpacing: 1, backgroundColor: '#fdf0e3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
    resetBtn: { padding: 4 },

    container: { padding: 20, paddingBottom: 50 },
    containerWide: { maxWidth: 860, alignSelf: 'center', width: '100%' },

    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 14, marginTop: 4, letterSpacing: -0.3 },

    metricsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
    metricsRowWide: {},
    metricCard: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    metricCardWide: { width: '31.5%' },
    metricIcon: { marginBottom: 8 },
    metricLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6, textAlign: 'center' },

    topBadgeRow: { marginBottom: 16 },
    topBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#fefce8',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    topBadgeText: { fontSize: 14, color: '#92400e', fontWeight: '600', marginLeft: 6 },
    topBadgeValue: { fontSize: 14, color: '#b45309', fontWeight: '800' },

    resetCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e74c3c',
        borderRadius: 14,
        paddingVertical: 14,
        marginBottom: 28,
        shadowColor: '#e74c3c',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    resetCtaText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    table: {
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    tableHead: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e8ecf0',
    },
    tableHeadCell: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        alignItems: 'center',
    },
    lastRow: { borderBottomWidth: 0 },
    userName: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
    userEmail: { fontSize: 12, color: '#94a3b8' },
    userLocation: { fontSize: 13, color: '#475569', fontWeight: '500' },
    tractBadge: { backgroundColor: '#e8f4fd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    tractBadgeZero: { backgroundColor: '#f1f5f9' },
    tractBadgeText: { color: '#1d6fa4', fontWeight: '800', fontSize: 13 },
    tractBadgeTextZero: { color: '#94a3b8' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 10, textAlign: 'center' },
    modalBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancel: {
        flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
        borderColor: '#e2e8f0', alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
    modalConfirm: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#e74c3c', alignItems: 'center',
    },
    modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
