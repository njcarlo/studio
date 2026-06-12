import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ImageBackground, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const REFRESH_INTERVAL = 30_000;
const TOP_N = 10;

const ROW_COLORS = ['#8B0000', '#1a3a6b', '#1a3a6b', '#1a3a6b', '#1a3a6b'];

type Row = { rank: number; name: string; count: number };
type UserRow = { barangay: string; tracts_given: number };

export default function LedWallBarangayScreen() {
    const { width } = useWindowDimensions();
    const isMonitor = width >= 1024;

    const [totalTracts, setTotalTracts] = useState(0);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [barangayRows, setBarangayRows] = useState<Row[]>([]);
    const [lastUpdated, setLastUpdated] = useState('');

    const fetchData = useCallback(async () => {
        try {
            // PostgREST caps each request at 1000 rows, so page through the
            // full tract_users table to get accurate totals once the event
            // has more than 1000 participants.
            const PAGE_SIZE = 1000;
            const allRows: UserRow[] = [];
            let totalCount = 0;
            for (let page = 0; ; page++) {
                const from = page * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;
                const { data, count, error } = await supabase
                    .from('tract_users')
                    .select('barangay, tracts_given', { count: 'exact' })
                    .range(from, to);
                if (error || !data) break;
                allRows.push(...(data as UserRow[]));
                totalCount = count ?? allRows.length;
                if (data.length < PAGE_SIZE) break;
            }

            const byBarangay: Record<string, number> = {};
            let grand = 0;
            allRows.forEach(u => {
                const t = u.tracts_given || 0;
                grand += t;
                if (!u.barangay) return;
                byBarangay[u.barangay] = (byBarangay[u.barangay] || 0) + t;
            });

            setTotalTracts(grand);
            setTotalParticipants(totalCount);
            setBarangayRows(
                Object.entries(byBarangay)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, TOP_N)
                    .map(([name, c], i) => ({ rank: i + 1, name, count: c }))
            );

            const now = new Date();
            setLastUpdated(
                now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
                ' ' + now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
            );
        } catch (e) {
            console.error('LedWallBarangay fetch error', e);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, REFRESH_INTERVAL);

        const channel = supabase
            .channel('ledwall_barangay_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tract_users' }, () => fetchData())
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    const heroFont = isMonitor ? 160 : 88;
    const heroLabelFont = isMonitor ? 28 : 18;
    const statFont = isMonitor ? 96 : 56;
    const statLabelFont = isMonitor ? 18 : 12;
    const manyRows = barangayRows.length > 5;
    const rowNameFont = isMonitor ? (manyRows ? 36 : 44) : (manyRows ? 22 : 28);
    const rowCountFont = isMonitor ? (manyRows ? 46 : 56) : (manyRows ? 28 : 36);

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>

                {/* Title + participants */}
                <View style={styles.topRow}>
                    <View style={styles.titleWrap}>
                        <Text style={[styles.title, { fontSize: isMonitor ? 28 : 18 }]}>
                            NATIONAL TRACTS GIVING DAY
                        </Text>
                        <Text style={[styles.subtitle, { fontSize: isMonitor ? 14 : 11 }]}>
                            LIVE COUNT · as of {lastUpdated}
                        </Text>
                    </View>
                    <View style={styles.participantsBox}>
                        <Text style={[styles.statNumber, { fontSize: statFont }]}>
                            {totalParticipants.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { fontSize: statLabelFont }]}>
                            PARTICIPANTS
                        </Text>
                    </View>
                </View>

                {/* Hero number */}
                <View style={styles.heroWrap}>
                    <Text style={[styles.heroNumber, { fontSize: heroFont, lineHeight: heroFont * 1.05 }]}>
                        {totalTracts.toLocaleString()}
                    </Text>
                    <Text style={[styles.heroLabel, { fontSize: heroLabelFont }]}>
                        TOTAL TRACTS GIVEN
                    </Text>
                </View>

                {/* Top barangays breakdown */}
                <View style={styles.list}>
                    {barangayRows.map((row, i) => (
                        <View
                            key={row.name}
                            style={[
                                styles.row,
                                { backgroundColor: ROW_COLORS[Math.min(i, ROW_COLORS.length - 1)] },
                                i === 0 && styles.rowFirst,
                            ]}
                        >
                            <View style={[styles.rankBox, i === 0 && styles.rankBoxFirst]}>
                                <Text style={[styles.rankText, { fontSize: rowNameFont }, i === 0 && styles.rankTextFirst]}>
                                    {row.rank}
                                </Text>
                            </View>
                            <View style={styles.nameBlock}>
                                <Text style={[styles.nameText, { fontSize: rowNameFont }]} numberOfLines={1}>
                                    {row.name}
                                </Text>
                            </View>
                            <View style={[styles.countBox, i === 0 && styles.countBoxFirst]}>
                                <Text style={[styles.countText, { fontSize: rowCountFont }, i === 0 && styles.countTextFirst]}>
                                    {row.count.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {barangayRows.length === 0 && (
                        <Text style={styles.emptyText}>No data yet. Start giving tracts!</Text>
                    )}
                </View>

                {/* Footer ticker */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { fontSize: isMonitor ? 14 : 10 }]}>
                        COG Philippines · Outside is Beautiful · Auto-refreshes every 30 seconds · Top {TOP_N} Barangays
                    </Text>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,10,40,0.90)' },
    safe: { flex: 1 },

    topRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, paddingBottom: 4, paddingHorizontal: 24,
    },
    titleWrap: { alignItems: 'flex-start' },
    title: { color: '#C9A84C', letterSpacing: 2, fontFamily: 'Anton_400Regular' },
    subtitle: { color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginTop: 4 },

    participantsBox: { alignItems: 'center' },

    heroWrap: { alignItems: 'center', paddingVertical: 8 },
    heroNumber: { color: '#fff', fontFamily: 'Anton_400Regular', textShadowColor: 'rgba(201,168,76,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30 },
    heroLabel: { color: '#C9A84C', letterSpacing: 4, fontFamily: 'Anton_400Regular', marginTop: 4 },

    statNumber: { color: '#fff', fontFamily: 'Anton_400Regular' },
    statLabel: { color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginTop: 4 },

    list: { flex: 1, paddingHorizontal: 24, paddingBottom: 16 },
    row: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        borderRadius: 10, marginBottom: 8, overflow: 'hidden',
    },
    rowFirst: { flex: 1.3 },

    rankBox: {
        width: 80, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)', alignSelf: 'stretch',
    },
    rankBoxFirst: { width: 96 },
    rankText: { color: '#fff', fontFamily: 'Anton_400Regular' },
    rankTextFirst: { color: '#C9A84C' },

    nameBlock: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
    nameText: { color: '#fff', fontFamily: 'Anton_400Regular', letterSpacing: 0.5 },

    countBox: {
        paddingHorizontal: 24, paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.3)', alignSelf: 'stretch',
        justifyContent: 'center', alignItems: 'flex-end', minWidth: 160,
    },
    countBoxFirst: { backgroundColor: 'rgba(201,168,76,0.2)', minWidth: 190 },
    countText: { color: '#fff', fontFamily: 'Anton_400Regular' },
    countTextFirst: { color: '#C9A84C' },

    emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40, fontSize: 16 },

    footer: {
        borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.3)',
        paddingVertical: 10, paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    footerText: { color: '#C9A84C', letterSpacing: 1, textAlign: 'center' },
});
