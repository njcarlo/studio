import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const EVENT_DATE = new Date('2026-06-12T00:00:00+08:00'); // June 12, Philippine time

// adding fonts
import {
  Inter_400Regular,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

// font loading
const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
});

// image import
const Ntgd = require("../../assets/ntgd.png");
const Obpng =  require("../../assets/obpng.png");

const REMINDERS = [
    'Small Bag',
    'Water bottle',
    'Snacks',
    'Umbrella or cap',
    'Face towel / wipes',
    'Tracts',
];

function getTimeLeft() {
    const now = new Date();
    const diff = EVENT_DATE.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
}

export default function CountdownScreen() {
    const { authState, signOut } = useAuth();
    const [timeLeft, setTimeLeft] = useState(getTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(getTimeLeft()), 60_000);
        return () => clearInterval(timer);
    }, []);

    const firstName = authState.name ? authState.name.split(' ')[0] : 'Friend';

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Title */}
                    <Image style={styles.title} source={Ntgd}/>
                    <Image style={styles.ob} source={Obpng}/>

                    {/* Greeting */}
                    <Text style={styles.greeting}>Hello, {firstName}!</Text>

                    {/* Countdown tiles */}
                    {timeLeft && (
                        <View style={styles.tilesRow}>
                            <CountTile value={timeLeft.days} label="DAYS" />
                            <CountTile value={timeLeft.hours} label="HOURS" />
                            <CountTile value={timeLeft.minutes} label="MINUTES" />
                        </View>
                    )}

                    {/* Reminders */}
                    <View style={styles.remindersBox}>
                        <Text style={styles.remindersTitle}>Things to bring:</Text>
                        {REMINDERS.map((r, i) => (
                            <Text key={i} style={styles.reminderItem}>• {r}</Text>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

function CountTile({ value, label }: { value: number; label: string }) {
    return (
        <View style={styles.tileWrap}>
            <View style={styles.tile}>
                <Text style={styles.tileNumber}>{value}</Text>
            </View>
            <Text style={styles.tileLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,60,0.78)' },
    safe: { flex: 1 },
    scroll: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 },
    
    // Image of national tract distribution and logo
    ntgd: { width: 324, height: 216, resizeMode: "contain", left: -10 },
    ob: { width: 302, height: 201, resizeMode: "contain", marginTop: -130, left: -20 },

    title: { color: '#C9A84C', fontSize: 48, lineHeight: 54, marginBottom: 10, fontFamily: 'Anton_400Regular' },
    script: { color: '#fff', fontSize: 22, fontStyle: 'italic', marginBottom: 36, opacity: 0.9, fontFamily: 'Inter_400Regular_Italic' },
    greeting: { color: '#fff', fontSize: 26, marginBottom: 24, fontFamily: 'Anton_400Regular' },
    tilesRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 36 },
    tileWrap: { alignItems: 'center' },
    tile: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: 90,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    tileNumber: { fontSize: 40, color: '#1a1a2e', fontFamily: 'Anton_400Regular' },
    tileLabel: { color: '#ccc', fontSize: 11, letterSpacing: 1.5, marginTop: 8, fontFamily: 'Anton_400Regular' },

    remindersBox: { marginBottom: 36 },
    remindersTitle: { color: '#fff', fontSize: 16, marginBottom: 12 },
    reminderItem: { color: '#ddd', fontSize: 14, lineHeight: 26 },

    signOutBtn: { alignSelf: 'center' },
    signOutText: { color: '#aaa', fontSize: 13 },
});
