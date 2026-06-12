import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AnimatedCounter from '../components/AnimatedCounter';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const REFRESH_INTERVAL = 30_000;

type Stat = { label: string; value: number; color: string; bg: string };
type TractAggregates = {
    grand_total: number;
    total_participants: number;
    by_region: Record<string, number>;
    by_barangay: Record<string, number>;
};

export default function DashboardScreen() {
    const { width } = useWindowDimensions();
    const isWide = width >= 640;
    const { user } = useAuth();

    const [stats, setStats] = useState<Stat[]>([
        { label: 'Total in the Philippines 🇵🇭', value: 0, color: '#e74c3c', bg: '#fdecea' },
        { label: 'Metro Manila Region', value: 0, color: '#3498db', bg: '#e8f4fd' },
        { label: 'Dasmariñas City', value: 0, color: '#27ae60', bg: '#e8f7ee' },
        { label: 'Your Personal Total', value: 0, color: '#9b59b6', bg: '#f3ecfb' },
    ]);

    const fetchStats = useCallback(async () => {
        // Single aggregated RPC instead of paging the full tract_users table.
        const { data: raw, error } = await supabase.rpc('get_tract_aggregates').single();
        if (error || !raw) return;
        const data = raw as unknown as TractAggregates;

        const byRegion = (data.by_region ?? {}) as Record<string, number>;
        const national = Number(data.grand_total ?? 0);
        const mmr = byRegion['MMR'] ?? 0;
        const dasmarinas = byRegion['COG Dasmarinas'] ?? 0;

        let personal = 0;
        if (user?.id) {
            const { data: me } = await supabase
                .from('tract_users')
                .select('tracts_given')
                .eq('id', user.id)
                .maybeSingle();
            personal = me?.tracts_given ?? 0;
        }

        setStats([
            { label: 'Total in the Philippines 🇵🇭', value: national, color: '#e74c3c', bg: '#fdecea' },
            { label: 'Metro Manila Region', value: mmr, color: '#3498db', bg: '#e8f4fd' },
            { label: 'Dasmariñas City', value: dasmarinas, color: '#27ae60', bg: '#e8f7ee' },
            { label: 'Your Personal Total', value: personal, color: '#9b59b6', bg: '#f3ecfb' },
        ]);
    }, [user?.id]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, REFRESH_INTERVAL);
        const channel = supabase
            .channel('dashboard_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tract_users' }, () => fetchStats())
            .subscribe();
        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [fetchStats]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <Text style={styles.headerSub}>Live tract distribution overview</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>
                {/* Hero stat — always full width */}
                <View style={[styles.heroCard, { backgroundColor: stats[0].bg }]}>
                    <Text style={[styles.heroLabel, { color: stats[0].color }]}>{stats[0].label}</Text>
                    <AnimatedCounter value={stats[0].value} fontSize={isWide ? 68 : 54} color={stats[0].color} />
                    <Text style={styles.heroSub}>tracts handed out</Text>
                </View>

                {/* Responsive grid for the rest */}
                <View style={[styles.grid, isWide && styles.gridWide]}>
                    {stats.slice(1).map((stat, i) => (
                        <View key={i} style={[styles.statCard, { backgroundColor: stat.bg }, isWide && styles.statCardWide]}>
                            <Text style={[styles.statLabel, { color: stat.color }]}>{stat.label}</Text>
                            <AnimatedCounter value={stat.value} fontSize={isWide ? 44 : 36} color={stat.color} />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f4f8' },

    header: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e8ecf0',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, color: '#1a1a2e', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

    container: { padding: 20, paddingBottom: 40 },
    containerWide: { maxWidth: 800, alignSelf: 'center', width: '100%' },

    heroCard: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    heroLabel: { fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    heroSub: { fontSize: 14, color: '#94a3b8', marginTop: 8 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridWide: {},

    statCard: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        marginBottom: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    statCardWide: { width: '31.5%' },

    statLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, textAlign: 'center' },
});
