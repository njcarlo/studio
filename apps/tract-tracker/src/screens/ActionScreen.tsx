import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ImageBackground, ActivityIndicator, Alert, Modal, FlatList, TextInput, AppState, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../AppNavigator';
import { useAuth } from '../context/AuthContext';
import { supabaseAdmin } from '../supabase';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };

const REGIONS = ['NLR', 'SLR', 'MMR', 'VIS', 'MIN', 'COG Dasmarinas'];

const REGION_LABELS: Record<string, string> = {
    NLR: 'North Luzon Region',
    SLR: 'South Luzon Region',
    MMR: 'Metro Manila Region',
    VIS: 'Visayas Region',
    MIN: 'Mindanao Region',
    'COG Dasmarinas': 'COG Dasmarinas',
};
const BARANGAYS = [
    'Burol', 'Burol I', 'Burol II', 'Burol III', 'Datu Esmael',
    'Emmanuel Bergado I', 'Emmanuel Bergado II',
    'Fatima I', 'Fatima II', 'Fatima III',
    'H-2', 'Langkaan I', 'Langkaan II',
    'Luzviminda I', 'Luzviminda II',
    'Paliparan I', 'Paliparan II', 'Paliparan III',
    'Sabang', 'Saint Peter I', 'Saint Peter II',
    'Salawag', 'Salitran I', 'Salitran II', 'Salitran III', 'Salitran IV',
    'Sampaloc I', 'Sampaloc II', 'Sampaloc III', 'Sampaloc IV', 'Sampaloc V',
    'San Agustin I', 'San Agustin II', 'San Agustin III',
    'San Andres I', 'San Andres II',
    'San Antonio de Padua I', 'San Antonio de Padua II',
    'San Dionisio', 'San Esteban',
    'San Francisco I', 'San Francisco II',
    'San Isidro Labrador I', 'San Isidro Labrador II',
    'San Jose', 'San Juan',
    'San Lorenzo Ruiz I', 'San Lorenzo Ruiz II',
    'San Luis I', 'San Luis II',
    'San Manuel I', 'San Manuel II',
    'San Mateo', 'San Miguel', 'San Miguel II',
    'San Nicolas I', 'San Nicolas II',
    'San Roque', 'San Simon',
    'Santa Cristina I', 'Santa Cristina II',
    'Santa Cruz I', 'Santa Cruz II',
    'Santa Fe', 'Santa Lucia', 'Santa Maria',
    'Santo Cristo', 'Santo Niño I', 'Santo Niño II',
    'Victoria Reyes', 'Zone I', 'Zone I-B', 'Zone II', 'Zone III', 'Zone IV',
];

// ── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onConfirm }: { onConfirm: () => void }) {
    const { user, authState, setAuthState } = useAuth();
    const [region, setRegion] = useState(authState.region || '');
    const [subRegion, setSubRegion] = useState(authState.subRegion || '');
    const [barangay, setBarangay] = useState(authState.barangay || '');
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    const firstName = authState.name ? authState.name.split(' ')[0] : 'Friend';
    const filteredBarangays = BARANGAYS.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleConfirm = async () => {
        if (!region) { Alert.alert('Required', 'Please select your region.'); return; }
        setSaving(true);
        try {
            await supabaseAdmin
                .from('tract_users')
                .update({ region, sub_region: subRegion || null, barangay: barangay || null })
                .eq('id', user.id);
            setAuthState({ region, subRegion, barangay });
            onConfirm();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
                <View style={styles.setupContent}>
                    <Text style={styles.setupTitle}>National Tracts{'\n'}Giving Day</Text>
                    <Text style={styles.script}>Outside is Beautiful</Text>

                    <Text style={styles.greeting}>Hello, {firstName}!</Text>

                    <Text style={styles.fieldLabel}>Please select your Region</Text>
                    <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowRegionModal(true)}>
                        <Text style={[styles.dropdownText, !region && { color: 'rgba(255,255,255,0.5)' }]}>
                            {region ? REGION_LABELS[region] : 'Select Region'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#fff" />
                    </TouchableOpacity>

                    {region === 'COG Dasmarinas' && (
                        <>
                            <Text style={styles.fieldLabel}>Please select your Barangay</Text>
                            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowBarangayModal(true)}>
                                <Text style={[styles.dropdownText, !barangay && { color: 'rgba(255,255,255,0.5)' }]}>
                                    {barangay || 'Select Barangay'}
                                </Text>
                                <Ionicons name="chevron-down" size={18} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}

                    <Text style={styles.setupNote}>
                        Note: Once you click confirm, you will not be able to edit your Region and Barangay.
                    </Text>

                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={saving}>
                        {saving ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.confirmBtnText}>Confirm</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <Modal visible={showRegionModal} animationType="slide" transparent>
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Region</Text>
                            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {REGIONS.map(r => (
                            <TouchableOpacity
                                key={r}
                                style={styles.barangayItem}
                                onPress={() => { setRegion(r); setSubRegion(''); setBarangay(''); setShowRegionModal(false); }}
                            >
                                <Text style={[styles.barangayItemText, region === r && styles.selectedItemText]}>{REGION_LABELS[r]}</Text>
                                {region === r && <Ionicons name="checkmark" size={18} color="#C9A84C" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </SafeAreaView>
            </Modal>

            <Modal visible={showBarangayModal} animationType="slide" transparent>
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Barangay</Text>
                            <TouchableOpacity onPress={() => setShowBarangayModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search barangay..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                        <FlatList
                            data={filteredBarangays}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.barangayItem}
                                    onPress={() => { setBarangay(item); setShowBarangayModal(false); setSearchQuery(''); }}
                                >
                                    <Text style={[styles.barangayItemText, barangay === item && styles.selectedItemText]}>{item}</Text>
                                    {barangay === item && <Ionicons name="checkmark" size={18} color="#C9A84C" />}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </ImageBackground>
    );
}

// ── Offline queue helpers ─────────────────────────────────────────────────────
const PENDING_KEY = 'tract_pending_count';
async function getPending(): Promise<number> {
    const v = await AsyncStorage.getItem(PENDING_KEY);
    return v ? parseInt(v, 10) : 0;
}
async function savePending(n: number) {
    await AsyncStorage.setItem(PENDING_KEY, String(n));
}

// ── Main Action Screen ────────────────────────────────────────────────────────
export default function ActionScreen() {
    const { user, authState, signOut, isAdmin } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [setupDone, setSetupDone] = useState(!!authState.region);
    const [personalCount, setPersonalCount] = useState(0);
    const [nationalCount, setNationalCount] = useState(0);
    const [regionalCount, setRegionalCount] = useState(0);
    const [barangayCount, setBarangayCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = useRef(false);
    const [topRegions, setTopRegions] = useState<{ region: string; count: number }[]>([]);
    const [topBarangays, setTopBarangays] = useState<{ barangay: string; count: number }[]>([]);
    const [isIncrementing, setIsIncrementing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authState.region) setSetupDone(true);
    }, [authState.region]);

    // Load pending from storage on mount
    useEffect(() => { getPending().then(setPendingCount); }, []);

    const loadCounts = useCallback(async () => {
        if (!user) return;
        try {
            const { data: allUsers } = await supabaseAdmin
                .from('tract_users')
                .select('id, tracts_given, region, barangay');

            if (!allUsers) return;

            const pending = await getPending();
            const me = allUsers.find(u => u.id === user.id);
            // Personal = DB value + any unsynced offline increments
            setPersonalCount((me?.tracts_given ?? 0) + pending);

            const national = allUsers.reduce((s, u) => s + (u.tracts_given ?? 0), 0);
            setNationalCount(national + pending);

            const regional = allUsers
                .filter(u => u.region === authState.region)
                .reduce((s, u) => s + (u.tracts_given ?? 0), 0);
            setRegionalCount(regional + pending);

            if (authState.barangay) {
                const brgy = allUsers
                    .filter(u => u.barangay === authState.barangay)
                    .reduce((s, u) => s + (u.tracts_given ?? 0), 0);
                setBarangayCount(brgy + pending);
            }

            const byRegion: Record<string, number> = {};
            allUsers.forEach(u => {
                if (u.region) byRegion[u.region] = (byRegion[u.region] || 0) + (u.tracts_given ?? 0);
            });
            if (authState.region && pending > 0) byRegion[authState.region] = (byRegion[authState.region] || 0) + pending;
            setTopRegions(Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([region, count]) => ({ region, count })));

            const byBarangay: Record<string, number> = {};
            allUsers.forEach(u => {
                if (u.barangay) byBarangay[u.barangay] = (byBarangay[u.barangay] || 0) + (u.tracts_given ?? 0);
            });
            if (authState.barangay && pending > 0) byBarangay[authState.barangay] = (byBarangay[authState.barangay] || 0) + pending;
            setTopBarangays(Object.entries(byBarangay).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([barangay, count]) => ({ barangay, count })));
        } catch (e) {
            console.error('loadCounts error', e);
        } finally {
            setIsLoading(false);
        }
    }, [user, authState.region, authState.barangay]);

    useEffect(() => {
        if (setupDone) loadCounts();
    }, [setupDone, loadCounts]);

    // ── Sync pending offline increments ──────────────────────────────────────
    const syncPending = useCallback(async () => {
        if (!user || isSyncingRef.current) return;
        const pending = await getPending();
        if (pending === 0) return;
        isSyncingRef.current = true;
        setIsSyncing(true);
        try {
            const { data: fresh } = await supabaseAdmin.from('tract_users').select('tracts_given').eq('id', user.id).single();
            const newCount = (fresh?.tracts_given ?? 0) + pending;
            const { error } = await supabaseAdmin.from('tract_users').update({ tracts_given: newCount }).eq('id', user.id);
            if (!error) {
                await savePending(0);
                setPendingCount(0);
                await loadCounts();
            }
        } catch (e) { console.error('syncPending error', e); }
        finally { isSyncingRef.current = false; setIsSyncing(false); }
    }, [user, loadCounts]);

    // Sync + reload when app comes to foreground
    useEffect(() => {
        const sub = AppState.addEventListener('change', state => {
            if (state === 'active' && setupDone) syncPending().then(() => loadCounts());
        });
        return () => sub.remove();
    }, [setupDone, syncPending, loadCounts]);

    // Poll every 10s while there are pending taps — catches intermittent connectivity
    useEffect(() => {
        if (pendingCount === 0) return;
        const interval = setInterval(() => {
            syncPending();
        }, 10_000);
        return () => clearInterval(interval);
    }, [pendingCount, syncPending]);

    // Realtime — reload full counts for accuracy (not incremental diff)
    useEffect(() => {
        if (!setupDone) return;
        const channel = supabaseAdmin
            .channel('tract_users_realtime')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tract_users' }, () => loadCounts())
            .subscribe();
        return () => { supabaseAdmin.removeChannel(channel); };
    }, [setupDone, loadCounts]);

    // ── +1 handler — optimistic + offline queue ───────────────────────────────
    const handleIncrement = async () => {
        if (!user || isIncrementing) return;
        setIsIncrementing(true);

        // Optimistic update — instant UI feedback regardless of network
        setPersonalCount(prev => prev + 1);
        setRegionalCount(prev => prev + 1);
        setNationalCount(prev => prev + 1);
        if (authState.barangay) setBarangayCount(prev => prev + 1);

        // Read queued count once upfront to avoid race between try/catch branches
        const queued = await getPending();
        let online = false;

        try {
            const { data: fresh, error: fetchErr } = await supabaseAdmin
                .from('tract_users')
                .select('tracts_given')
                .eq('id', user.id)
                .single();

            if (!fetchErr && fresh !== null) {
                // Online — write DB value + any queued pending + this tap
                const newCount = (fresh.tracts_given ?? 0) + queued + 1;

                const { error: updateErr } = await supabaseAdmin
                    .from('tract_users')
                    .update({ tracts_given: newCount })
                    .eq('id', user.id);

                if (!updateErr) {
                    online = true;
                    await savePending(0);
                    setPendingCount(0);
                    loadCounts(); // fire and forget — don't await so UI stays responsive
                }
            }
        } catch {
            // Network error — fall through to offline queue
        }

        if (!online) {
            // Offline — queue this tap
            await savePending(queued + 1);
            setPendingCount(queued + 1);
        }

        setIsIncrementing(false);
    };

    if (!setupDone) {
        return <SetupScreen onConfirm={() => setSetupDone(true)} />;
    }

    const locationLabel = authState.barangay
        ? `Brgy. ${authState.barangay}`
        : REGION_LABELS[authState.region] || authState.region || 'My Region';

    // Primary count shown at top — barangay if set, else region
    const primaryCount = authState.barangay ? barangayCount : regionalCount;

    const now = new Date();
    const timeLabel = `as of ${now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}, ${now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`;

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
                {/* Header row */}
                <View style={styles.header}>
                    {isAdmin ? (
                        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>Admin</Text>
                        </TouchableOpacity>
                    ) : <View />}
                    <TouchableOpacity onPress={signOut} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                    {/* Title */}
                    <Text style={styles.title}>National Tracts Giving Day</Text>

                    {/* Regional/Barangay block — big count at top */}
                    <View style={styles.regionalBlock}>
                        <Text style={styles.locationLabel}>{locationLabel}</Text>
                        {isLoading
                            ? <ActivityIndicator color="#fff" style={{ marginVertical: 12 }} />
                            : <Text style={styles.regionalCount}>{primaryCount.toLocaleString()}</Text>
                        }
                        <Text style={styles.regionalSub}>Total Tracts Given</Text>
                        <Text style={styles.regionalSub}>{timeLabel}</Text>
                    </View>

                    {/* Personal card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>My Tract Counter</Text>
                        {isLoading
                            ? <ActivityIndicator color="#1a1a2e" style={{ marginVertical: 16 }} />
                            : <Text style={styles.cardCount}>{personalCount}</Text>
                        }
                        {pendingCount > 0 && (
                            <Text style={{ fontSize: 11, color: '#e67700', marginBottom: 8 }}>
                                {isSyncing ? `Syncing ${pendingCount} offline tap${pendingCount > 1 ? 's' : ''}…` : `${pendingCount} tap${pendingCount > 1 ? 's' : ''} pending sync`}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[styles.plusBtn, isIncrementing && styles.plusBtnDisabled]}
                            onPress={handleIncrement}
                            disabled={isIncrementing}
                            activeOpacity={0.8}
                        >
                            {isIncrementing
                                ? <ActivityIndicator color="#1a1a2e" />
                                : <Text style={styles.plusBtnText}>+1</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Stats section */}
                    {!isLoading && (
                        <View style={styles.statsSection}>
                            {/* National */}
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Nationwide Total</Text>
                                <Text style={styles.statValue}>{nationalCount.toLocaleString()}</Text>
                            </View>

                            {/* Top Regions */}
                            {topRegions.length > 0 && (
                                <View style={styles.leaderboard}>
                                    <Text style={styles.leaderboardTitle}>Top Regions</Text>
                                    {topRegions.map((r, i) => (
                                        <View key={r.region} style={styles.leaderboardRow}>
                                            <Text style={styles.leaderboardRank}>{i + 1}</Text>
                                            <Text style={styles.leaderboardName}>{REGION_LABELS[r.region] || r.region}</Text>
                                            <Text style={styles.leaderboardCount}>{r.count.toLocaleString()}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Top Barangays */}
                            {topBarangays.length > 0 && (
                                <View style={styles.leaderboard}>
                                    <Text style={styles.leaderboardTitle}>Top Barangays</Text>
                                    {topBarangays.map((b, i) => (
                                        <View key={b.barangay} style={styles.leaderboardRow}>
                                            <Text style={styles.leaderboardRank}>{i + 1}</Text>
                                            <Text style={styles.leaderboardName}>{b.barangay}</Text>
                                            <Text style={styles.leaderboardCount}>{b.count.toLocaleString()}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,60,0.78)' },
    safe: { flex: 1 },

    // ── Setup ──
    setupContent: { flex: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 32 },
    greeting: { color: '#fff', fontSize: 26, marginBottom: 24 },
    fieldLabel: { color: '#fff', fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    dropdownTrigger: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
        padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    dropdownText: { fontSize: 15, color: '#fff' },
    setupNote: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
    confirmBtn: {
        backgroundColor: '#C9A84C', borderRadius: 14, paddingVertical: 18,
        alignItems: 'center', shadowColor: '#C9A84C', shadowOpacity: 0.4,
        shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    confirmBtnText: { color: '#1a1a2e', fontSize: 17 },

    // ── Barangay modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, color: '#1a1a2e' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
    searchInput: { flex: 1, height: 42, fontSize: 15 },
    barangayItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
    barangayItemText: { fontSize: 15, color: '#444' },
    selectedItemText: { color: '#C9A84C' },

    // ── Action ──
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
    headerBtn: { padding: 8 },
    headerBtnText: { color: '#C9A84C', fontSize: 14 },
    title: { color: '#C9A84C', fontSize: 28, textAlign: 'center', marginTop: 8, marginBottom: 8, paddingHorizontal: 20, fontFamily: 'Anton_400Regular' },

    regionalBlock: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
    locationLabel: { color: '#fff', fontSize: 18, marginBottom: 4, fontFamily: 'Anton_400Regular' },
    regionalCount: { color: '#fff', fontSize: 64, letterSpacing: -2, fontFamily: 'Anton_400Regular' },
    regionalSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

    card: {
        marginHorizontal: 24,
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    cardTitle: { fontSize: 14, color: '#1a1a2e', marginBottom: 8, fontFamily: 'Anton_400Regular' },
    cardCount: { fontSize: 64, color: '#1a1a2e', lineHeight: 72, marginBottom: 16, fontFamily: 'Anton_400Regular' },
    plusBtn: {
        backgroundColor: '#C9A84C', borderRadius: 12, paddingVertical: 14,
        width: '100%', alignItems: 'center',
        shadowColor: '#C9A84C', shadowOpacity: 0.4, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    plusBtnDisabled: { opacity: 0.6 },
    plusBtnText: { fontSize: 22, color: '#1a1a2e', fontFamily: 'Anton_400Regular' },

    // ── Stats ──
    statsSection: { marginHorizontal: 24, marginTop: 20, gap: 0 },
    statRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, marginBottom: 8,
    },
    statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    statValue: { color: '#C9A84C', fontSize: 20, fontFamily: 'Anton_400Regular' },
    leaderboard: {
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
        padding: 16, marginBottom: 12,
    },
    leaderboardTitle: {
        color: '#C9A84C', fontSize: 11, fontFamily: 'Anton_400Regular',
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
    },
    leaderboardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    leaderboardRank: { color: '#C9A84C', fontSize: 13, fontFamily: 'Anton_400Regular', width: 24 },
    leaderboardName: { color: '#fff', fontSize: 13, flex: 1 },
    leaderboardCount: { color: '#C9A84C', fontSize: 14, fontFamily: 'Anton_400Regular' },
    timeLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 8 },
    setupTitle: { color: '#C9A84C', fontSize: 40, lineHeight: 46, marginBottom: 10, fontFamily: 'Anton_400Regular' },
    script: { color: '#fff', fontSize: 22, fontStyle: 'italic', marginBottom: 28, opacity: 0.9, fontFamily: 'Inter_400Regular_Italic' },
});