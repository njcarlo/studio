import React, { useRef, useState, useEffect } from 'react';
import {
    Animated,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import AnimatedCounter from '../components/AnimatedCounter';
import { useAuth } from '../context/AuthContext';

const INITIAL_NATIONAL_COUNT = 8900;
const INITIAL_REGIONAL_COUNT = 1243;
const INITIAL_CITY_COUNT = 450;
const INITIAL_PERSONAL_COUNT = 12;

export default function ActionScreen() {
    const { width } = useWindowDimensions();
    const isWide = width >= 640;
    const { authState } = useAuth();

    // Provide fallbacks if they bypassed auth somehow
    const currentRegion = authState.region || 'Region';
    const currentCity = authState.subRegion || 'City';

    // Counts State (Mocking updates for the locked session)
    const [nationalCount, setNationalCount] = useState(INITIAL_NATIONAL_COUNT);
    const [regionCount, setRegionCount] = useState(INITIAL_REGIONAL_COUNT);
    const [cityCount, setCityCount] = useState(INITIAL_CITY_COUNT);
    const [personalCount, setPersonalCount] = useState(INITIAL_PERSONAL_COUNT);

    const [isCooldown, setIsCooldown] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleGive = () => {
        if (isCooldown) return;

        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 50 }),
            Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, speed: 20, bounciness: 12 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();

        // Increment all hierarchical levels for the locked location
        setNationalCount(prev => prev + 1);
        setRegionCount(prev => prev + 1);
        setCityCount(prev => prev + 1);
        setPersonalCount(prev => prev + 1);

        setIsCooldown(true);
        setTimeout(() => setIsCooldown(false), 1000);
    };

    const renderLocationDisplay = (label: string, value: string) => (
        <View style={styles.locationDisplay}>
            <Text style={styles.pickerLabel}>{label}</Text>
            <Text style={styles.pickerValue}>{value}</Text>
        </View>
    );

    const buttonSize = isWide ? 240 : 200;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>COG Nation Tracks Giving Day</Text>
                <Text style={styles.headerSub}>Every tract counts 🙏</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>

                {/* Locked Location Display */}
                <View style={styles.selectionRow}>
                    {renderLocationDisplay('Region', currentRegion)}
                    <View style={{ width: 12 }} />
                    {renderLocationDisplay('City', currentCity)}
                </View>

                {/* Stats Grid */}
                <Text style={styles.sectionLabel}>Live Progress</Text>
                <View style={[styles.statsGrid, isWide && styles.statsGridWide]}>
                    {/* Philippines */}
                    <View style={[styles.statCard, { backgroundColor: '#fdecea' }, isWide && styles.statCardWide]}>
                        <Text style={[styles.statLabel, { color: '#e74c3c' }]}>Philippines 🇵🇭</Text>
                        <AnimatedCounter value={nationalCount} fontSize={isWide ? 36 : 28} color="#e74c3c" />
                    </View>

                    {/* Region */}
                    <View style={[styles.statCard, { backgroundColor: '#e8f4fd' }, isWide && styles.statCardWide]}>
                        <Text style={[styles.statLabel, { color: '#3498db' }]}>{currentRegion}</Text>
                        <AnimatedCounter value={regionCount} fontSize={isWide ? 36 : 28} color="#3498db" />
                    </View>

                    {/* City */}
                    <View style={[styles.statCard, { backgroundColor: '#e8f7ee' }, isWide && styles.statCardWide]}>
                        <Text style={[styles.statLabel, { color: '#27ae60' }]}>{currentCity}</Text>
                        <AnimatedCounter value={cityCount} fontSize={isWide ? 36 : 28} color="#27ae60" />
                    </View>

                    {/* Personal */}
                    <View style={[styles.statCard, { backgroundColor: '#f3ecfb' }, isWide && styles.statCardWide]}>
                        <Text style={[styles.statLabel, { color: '#9b59b6' }]}>You</Text>
                        <AnimatedCounter value={personalCount} fontSize={isWide ? 36 : 28} color="#9b59b6" />
                    </View>
                </View>

                {/* Big Give Button */}
                <View style={styles.buttonWrapper}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            style={[
                                styles.giveButton,
                                { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
                                isCooldown && styles.giveButtonDisabled,
                            ]}
                            onPress={handleGive}
                            disabled={isCooldown}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.giveButtonEmoji}>{isCooldown ? '🙏' : '✋'}</Text>
                            <Text style={styles.giveButtonText}>
                                {isCooldown ? 'Thank you!' : 'I Gave a Tract'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <Text style={styles.hint}>Tap each time you hand out a tract</Text>
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
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

    container: { padding: 20, alignItems: 'center', paddingBottom: 40 },
    containerWide: { maxWidth: 700, alignSelf: 'center', width: '100%' },

    selectionRow: { flexDirection: 'row', marginBottom: 24, width: '100%' },
    locationDisplay: {
        flex: 1,
        backgroundColor: '#f8fafc', // slightly disabled look compared to white pickers
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        opacity: 0.9,
    },
    pickerLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
    pickerValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },

    sectionLabel: {
        alignSelf: 'flex-start',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: '#94a3b8',
        marginBottom: 10,
    },

    statsGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
    statsGridWide: {},

    statCard: {
        width: '48%',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    statCardWide: { width: '23%' },

    statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, textAlign: 'center' },

    buttonWrapper: { alignItems: 'center', marginTop: 4 },
    giveButton: {
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#e74c3c',
        shadowOpacity: 0.45,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
    },
    giveButtonDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
    giveButtonEmoji: { fontSize: 42, marginBottom: 6 },
    giveButtonText: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
    hint: { marginTop: 16, fontSize: 13, color: '#94a3b8', textAlign: 'center' },
});
