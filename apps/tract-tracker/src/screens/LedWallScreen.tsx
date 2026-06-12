import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ImageBackground, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const REFRESH_INTERVAL = 30_000;

const REGION_LABELS: Record<string, string> = {
    NLR: 'North Luzon Region',
    SLR: 'South Luzon Region',
    MMR: 'Metro Manila Region',
    VIS: 'Visayas',
    MIN: 'Mindanao',
};

type Row = { rank: number; name: string; count: number };
type TractAggregates = {
    grand_total: number;
    total_participants: number;
    by_region: Record<string, number>;
    by_barangay: Record<string, number>;
};

export default function LedWallScreen() {
    const { width } = useWindowDimensions();
    const isMonitor = width >= 1024;

    const [totalTracts, setTotalTracts] = useState(0);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [regionRows, setRegionRows] = useState<Row[]>([]);
    const [lastUpdated, setLastUpdated] = useState('');

    const fetchData = useCallback(async () => {
        try {
            // Single aggregated RPC instead of paging the full tract_users table.
            const { data: raw, error } = await supabase.rpc('get_tract_aggregates').single();
            if (error || !raw) return;
            const data = raw as unknown as TractAggregates;

            const byRegion: Record<string, number> = { ...(data.by_region ?? {}) };

            // Always show every known region, even if it has 0 tracts so far.
            Object.keys(REGION_LABELS).forEach(code => {
                if (!(code in byRegion)) byRegion[code] = 0;
            });

            const entries = Object.entries(byRegion);

            setTotalTracts(Number(data.grand_total ?? 0));
            setTotalParticipants(Number(data.total_participants ?? 0));
            setRegionRows(
                entries
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, c], i) => ({ rank: i + 1, name: REGION_LABELS[name] || name, count: c }))
            );

            const now = new Date();
            setLastUpdated(
                now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
                ' ' + now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
            );
        } catch (e) {
            console.error('LedWall fetch error', e);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, REFRESH_INTERVAL);

        const channel = supabase
            .channel('ledwall_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tract_users' }, () => fetchData())
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    const heroFont = isMonitor ? 140 : 80;
    const heroLabelFont = isMonitor ? 22 : 14;
    const statFont = isMonitor ? 72 : 44;
    const statLabelFont = isMonitor ? 18 : 12;
    const manyRows = regionRows.length > 5;
    const rowNameFont = isMonitor ? (manyRows ? 34 : 40) : (manyRows ? 20 : 24);
    const rowCountFont = isMonitor ? (manyRows ? 40 : 48) : (manyRows ? 24 : 30);
    const rankFont = isMonitor ? (manyRows ? 26 : 32) : (manyRows ? 16 : 20);

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>

                {/* Title bar */}
                <View style={styles.titleBar}>
                    <Text style={[styles.title, { fontSize: isMonitor ? 26 : 17 }]}>
                        NATIONAL TRACTS GIVING DAY
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: isMonitor ? 13 : 10 }]}>
                        LIVE COUNT · as of {lastUpdated}
                    </Text>
                </View>

                {/* Split body */}
                <View style={styles.splitRow}>

                    {/* Left — big totals */}
                    <View style={styles.leftCol}>
                        <Text style={[styles.heroNumber, { fontSize: heroFont, lineHeight: heroFont * 1.05 }]}>
                            {totalTracts.toLocaleString()}
                        </Text>
                        <Text style={[styles.heroLabel, { fontSize: heroLabelFont }]}>
                            TOTAL TRACTS GIVEN
                        </Text>

                        <View style={styles.leftDivider} />

                        <Text style={[styles.statNumber, { fontSize: statFont }]}>
                            {totalParticipants.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { fontSize: statLabelFont }]}>
                            PARTICIPANTS
                        </Text>
                    </View>

                    {/* Right — ranked list */}
                    <View style={styles.rightCol}>
                        {regionRows.map((row, i) => (
                            <View
                                key={row.name}
                                style={[styles.row, i < regionRows.length - 1 && styles.rowDivider]}
                            >
                                <Text style={[styles.rankText, { fontSize: rankFont }, i === 0 && styles.rankTextFirst]}>
                                    {row.rank}
                                </Text>
                                <Text style={[styles.nameText, { fontSize: rowNameFont }, i === 0 && styles.nameTextFirst]} numberOfLines={1}>
                                    {row.name}
                                </Text>
                                <Text style={[styles.countText, { fontSize: rowCountFont }, i === 0 && styles.countTextFirst]}>
                                    {row.count.toLocaleString()}
                                </Text>
                            </View>
                        ))}

                        {regionRows.length === 0 && (
                            <Text style={styles.emptyText}>No data yet. Start giving tracts!</Text>
                        )}
                    </View>
                </View>

                {/* Footer ticker */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { fontSize: isMonitor ? 14 : 10 }]}>
                        COG Philippines · Outside is Beautiful · Auto-refreshes every 30 seconds
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

    titleBar: { alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
    title: { color: '#C9A84C', letterSpacing: 3, fontFamily: 'Anton_400Regular' },
    subtitle: { color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginTop: 4 },

    splitRow: { flex: 1, flexDirection: 'row' },

    leftCol: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        borderRightWidth: 1, borderRightColor: 'rgba(201,168,76,0.25)',
        paddingHorizontal: 16,
    },
    heroNumber: {
        color: '#fff', fontFamily: 'Anton_400Regular', textAlign: 'center',
        textShadowColor: 'rgba(201,168,76,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
    },
    heroLabel: { color: '#C9A84C', letterSpacing: 4, fontFamily: 'Anton_400Regular', marginTop: 6, textAlign: 'center' },

    leftDivider: { width: '60%', height: 1, backgroundColor: 'rgba(201,168,76,0.25)', marginVertical: 28 },

    statNumber: { color: '#fff', fontFamily: 'Anton_400Regular', textAlign: 'center' },
    statLabel: { color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginTop: 4, textAlign: 'center' },

    rightCol: { flex: 1.2, paddingHorizontal: 28, justifyContent: 'center' },
    row: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        maxHeight: 110,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },

    rankText: { color: 'rgba(255,255,255,0.35)', fontFamily: 'Anton_400Regular', width: 56 },
    rankTextFirst: { color: '#C9A84C' },

    nameText: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Anton_400Regular', flex: 1, letterSpacing: 0.5 },
    nameTextFirst: { color: '#fff' },

    countText: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Anton_400Regular', textAlign: 'right' },
    countTextFirst: { color: '#C9A84C' },

    emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 16 },

    footer: {
        borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.3)',
        paddingVertical: 10, paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    footerText: { color: '#C9A84C', letterSpacing: 1, textAlign: 'center' },
});
