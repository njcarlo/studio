import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ImageBackground, ScrollView,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabaseAdmin } from '../supabase';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const REFRESH_INTERVAL = 30_000;

type Tab = 'region' | 'barangay';
type Row = { rank: number; name: string; count: number };

const REGION_LABELS: Record<string, string> = {
    NLR: 'North Luzon Region',
    SLR: 'South Luzon Region',
    MMR: 'Metro Manila Region',
    VIS: 'Visayas',
    MIN: 'Mindanao',
};

const ROW_COLORS = [
    '#8B0000', // 1st — deep red
    '#1a3a6b', // 2nd — deep blue
    '#1a3a6b',
    '#1a3a6b',
    '#1a3a6b',
];

export default function LiveBoardScreen() {
    const [tab, setTab] = useState<Tab>('region');
    const [regionRows, setRegionRows] = useState<Row[]>([]);
    const [barangayRows, setBarangayRows] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const { data } = await supabaseAdmin
                .from('tract_users')
                .select('region, barangay, tracts_given');

            if (!data) return;

            const byRegion: Record<string, number> = {};
            const byBarangay: Record<string, number> = {};
            let grand = 0;

            data.forEach(u => {
                const t = u.tracts_given || 0;
                grand += t;
                if (u.region) byRegion[u.region] = (byRegion[u.region] || 0) + t;
                if (u.barangay) byBarangay[u.barangay] = (byBarangay[u.barangay] || 0) + t;
            });

            setRegionRows(
                Object.entries(byRegion)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count], i) => ({ rank: i + 1, name: REGION_LABELS[name] || name, count }))
            );
            setBarangayRows(
                Object.entries(byBarangay)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count], i) => ({ rank: i + 1, name, count }))
            );
            setTotal(grand);

            const now = new Date();
            setLastUpdated(
                now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
                ' ' +
                now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
            );
        } catch (e) {
            console.error('LiveBoard fetch error', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, REFRESH_INTERVAL);

        // Realtime subscription — refetch on any tract_users update
        const channel = supabaseAdmin
            .channel('liveboard_realtime')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'tract_users' },
                () => fetchData()
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            supabaseAdmin.removeChannel(channel);
        };
    }, [fetchData]);

    const rows = tab === 'region' ? regionRows : barangayRows;

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>

                {/* Top bar */}
                <View style={styles.topBar}>
                    <View style={styles.topBarLeft}>
                        <Text style={styles.topBarTitle}>National Tracts Giving Day</Text>
                        <View style={styles.topBarMeta}>
                            <Text style={styles.topBarMetaText}>Live Results</Text>
                            <Text style={styles.topBarMetaDivider}> · </Text>
                            <Text style={styles.topBarMetaText}>as of {lastUpdated}</Text>
                        </View>
                    </View>
                    <View style={styles.totalPill}>
                        <Text style={styles.totalPillLabel}>Total</Text>
                        <Text style={styles.totalPillCount}>{total.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'region' && styles.tabBtnActive]}
                        onPress={() => setTab('region')}
                    >
                        <Text style={[styles.tabText, tab === 'region' && styles.tabTextActive]}>By Region</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'barangay' && styles.tabBtnActive]}
                        onPress={() => setTab('barangay')}
                    >
                        <Text style={[styles.tabText, tab === 'barangay' && styles.tabTextActive]}>By Barangay</Text>
                    </TouchableOpacity>
                </View>

                {/* Leaderboard */}
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#C9A84C" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                        {rows.map((row, i) => (
                            <View
                                key={row.name}
                                style={[
                                    styles.row,
                                    { backgroundColor: ROW_COLORS[Math.min(i, ROW_COLORS.length - 1)] },
                                    i === 0 && styles.rowFirst,
                                ]}
                            >
                                {/* Rank */}
                                <View style={[styles.rankBox, i === 0 && styles.rankBoxFirst]}>
                                    <Text style={[styles.rankText, i === 0 && styles.rankTextFirst]}>{row.rank}</Text>
                                </View>

                                {/* Name */}
                                <View style={styles.nameBlock}>
                                    <Text style={[styles.nameText, i === 0 && styles.nameTextFirst]} numberOfLines={1}>
                                        {row.name}
                                    </Text>
                                    <Text style={styles.nameSubText}>
                                        {tab === 'region' ? 'Region' : 'Barangay'}
                                    </Text>
                                </View>

                                {/* Count */}
                                <View style={[styles.countBox, i === 0 && styles.countBoxFirst]}>
                                    <Text style={[styles.countText, i === 0 && styles.countTextFirst]}>
                                        {row.count.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {rows.length === 0 && (
                            <Text style={styles.emptyText}>No data yet. Start giving tracts!</Text>
                        )}
                    </ScrollView>
                )}

                {/* Footer ticker */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        COG Philippines · Outside is Beautiful · Auto-refreshes every 30 seconds
                    </Text>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,10,40,0.88)' },
    safe: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Top bar
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 2, borderBottomColor: '#C9A84C',
    },
    topBarLeft: { flex: 1 },
    topBarTitle: {
        color: '#C9A84C', fontSize: 16,
        letterSpacing: 0.5, fontFamily: 'Anton_400Regular',
    },
    topBarMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    topBarMetaText: { color: '#fff', fontSize: 10, letterSpacing: 0.3 },
    topBarMetaDivider: { color: '#C9A84C', fontSize: 10 },
    totalPill: {
        backgroundColor: '#C9A84C', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', marginLeft: 12,
    },
    totalPillLabel: { color: '#1a1a2e', fontSize: 9, letterSpacing: 0.5 },
    totalPillCount: { color: '#1a1a2e', fontSize: 18, fontFamily: 'Anton_400Regular' },

    // Tabs
    tabBar: {
        flexDirection: 'row', marginHorizontal: 16, marginVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3,
    },
    tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: '#C9A84C' },
    tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 0.5 },
    tabTextActive: { color: '#1a1a2e' },

    // List
    list: { paddingHorizontal: 16, paddingBottom: 16 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 6, marginBottom: 4, overflow: 'hidden',
        minHeight: 56,
    },
    rowFirst: { minHeight: 68 },

    rankBox: {
        width: 44, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)', alignSelf: 'stretch',
    },
    rankBoxFirst: { width: 52 },
    rankText: { color: '#fff', fontSize: 18, fontFamily: 'Anton_400Regular' },
    rankTextFirst: { fontSize: 24, color: '#C9A84C' },

    nameBlock: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
    nameText: { color: '#fff', fontSize: 16, fontFamily: 'Anton_400Regular', letterSpacing: 0.3 },
    nameTextFirst: { fontSize: 20 },
    nameSubText: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 1 },

    countBox: {
        paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.3)', alignSelf: 'stretch',
        justifyContent: 'center', alignItems: 'flex-end', minWidth: 110,
    },
    countBoxFirst: { backgroundColor: 'rgba(201,168,76,0.2)', minWidth: 130 },
    countText: { color: '#fff', fontSize: 18, fontFamily: 'Anton_400Regular' },
    countTextFirst: { fontSize: 24, color: '#C9A84C' },

    emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40, fontSize: 14 },

    // Footer
    footer: {
        borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.3)',
        paddingVertical: 8, paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    footerText: { color: '#C9A84C', fontSize: 10, letterSpacing: 1, textAlign: 'center' },
});
