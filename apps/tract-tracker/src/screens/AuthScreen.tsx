import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, FlatList, useWindowDimensions, ImageBackground, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import { useAuth } from '../context/AuthContext';

const REGIONS = ['NLR', 'SLR', 'MMR', 'Vis', 'Min'];
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
    'Victoria Reyes', 'Zone I', 'Zone I-B', 'Zone II', 'Zone III', 'Zone IV'
];

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const [subRegion, setSubRegion] = useState('');
    const [barangay, setBarangay] = useState('');
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const filteredBarangays = BARANGAYS.filter(b =>
        b.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { signIn, signUp } = useAuth();

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }
        setIsSubmitting(true);
        if (isLogin) {
            const { error } = await signIn(email, password);
            if (error) {
                Alert.alert('Login Failed', error);
                setIsSubmitting(false);
                return;
            }
        } else {
            const { error } = await signUp(email, password, {
                region: region || 'Unknown',
                subRegion: subRegion || 'Unknown',
                barangay,
            });
            if (error) {
                Alert.alert('Sign Up Failed', error);
                setIsSubmitting(false);
                return;
            }
        }
        setIsSubmitting(false);
        navigation.replace('Main');
    };

    const renderAuthForm = () => (
        <View style={isDesktop ? styles.desktopFormContainer : styles.fullWidthContainer}>
            <View style={styles.formInner}>
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>TractTracker</Text>
                </View>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity onPress={() => setIsLogin(true)} style={[styles.toggleBtn, isLogin && styles.activeBtn]}>
                        <Text style={[styles.toggleText, isLogin && styles.activeText]}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsLogin(false)} style={[styles.toggleBtn, !isLogin && styles.activeBtn]}>
                        <Text style={[styles.toggleText, !isLogin && styles.activeText]}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {!isLogin && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            value={name}
                            onChangeText={setName}
                        />
                        {/* Simple mock selects for regions */}
                        <Text style={styles.label}>Select Region</Text>
                        <View style={styles.rowWrap}>
                            {REGIONS.map((r) => (
                                <TouchableOpacity key={r} onPress={() => { setRegion(r); setSubRegion(''); setBarangay(''); }} style={[styles.chip, region === r && styles.chipActive]}>
                                    <Text style={[styles.chipText, region === r && styles.chipTextActive]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {region === 'MMR' && (
                            <>
                                <Text style={styles.label}>Church</Text>
                                <View style={styles.rowWrap}>
                                    {CHURCHES.map((sr) => (
                                        <TouchableOpacity key={sr} onPress={() => { setSubRegion(sr); setBarangay(''); }} style={[styles.chip, subRegion === sr && styles.chipActive]}>
                                            <Text style={[styles.chipText, subRegion === sr && styles.chipTextActive]}>{sr}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {region === 'MMR' && subRegion === 'Dasmarinas' && (
                            <>
                                <Text style={styles.label}>Barangay</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowBarangayModal(true)}
                                >
                                    <Text style={[styles.dropdownText, !barangay && styles.placeholderText]}>
                                        {barangay || 'Select Barangay'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#666" />
                                </TouchableOpacity>

                                <Modal visible={showBarangayModal} animationType="slide" transparent>
                                    <SafeAreaView style={styles.modalOverlay}>
                                        <View style={isDesktop ? styles.desktopModalContent : styles.modalContent}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.modalTitle}>Select Barangay</Text>
                                                <TouchableOpacity onPress={() => setShowBarangayModal(false)}>
                                                    <Ionicons name="close" size={24} color="#333" />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.searchContainer}>
                                                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
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
                                                keyExtractor={(item) => item}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={styles.barangayItem}
                                                        onPress={() => {
                                                            setBarangay(item);
                                                            setShowBarangayModal(false);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <Text style={[styles.barangayItemText, barangay === item && styles.selectedItemText]}>
                                                            {item}
                                                        </Text>
                                                        {barangay === item && <Ionicons name="checkmark" size={20} color="#4a90e2" />}
                                                    </TouchableOpacity>
                                                )}
                                                contentContainerStyle={styles.listContent}
                                            />
                                        </View>
                                    </SafeAreaView>
                                </Modal>
                            </>
                        )}
                    </>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={isSubmitting}>
                    {isSubmitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.primaryButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            {isDesktop ? (
                <View style={styles.desktopContainer}>
                    <View style={styles.desktopGraphicContainer}>
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1517482810332-9c3dbbd33682?q=80&w=2699&auto=format&fit=crop' }}
                            style={styles.graphicBackground}
                            resizeMode="cover"
                        >
                            <View style={styles.graphicOverlay}>
                                <Text style={styles.graphicTitle}>COG Nation Tracks</Text>
                                <Text style={styles.graphicSubtitle}>Join the Giving Day initiative and track your impact across Dasmariñas City.</Text>
                            </View>
                        </ImageBackground>
                    </View>
                    <ScrollView contentContainerStyle={styles.desktopScrollView}>
                        {renderAuthForm()}
                    </ScrollView>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.container}>
                    {renderAuthForm()}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fcfcfc' },
    container: { flexGrow: 1, justifyContent: 'center' },
    fullWidthContainer: { flex: 1, padding: 20 },
    desktopContainer: { flex: 1, flexDirection: 'row' },
    desktopGraphicContainer: { flex: 1, backgroundColor: '#000' },
    graphicBackground: { flex: 1, justifyContent: 'center' },
    graphicOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
    graphicTitle: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginBottom: 16 },
    graphicSubtitle: { color: '#ddd', fontSize: 20, lineHeight: 30 },
    desktopScrollView: { flexGrow: 1, flexBasis: '50%', justifyContent: 'center', backgroundColor: '#fcfcfc' },
    desktopFormContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    formInner: { width: '100%', maxWidth: 450, backgroundColor: '#fff', padding: 30, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    logoPlaceholder: { height: 120, width: 120, backgroundColor: '#4a90e2', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', borderRadius: 60, marginBottom: 40 },
    logoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    toggleContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#eee', borderRadius: 8, padding: 4 },
    toggleBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 6 },
    activeBtn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    toggleText: { fontSize: 16, fontWeight: '600', color: '#666' },
    activeText: { color: '#333' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 16, fontSize: 16, marginBottom: 16 },
    primaryButton: { backgroundColor: '#4a90e2', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 10, color: '#333' },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    chip: { borderWidth: 1, borderColor: '#4a90e2', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, marginBottom: 8 },
    chipActive: { backgroundColor: '#4a90e2' },
    chipText: { color: '#4a90e2', fontWeight: '500' },
    chipTextActive: { color: '#fff' },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    dropdownText: { fontSize: 16, color: '#333' },
    placeholderText: { color: '#999' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', padding: 20, width: '100%' },
    desktopModalContent: { backgroundColor: '#fff', borderRadius: 20, height: '80%', padding: 20, width: '100%', maxWidth: 500, alignSelf: 'center', top: '10%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 15,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 45, fontSize: 16 },
    barangayItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    barangayItemText: { fontSize: 16, color: '#444' },
    selectedItemText: { color: '#4a90e2', fontWeight: 'bold' },
    listContent: { paddingBottom: 20 },
});
