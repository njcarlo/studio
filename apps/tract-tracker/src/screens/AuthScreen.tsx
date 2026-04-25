import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Modal, FlatList, ImageBackground, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// adding fonts
import {
  Inter_400Regular,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

// image import
const Ntgd = require("../../assets/ntgd.png");
const Obpng =  require("../../assets/obpng.png");

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };

const REGIONS = ['NLR', 'SLR', 'MMR', 'VIS', 'MIN', 'COG Dasmarinas'];
const CHURCHES = ['Dasmarinas', 'Others'];
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

type Screen = 'landing' | 'login' | 'signup';

export default function AuthScreen() {
    const [screen, setScreen] = useState<Screen>('landing');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const [subRegion, setSubRegion] = useState('');
    const [barangay, setBarangay] = useState('');
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showChurchModal, setShowChurchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { signIn, signUp } = useAuth();

    const filteredBarangays = BARANGAYS.filter(b =>
        b.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // font loading
    const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    });

    if (!fontsLoaded) return null;

    const handleAuth = async () => {
        if (!__DEV__ && (!email || !password)) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }
        setIsSubmitting(true);
        if (screen === 'login') {
            const { error } = await signIn(email, password);
            if (error) { Alert.alert('Login Failed', error); setIsSubmitting(false); return; }
        } else {
            const { error } = await signUp(email, password, {
                name,
                region: region || '',
                subRegion: subRegion || '',
                barangay,
            });
            if (error) { Alert.alert('Sign Up Failed', error); setIsSubmitting(false); return; }
        }
        setIsSubmitting(false);
    };

    // ── Landing screen ──────────────────────────────────────────────
    if (screen === 'landing') {
        return (
            <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
                <View style={styles.overlay} />
                <SafeAreaView style={styles.landingSafe}>
                    <View style={styles.landingContent}>
                        <Text style={styles.landingEyebrow}>Ready to step out{'\n'}and spread the{'\n'}good news?</Text>
                        <Image source={Ntgd} style={styles.ntgd} />
                        <Image source={Obpng} style={styles.bo} />
                    </View>

                    <View style={styles.landingBottom}>
                        <TouchableOpacity style={styles.loginBtn} onPress={() => setScreen('login')}>
                            <Text style={styles.loginBtnText}>Login</Text>
                        </TouchableOpacity>
                        <Text style={styles.signupPrompt}>
                            Don't have an account yet?{' '}
                            <Text style={styles.signupLink} onPress={() => setScreen('signup')}>Sign up</Text>
                        </Text>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        );
    }

    // ── Login / Sign up form ─────────────────────────────────────────
    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.formSafe}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">

                        {/* Back */}
                        <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('landing')}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>

                        {/* Header */}
                        <Image style={styles.ntgd} source={Ntgd} />
                        <Image style={styles.bo} source={Obpng} />
                        <Text style={styles.formTitle}>{screen === 'login' ? 'Welcome back' : 'Create account'}</Text>
                        

                        {/* Card */}
                        <View style={styles.card}>
                            {screen === 'signup' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                />
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            {screen === 'signup' && (
                                <>
                                    <Text style={styles.label}>Region</Text>
                                    <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowRegionModal(true)}>
                                        <Text style={[styles.dropdownText, !region && styles.placeholderText]}>
                                            {region || 'Select Region'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color="#666" />
                                    </TouchableOpacity>

                                    {region === 'MMR' && (
                                        <>
                                            <Text style={styles.label}>Church</Text>
                                            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowChurchModal(true)}>
                                                <Text style={[styles.dropdownText, !subRegion && styles.placeholderText]}>
                                                    {subRegion || 'Select Church'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={18} color="#666" />
                                            </TouchableOpacity>
                                        </>
                                    )}

                                    {region === 'COG Dasmarinas' && (
                                        <>
                                            <Text style={styles.label}>Barangay</Text>
                                            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowBarangayModal(true)}>
                                                <Text style={[styles.dropdownText, !barangay && styles.placeholderText]}>
                                                    {barangay || 'Select Barangay'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={18} color="#666" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </>
                            )}

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAuth} disabled={isSubmitting}>
                                {isSubmitting
                                    ? <ActivityIndicator color="#1a1a2e" />
                                    : <Text style={styles.submitBtnText}>{screen === 'login' ? 'Login' : 'Sign Up'}</Text>
                                }
                            </TouchableOpacity>

                            <Text style={styles.switchPrompt}>
                                {screen === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                <Text
                                    style={styles.switchLink}
                                    onPress={() => setScreen(screen === 'login' ? 'signup' : 'login')}
                                >
                                    {screen === 'login' ? 'Sign up' : 'Login'}
                                </Text>
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Region modal */}
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
                                <Text style={[styles.barangayItemText, region === r && styles.selectedItemText]}>{r}</Text>
                                {region === r && <Ionicons name="checkmark" size={18} color="#C9A84C" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Church modal */}
            <Modal visible={showChurchModal} animationType="slide" transparent>
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Church</Text>
                            <TouchableOpacity onPress={() => setShowChurchModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {CHURCHES.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={styles.barangayItem}
                                onPress={() => { setSubRegion(c); setBarangay(''); setShowChurchModal(false); }}
                            >
                                <Text style={[styles.barangayItemText, subRegion === c && styles.selectedItemText]}>{c}</Text>
                                {subRegion === c && <Ionicons name="checkmark" size={18} color="#C9A84C" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Barangay modal */}
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

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,60,0.75)' },

    // Image of national tract distribution and logo
    ntgd: { width: 324, height: 216, resizeMode: "contain", left: -20 },
    bo: { width: 302, height: 201, resizeMode: "contain", marginTop: -130, left: -30 },

    // ── Landing ──
    landingSafe: { flex: 1, justifyContent: 'space-between' },
    landingContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
    landingEyebrow: { 
        color: '#fff', 
        fontSize: 28, 
        lineHeight: 34, 
        marginBottom: -10,
        fontFamily: 'Inter_700Bold'
    },
    landingTitle: {
        color: '#C9A84C',
        fontSize: 52,
        lineHeight: 58,
        marginBottom: 16,
        fontFamily: 'Anton_400Regular',
    },
    landingScript: {
        color: '#fff',
        fontSize: 26,
        fontStyle: 'italic',
        fontWeight: '400',
        opacity: 0.9,
        fontFamily: 'Inter_400Regular_Italic',
    },
    landingBottom: { paddingHorizontal: 32, paddingBottom: 48 },
    loginBtn: {
        backgroundColor: '#C9A84C',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#C9A84C',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    loginBtnText: { color: '#1a1a2e', fontSize: 18, fontFamily: 'Anton_400Regular' },
    signupPrompt: { color: '#ccc', fontSize: 14, textAlign: 'center' },
    signupLink: { color: '#C9A84C', textDecorationLine: 'underline' },

    // ── Form ──
    formSafe: { flex: 1 },
    formScroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    backBtn: { marginTop: 12, marginBottom: 24, alignSelf: 'flex-start', padding: 4 },
    formTitle: { color: '#fff', fontSize: 32, marginBottom: 64, marginTop: -40, fontFamily: 'Inter_700Bold' },
    formSub: { color: '#C9A84C', fontSize: 14, marginBottom: 28, letterSpacing: 1, fontFamily: 'Inter_700Bold',  },
    card: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        marginBottom: 14,
        color: '#1a1a2e',
    },
    label: { fontSize: 13, color: '#444', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    dropdownTrigger: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, marginBottom: 14,
    },
    dropdownText: { fontSize: 15, color: '#1a1a2e' },
    placeholderText: { color: '#999' },
    submitBtn: {
        backgroundColor: '#C9A84C',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#C9A84C',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    submitBtnText: { color: '#1a1a2e', fontSize: 17, fontFamily: 'Anton_400Regular' },
    switchPrompt: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 16 },
    switchLink: { color: '#C9A84C' },

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
});
