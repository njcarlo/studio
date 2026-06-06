import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
    ScrollView, ActivityIndicator, Alert, Modal, Platform,
    KeyboardAvoidingView, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { supabaseAdmin } from '../supabase';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };

interface Post {
    id: string;
    image_url: string;
    caption: string;
    created_at: string;
}

export default function CorrespondentScreen() {
    const { user, authState } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedUri, setSelectedUri] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);

    const fetchMyPosts = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data } = await supabaseAdmin
                .from('correspondent_posts')
                .select('id, image_url, caption, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            setPosts(data ?? []);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchMyPosts(); }, [fetchMyPosts]);

    const requestPermission = async () => {
        if (Platform.OS === 'web') return true;
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take photos.');
            return false;
        }
        return true;
    };

    const openCamera = async () => {
        const ok = await requestPermission();
        if (!ok) return;
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setSelectedUri(result.assets[0].uri);
            setCaption('');
            setShowModal(true);
        }
    };

    const openGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setSelectedUri(result.assets[0].uri);
            setCaption('');
            setShowModal(true);
        }
    };

    const handleUpload = async () => {
        if (!selectedUri || !user?.id) return;
        setUploading(true);
        try {
            // Convert URI to blob for upload
            const response = await fetch(selectedUri);
            const blob = await response.blob();
            const fileName = `${user.id}/${Date.now()}.jpg`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('correspondent-photos')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabaseAdmin.storage
                .from('correspondent-photos')
                .getPublicUrl(fileName);

            const { error: insertError } = await supabaseAdmin
                .from('correspondent_posts')
                .insert({
                    user_id: user.id,
                    user_name: authState.name || user.email,
                    region: authState.region || '',
                    image_url: urlData.publicUrl,
                    caption: caption.trim(),
                });

            if (insertError) throw insertError;

            setShowModal(false);
            setSelectedUri(null);
            setCaption('');
            await fetchMyPosts();
        } catch (e: any) {
            Alert.alert('Upload failed', e.message || 'Something went wrong. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
            ' · ' +
            d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Field Reports</Text>
                        <Text style={styles.headerSub}>
                            {authState.name || user?.email} · {authState.region || 'Correspondent'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerBtn} onPress={openGallery}>
                            <Ionicons name="images-outline" size={22} color="#C9A84C" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerBtn} onPress={openCamera}>
                            <Ionicons name="camera-outline" size={22} color="#C9A84C" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My posts */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#C9A84C" />
                    </View>
                ) : posts.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="camera-outline" size={56} color="rgba(201,168,76,0.4)" />
                        <Text style={styles.emptyTitle}>No reports yet</Text>
                        <Text style={styles.emptySub}>Tap the camera icon to share what's happening in the field.</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={openCamera}>
                            <Ionicons name="camera" size={18} color="#1a1a2e" style={{ marginRight: 8 }} />
                            <Text style={styles.emptyBtnText}>Take a Photo</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionLabel}>YOUR REPORTS ({posts.length})</Text>
                        {posts.map(post => (
                            <View key={post.id} style={styles.postCard}>
                                <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
                                {post.caption ? (
                                    <View style={styles.postBody}>
                                        <Text style={styles.postCaption}>{post.caption}</Text>
                                    </View>
                                ) : null}
                                <View style={styles.postFooter}>
                                    <Ionicons name="time-outline" size={12} color="#94a3b8" />
                                    <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* FAB */}
                <TouchableOpacity style={styles.fab} onPress={openCamera}>
                    <Ionicons name="camera" size={28} color="#1a1a2e" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Upload modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalWrap}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Field Report</Text>
                            <TouchableOpacity onPress={() => { setShowModal(false); setSelectedUri(null); }}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {selectedUri && (
                            <Image source={{ uri: selectedUri }} style={styles.preview} resizeMode="cover" />
                        )}

                        <TextInput
                            style={styles.captionInput}
                            placeholder="Add a caption… (optional)"
                            placeholderTextColor="#94a3b8"
                            value={caption}
                            onChangeText={setCaption}
                            multiline
                            maxLength={280}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => { setShowModal(false); setSelectedUri(null); }}
                                disabled={uploading}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.postBtn, uploading && styles.postBtnDisabled]}
                                onPress={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#1a1a2e" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={18} color="#1a1a2e" style={{ marginRight: 6 }} />
                                        <Text style={styles.postBtnText}>Post Report</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,60,0.85)' },
    safe: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.25)',
    },
    headerTitle: { color: '#C9A84C', fontSize: 18, fontFamily: 'Anton_400Regular' },
    headerSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(201,168,76,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },

    emptyTitle: { color: '#fff', fontSize: 18, marginTop: 16, fontFamily: 'Anton_400Regular' },
    emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#C9A84C', paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 24, marginTop: 24,
    },
    emptyBtnText: { color: '#1a1a2e', fontSize: 15, fontFamily: 'Anton_400Regular' },

    list: { padding: 16, paddingBottom: 100 },
    sectionLabel: {
        color: 'rgba(201,168,76,0.7)', fontSize: 11, letterSpacing: 1.2,
        marginBottom: 12,
    },

    postCard: {
        backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    postImage: { width: '100%', height: 220 },
    postBody: { padding: 12 },
    postCaption: { fontSize: 15, color: '#1e293b', lineHeight: 22 },
    postFooter: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingBottom: 10,
    },
    postTime: { fontSize: 11, color: '#94a3b8' },

    fab: {
        position: 'absolute', bottom: 32, right: 24,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#C9A84C', shadowOpacity: 0.5, shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },

    // Modal
    modalWrap: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, paddingBottom: 36,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 18, color: '#1e293b', fontFamily: 'Anton_400Regular' },
    preview: {
        width: '100%', height: 240, borderRadius: 12,
        marginBottom: 16, backgroundColor: '#f1f5f9',
    },
    captionInput: {
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        padding: 14, fontSize: 15, color: '#1e293b', minHeight: 80,
        textAlignVertical: 'top', marginBottom: 16,
    },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center',
    },
    cancelBtnText: { fontSize: 15, color: '#64748b' },
    postBtn: {
        flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center',
    },
    postBtnDisabled: { opacity: 0.6 },
    postBtnText: { fontSize: 15, color: '#1a1a2e', fontFamily: 'Anton_400Regular' },
});
