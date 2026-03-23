import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ImageBackground, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };

export default function ActionScreen() {
    const { user, authState, signOut } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [regionalCount, setRegionalCount] = useState<number>(0);
    const [personalCount, setPersonalCount] = useState<number>(0);
    const [isIncrementing, setIsIncrementing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadCounts = useCallback(async () => {
        if (!user) return;
        try {
            // Personal count
            const { data: userData } = await supabase
                .from('tract_users')
                .select('tracts_given')
                .eq('user_id', user.id)
                .single();
            if (userData) setPersonalCount(userData.tracts_given ?? 0);

            // Regional count
            const { data: regionData } = await supabase
                .from('tract_users')
                .select('tracts_given')
                .eq('region', authState.region || 'MMR');
            if (regionData) {
                const total = regionData.reduce((sum, r) => sum + (r.tracts_given ?? 0), 0);
                setRegionalCount(total);
            }
        } catch (e) {
            console.error('loadCounts error', e);
        } finally {
            setIsLoading(false);
        }
    }, [user, authState.region]);

    useEffect(() => {
        loadCounts();
    }, [loadCounts]);

    const handleIncrement = async () => {
        if (!user || isIncrementing) return;
        setIsIncrementing(true);
        try {
            const { error } = await supabase.rpc('increment_tracts', { uid: user.id });
            if (error) throw error;
            setPersonalCount(prev => prev + 1);
            setRegionalCount(prev => prev + 1);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not update count');
        } finally {
            setIsIncrementing(false);
        }
    };

    const handleAdminNav = () => navigation.navigate('AdminDashboard');

    const regionLabel = authState.region || 'MMR';
    const subLabel = authState.subRegion ? `${authState.region} › ${authState.subRegion}` : regionLabel;

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleAdminNav} style={styles.adminBtn}>
                        <Text style={styles.adminBtnText}>Admin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <View style={styles.titleBlock}>
                    <Text style={styles.titleSmall}>COG NATION</Text>
                    <Text style={styles.titleMain}>National Tracts{'\n'}Giving Day</Text>
                    <Text style={styles.regionLabel}>{subLabel}</Text>
                </View>

                {/* Regional count */}
                {isLoading ? (
                    <ActivityIndicator color="#FFD700" size="large" style={{ marginVertical: 24 }} />
                ) : (
                    <Text style={styles.regionalCount}>{regionalCount.toLocaleString()}</Text>
                )}
                <Text style={styles.regionalCountLabel}>tracts given in {regionLabel}</Text>

                {/* Personal card */}
                <View style={styles.card}>
                    <Text style={styles.cardName}>{authState.name || 'You'}</Text>
                    <Text style={styles.cardSub}>{authState.barangay || authState.subRegion || authState.region}</Text>

                    <View style={styles.cardCountRow}>
                        <Text style={styles.cardCount}>{personalCount}</Text>
                        <Text style={styles.cardCountLabel}>tracts given</Text>
                    </View>

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
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,40,0.72)' },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    adminBtn: { padding: 8 },
    adminBtnText: { color: '#FFD700', fontWeight: '700', fontSize: 14 },
    signOutBtn: { padding: 8 },
    signOutText: { color: '#aaa', fontSize: 14 },
    titleBlock: { alignItems: 'center', marginTop: 24, paddingHorizontal: 20 },
    titleSmall: { color: '#FFD700', fontSize: 13, fontWeight: '700', letterSpacing: 4 },
    titleMain: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 42,
        marginTop: 6,
    },
    regionLabel: { color: '#FFD700', fontSize: 16, fontWeight: '600', marginTop: 10 },
    regionalCount: {
        color: '#FFD700',
        fontSize: 72,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 16,
        letterSpacing: -2,
    },
    regionalCountLabel: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    card: {
        marginHorizontal: 24,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    cardName: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    cardSub: { fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 16 },
    cardCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 20 },
    cardCount: { fontSize: 56, fontWeight: '900', color: '#1a1a2e' },
    cardCountLabel: { fontSize: 16, color: '#64748b', fontWeight: '600' },
    plusBtn: {
        backgroundColor: '#FFD700',
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    plusBtnDisabled: { opacity: 0.6 },
    plusBtnText: { fontSize: 28, fontWeight: '900', color: '#1a1a2e' },
});
