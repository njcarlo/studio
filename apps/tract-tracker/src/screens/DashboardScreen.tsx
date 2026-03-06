import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AnimatedCounter from '../components/AnimatedCounter';

const STATS = [
    { label: 'Total in the Philippines 🇵🇭', value: 8900, color: '#e74c3c', bg: '#fdecea', size: 'huge' },
    { label: 'Metro Manila Region', value: 1243, color: '#3498db', bg: '#e8f4fd', size: 'large' },
    { label: 'Dasmariñas City', value: 450, color: '#27ae60', bg: '#e8f7ee', size: 'large' },
    { label: 'Your Personal Total', value: 12, color: '#9b59b6', bg: '#f3ecfb', size: 'large' },
];

export default function DashboardScreen() {
    const { width } = useWindowDimensions();
    const isWide = width >= 640;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <Text style={styles.headerSub}>Live tract distribution overview</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>
                {/* Hero stat — always full width */}
                <View style={[styles.heroCard, { backgroundColor: STATS[0].bg }]}>
                    <Text style={[styles.heroLabel, { color: STATS[0].color }]}>{STATS[0].label}</Text>
                    <AnimatedCounter value={STATS[0].value} fontSize={isWide ? 68 : 54} color={STATS[0].color} />
                    <Text style={styles.heroSub}>tracts handed out</Text>
                </View>

                {/* Responsive grid for the rest */}
                <View style={[styles.grid, isWide && styles.gridWide]}>
                    {STATS.slice(1).map((stat, i) => (
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
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
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
    heroLabel: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    heroSub: { fontSize: 14, color: '#94a3b8', marginTop: 8, fontWeight: '600' },

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

    statLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, textAlign: 'center' },
});
