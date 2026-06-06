import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
    ScrollView, ActivityIndicator, Alert, Modal, Platform,
    KeyboardAvoidingView, ImageBackground, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { supabaseAdmin } from '../supabase';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };

const AUTO_HASHTAGS = '\n\n#NationalTractsGivingDay\n#OutsideIsBeautiful\n#Connect2Souls\n#BornAgainPilipinas';

// ── Upload limits ─────────────────────────────────────────────────────────────
const REGULAR_MAX_POSTS    = 1;    // one-time upload for regular users
const REGULAR_UPLOAD_SLOTS = 500;  // global first-come-first-serve pool for regular users
// Correspondents have NO cap — unlimited uploads at full resolution
// ─────────────────────────────────────────────────────────────────────────────

interface Post {
    id: string;
    image_url: string;
    caption: string;
    created_at: string;
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export default function CorrespondentScreen() {
    const { user, authState, isCorrespondent } = useAuth();
    const { width } = useWindowDimensions();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [slotsLeft, setSlotsLeft] = useState<number | null>(null);  // null = loading or correspondent
    const [showModal, setShowModal] = useState(false);
    const [selectedUri, setSelectedUri] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);

    // Responsive layout
    const isWide = width >= 640;
    const hPad = isWide ? 24 : 14;
    const cols = width >= 1024 ? 3 : isWide ? 2 : 1;
    const gap = isWide ? 16 : 12;
    const cardW = Math.floor((width - hPad * 2 - gap * (cols - 1)) / cols);
    const imgH = Math.max(120, Math.floor(cardW * 0.67));
    const maxContentW = width >= 1400 ? 1100 : width >= 1024 ? 860 : undefined;
    const previewH = Math.max(200, Math.min(Math.floor(width * 0.55), 360));

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

    const fetchSlots = useCallback(async () => {
        if (isCorrespondent) { setSlotsLeft(null); return; }  // correspondents bypass the pool
        const { count } = await supabaseAdmin
            .from('correspondent_posts')
            .select('id', { count: 'exact', head: true })
            .eq('from_correspondent', false);
        setSlotsLeft(Math.max(0, REGULAR_UPLOAD_SLOTS - (count ?? 0)));
    }, [isCorrespondent]);

    useEffect(() => {
        fetchMyPosts();
        fetchSlots();
    }, [fetchMyPosts, fetchSlots]);

    // Derived state — correspondents are never at a limit
    const atLimit = !isCorrespondent && !loading && posts.length >= REGULAR_MAX_POSTS;
    const noSlots = !isCorrespondent && slotsLeft !== null && slotsLeft <= 0;
    const canUpload = !atLimit && !noSlots;

    const requestPermission = async () => {
        if (Platform.OS === 'web') return true;
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take photos.');
            return false;
        }
        return true;
    };

    const guardUpload = (): boolean => {
        if (atLimit) {
            Alert.alert('Limit reached', "You've already shared your photo. Thank you!");
            return false;
        }
        if (noSlots) {
            Alert.alert('Slots full', 'All upload slots have been claimed. Thank you for participating!');
            return false;
        }
        return true;
    };

    // Correspondents upload at full resolution with free-form crop.
    // Regular users upload at 0.6 quality with a fixed 4:3 crop to save storage.
    const cameraOpts: ImagePicker.ImagePickerOptions = isCorrespondent
        ? { mediaTypes: ['images'], allowsEditing: true, quality: 1.0 }
        : { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6 };

    const galleryOpts: ImagePicker.ImagePickerOptions = isCorrespondent
        ? { mediaTypes: ['images'], allowsEditing: false, quality: 1.0 }
        : { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6 };

    const openCamera = async () => {
        if (!guardUpload()) return;
        const ok = await requestPermission();
        if (!ok) return;
        const result = await ImagePicker.launchCameraAsync(cameraOpts);
        if (!result.canceled && result.assets[0]) {
            setSelectedUri(result.assets[0].uri);
            setCaption('');
            setShowModal(true);
        }
    };

    const openGallery = async () => {
        if (!guardUpload()) return;
        const result = await ImagePicker.launchImageLibraryAsync(galleryOpts);
        if (!result.canceled && result.assets[0]) {
            setSelectedUri(result.assets[0].uri);
            setCaption('');
            setShowModal(true);
        }
    };

    const handleUpload = async () => {
        if (!selectedUri || !user?.id) return;

        // Server-side safety check (correspondents are unlimited, only check regular users)
        if (!isCorrespondent) {
            const { count: myCount } = await supabaseAdmin
                .from('correspondent_posts')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);
            if ((myCount ?? 0) >= REGULAR_MAX_POSTS) {
                Alert.alert('Limit reached', "You've already shared your photo. Thank you!");
                setShowModal(false);
                setSelectedUri(null);
                await fetchMyPosts();
                return;
            }
        }
        if (!isCorrespondent) {
            const { count: totalRegular } = await supabaseAdmin
                .from('correspondent_posts')
                .select('id', { count: 'exact', head: true })
                .eq('from_correspondent', false);
            if ((totalRegular ?? 0) >= REGULAR_UPLOAD_SLOTS) {
                Alert.alert('Slots full', 'All upload slots have been claimed. Thank you!');
                setShowModal(false);
                setSelectedUri(null);
                setSlotsLeft(0);
                return;
            }
        }

        setUploading(true);
        try {
            const response = await fetch(selectedUri);
            const blob = await response.blob();
            const timestamp = Date.now();
            const fileName = `${user.id}/${timestamp}.jpg`;

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
                    caption: caption.trim() + AUTO_HASHTAGS,
                    from_correspondent: isCorrespondent,
                });
            if (insertError) throw insertError;

            // Fire-and-forget backup to Google Drive (fails silently if not configured)
            const driveFileName =
                `${new Date(timestamp).toISOString().slice(0, 19).replace(/[T:]/g, '-')}_` +
                `${(authState.name || user.email).replace(/\s+/g, '_')}.jpg`;
            supabaseAdmin.functions
                .invoke('upload-to-drive', {
                    body: { imageUrl: urlData.publicUrl, fileName: driveFileName, isCorrespondent },
                })
                .catch(() => {});

            setShowModal(false);
            setSelectedUri(null);
            setCaption('');
            await Promise.all([fetchMyPosts(), fetchSlots()]);
        } catch (e: any) {
            Alert.alert('Upload failed', e.message || 'Something went wrong. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const closeModal = () => { setShowModal(false); setSelectedUri(null); };

    const modalCardStyle = isWide
        ? [styles.modalCard, styles.modalCardCentered, { maxWidth: 520 }]
        : [styles.modalCard];
    const modalWrapStyle = isWide
        ? [styles.modalWrap, styles.modalWrapCentered]
        : [styles.modalWrap];

    // Status bar shown at top of the screen
    const renderStatusBar = () => {
        if (loading && slotsLeft === null) return null;
        if (noSlots) {
            return (
                <View style={[styles.statusBar, styles.statusBarFull]}>
                    <Ionicons name="lock-closed" size={15} color="#fca5a5" />
                    <Text style={[styles.statusBarText, { color: '#fca5a5' }]}>
                        All {REGULAR_UPLOAD_SLOTS} upload slots have been claimed.
                    </Text>
                </View>
            );
        }
        if (atLimit) {
            return (
                <View style={[styles.statusBar, styles.statusBarDone]}>
                    <Ionicons name="checkmark-circle" size={15} color="#bbf7d0" />
                    <Text style={[styles.statusBarText, { color: '#bbf7d0' }]}>
                        {"You've shared your photo. Thank you!"}
                    </Text>
                </View>
            );
        }
        if (!isCorrespondent && slotsLeft !== null) {
            return (
                <View style={[styles.statusBar, styles.statusBarOpen]}>
                    <Ionicons name="aperture-outline" size={15} color="#C9A84C" />
                    <Text style={[styles.statusBarText, { color: '#C9A84C' }]}>
                        {slotsLeft} upload slots remaining · First come, first served
                    </Text>
                </View>
            );
        }
        return null;
    };

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>
                            {isCorrespondent ? 'Field Reports' : 'Share a Photo'}
                        </Text>
                        <Text style={styles.headerSub}>
                            {authState.name || user?.email}
                            {authState.region ? ` · ${authState.region}` : ''}
                            {' · '}
                            {isCorrespondent
                                ? `${posts.length} reports uploaded`
                                : `${posts.length}/${REGULAR_MAX_POSTS} photo`}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.headerBtn, !canUpload && styles.headerBtnDisabled]}
                            onPress={openGallery}
                            disabled={!canUpload}
                        >
                            <Ionicons name="images-outline" size={22} color={canUpload ? '#C9A84C' : 'rgba(255,255,255,0.2)'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.headerBtn, !canUpload && styles.headerBtnDisabled]}
                            onPress={openCamera}
                            disabled={!canUpload}
                        >
                            <Ionicons name="camera-outline" size={22} color={canUpload ? '#C9A84C' : 'rgba(255,255,255,0.2)'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {renderStatusBar()}

                {/* Posts */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#C9A84C" />
                    </View>
                ) : posts.length === 0 ? (
                    <View style={styles.centered}>
                        {noSlots ? (
                            <>
                                <Ionicons name="lock-closed-outline" size={56} color="rgba(252,165,165,0.5)" />
                                <Text style={styles.emptyTitle}>Upload slots are full</Text>
                                <Text style={styles.emptySub}>All {REGULAR_UPLOAD_SLOTS} slots were claimed. Thank you for participating in NTGD!</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="camera-outline" size={56} color="rgba(201,168,76,0.4)" />
                                <Text style={styles.emptyTitle}>
                                    {isCorrespondent ? 'No reports yet' : 'Share your NTGD moment'}
                                </Text>
                                <Text style={styles.emptySub}>
                                    {isCorrespondent
                                        ? 'Tap the camera icon to share what\'s happening in the field.'
                                        : 'You have 1 photo slot. Capture your moment from the field!'}
                                </Text>
                                <TouchableOpacity style={styles.emptyBtn} onPress={openCamera}>
                                    <Ionicons name="camera" size={18} color="#1a1a2e" style={{ marginRight: 8 }} />
                                    <Text style={styles.emptyBtnText}>Take a Photo</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={[
                            styles.list,
                            {
                                paddingHorizontal: hPad,
                                paddingBottom: 100,
                                alignSelf: maxContentW ? 'center' : undefined,
                                width: maxContentW ? '100%' : undefined,
                                maxWidth: maxContentW,
                            },
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.sectionLabel}>
                            {isCorrespondent
                                ? `YOUR REPORTS (${posts.length})`
                                : `YOUR PHOTO (${posts.length}/${REGULAR_MAX_POSTS})`}
                        </Text>
                        <View style={[styles.grid, { gap }]}>
                            {posts.map(post => (
                                <View key={post.id} style={[styles.postCard, { width: cardW }]}>
                                    <Image
                                        source={{ uri: post.image_url }}
                                        style={{ width: '100%', height: imgH }}
                                        resizeMode="cover"
                                    />
                                    {post.caption ? (
                                        <View style={styles.postBody}>
                                            <Text style={styles.postCaption} numberOfLines={cols > 1 ? 2 : undefined}>
                                                {post.caption}
                                            </Text>
                                        </View>
                                    ) : null}
                                    <View style={styles.postFooter}>
                                        <Ionicons name="time-outline" size={12} color="#94a3b8" />
                                        <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                )}

                {/* FAB — hidden when upload not allowed */}
                {canUpload && (
                    <TouchableOpacity style={styles.fab} onPress={openCamera}>
                        <Ionicons name="camera" size={28} color="#1a1a2e" />
                    </TouchableOpacity>
                )}
            </SafeAreaView>

            {/* Upload modal */}
            <Modal visible={showModal} animationType={isWide ? 'fade' : 'slide'} transparent>
                <KeyboardAvoidingView
                    style={modalWrapStyle}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={modalCardStyle}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isCorrespondent ? 'New Field Report' : 'Share Your Moment'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {selectedUri && (
                            <Image
                                source={{ uri: selectedUri }}
                                style={[styles.preview, { height: previewH }]}
                                resizeMode="cover"
                            />
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
                        <Text style={styles.hashtagHint}>
                            Hashtags will be added automatically
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={uploading}>
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
                                        <Text style={styles.postBtnText}>Post</Text>
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
    headerBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.04)' },

    // Status bar
    statusBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingVertical: 9,
        borderLeftWidth: 3,
    },
    statusBarOpen: { backgroundColor: 'rgba(201,168,76,0.1)', borderLeftColor: '#C9A84C' },
    statusBarDone: { backgroundColor: 'rgba(34,197,94,0.1)', borderLeftColor: '#22c55e' },
    statusBarFull: { backgroundColor: 'rgba(239,68,68,0.1)', borderLeftColor: '#ef4444' },
    statusBarText: { fontSize: 12, flex: 1, lineHeight: 17 },

    emptyTitle: { color: '#fff', fontSize: 18, marginTop: 16, fontFamily: 'Anton_400Regular' },
    emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#C9A84C', paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 24, marginTop: 24,
    },
    emptyBtnText: { color: '#1a1a2e', fontSize: 15, fontFamily: 'Anton_400Regular' },

    list: { paddingTop: 16 },
    sectionLabel: { color: 'rgba(201,168,76,0.7)', fontSize: 11, letterSpacing: 1.2, marginBottom: 12 },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    postCard: {
        backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    postBody: { padding: 12 },
    postCaption: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
    postFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingBottom: 10 },
    postTime: { fontSize: 11, color: '#94a3b8' },

    fab: {
        position: 'absolute', bottom: 32, right: 24,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#C9A84C', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },

    modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalWrapCentered: { justifyContent: 'center', alignItems: 'center' },
    modalCard: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, paddingBottom: 36, maxHeight: '90%',
    },
    modalCardCentered: { borderRadius: 24, width: '90%', alignSelf: 'center' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, color: '#1e293b', fontFamily: 'Anton_400Regular' },
    preview: { width: '100%', borderRadius: 12, marginBottom: 16, backgroundColor: '#f1f5f9' },
    captionInput: {
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        padding: 14, fontSize: 15, color: '#1e293b', minHeight: 80,
        textAlignVertical: 'top', marginBottom: 6,
    },
    hashtagHint: { fontSize: 11, color: '#94a3b8', marginBottom: 14, paddingHorizontal: 2 },
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
