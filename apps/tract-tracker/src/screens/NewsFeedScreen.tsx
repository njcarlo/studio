import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ImageBackground, ScrollView,
    Image, TouchableOpacity, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabaseAdmin } from '../supabase';
import { RootStackParamList } from '../AppNavigator';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const REFRESH_INTERVAL = 30_000;
const SLIDE_INTERVAL = 8_000;
const { width: SCREEN_W } = Dimensions.get('window');

interface Post {
    id: string;
    user_name: string;
    region: string;
    image_url: string;
    caption: string;
    created_at: string;
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

function isNew(iso: string) {
    return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000; // within 5 min
}

export default function NewsFeedScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const [lastUpdated, setLastUpdated] = useState('');
    const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchPosts = useCallback(async () => {
        try {
            const { data } = await supabaseAdmin
                .from('correspondent_posts')
                .select('id, user_name, region, image_url, caption, created_at')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) {
                setPosts(data);
                const now = new Date();
                setLastUpdated(
                    now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
                    ' ' +
                    now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
                );
            }
        } catch (e) {
            console.error('NewsFeed fetch error', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-advance featured post
    const startSlideTimer = useCallback((postCount: number) => {
        if (slideTimer.current) clearInterval(slideTimer.current);
        if (postCount < 2) return;
        slideTimer.current = setInterval(() => {
            setFeaturedIndex(prev => (prev + 1) % postCount);
        }, SLIDE_INTERVAL);
    }, []);

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, REFRESH_INTERVAL);

        const channel = supabaseAdmin
            .channel('newsfeed_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'correspondent_posts' },
                () => fetchPosts()
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            if (slideTimer.current) clearInterval(slideTimer.current);
            supabaseAdmin.removeChannel(channel);
        };
    }, [fetchPosts]);

    useEffect(() => {
        setFeaturedIndex(0);
        startSlideTimer(posts.length);
    }, [posts.length, startSlideTimer]);

    const goBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Main');

    const featuredPost = posts[featuredIndex] ?? null;
    const isWide = Platform.OS === 'web' && SCREEN_W >= 900;

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>

                {/* Top bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                    <View style={styles.topBarCenter}>
                        <Text style={styles.topBarTitle}>NTGD Field Reports</Text>
                        <View style={styles.topBarMeta}>
                            <View style={styles.liveDot} />
                            <Text style={styles.topBarMetaText}>Live · as of {lastUpdated}</Text>
                        </View>
                    </View>
                    <View style={styles.countPill}>
                        <Text style={styles.countPillNum}>{posts.length}</Text>
                        <Text style={styles.countPillLabel}>posts</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#C9A84C" />
                        <Text style={styles.loadingText}>Loading reports…</Text>
                    </View>
                ) : posts.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="newspaper-outline" size={64} color="rgba(201,168,76,0.35)" />
                        <Text style={styles.emptyTitle}>No reports yet</Text>
                        <Text style={styles.emptySub}>Correspondents' field photos will appear here.</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Featured post – large display */}
                        {featuredPost && (
                            <View style={[styles.featured, isWide && styles.featuredWide]}>
                                <Image
                                    source={{ uri: featuredPost.image_url }}
                                    style={[styles.featuredImage, isWide && styles.featuredImageWide]}
                                    resizeMode="cover"
                                />
                                {/* Overlay caption */}
                                <View style={styles.featuredOverlay}>
                                    <View style={styles.featuredTop}>
                                        {isNew(featuredPost.created_at) && (
                                            <View style={styles.newBadge}>
                                                <Text style={styles.newBadgeText}>NEW</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.featuredBottom}>
                                        {featuredPost.caption ? (
                                            <Text style={styles.featuredCaption} numberOfLines={3}>
                                                {featuredPost.caption}
                                            </Text>
                                        ) : null}
                                        <View style={styles.featuredMeta}>
                                            <Ionicons name="person-circle-outline" size={16} color="#C9A84C" />
                                            <Text style={styles.featuredReporter}>
                                                {featuredPost.user_name}
                                            </Text>
                                            {featuredPost.region ? (
                                                <Text style={styles.featuredRegion}>· {featuredPost.region}</Text>
                                            ) : null}
                                        </View>
                                        <Text style={styles.featuredTime}>{formatTime(featuredPost.created_at)}</Text>
                                    </View>
                                </View>

                                {/* Slide indicators */}
                                {posts.length > 1 && (
                                    <View style={styles.indicators}>
                                        {posts.slice(0, Math.min(posts.length, 8)).map((_, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[styles.dot, i === featuredIndex && styles.dotActive]}
                                                onPress={() => setFeaturedIndex(i)}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Grid of remaining posts */}
                        {posts.length > 1 && (
                            <>
                                <Text style={styles.sectionLabel}>ALL REPORTS</Text>
                                <View style={[styles.grid, isWide && styles.gridWide]}>
                                    {posts.map((post, i) => (
                                        <TouchableOpacity
                                            key={post.id}
                                            style={[
                                                styles.gridCard,
                                                isWide && styles.gridCardWide,
                                                i === featuredIndex && styles.gridCardActive,
                                            ]}
                                            onPress={() => setFeaturedIndex(i)}
                                            activeOpacity={0.85}
                                        >
                                            <Image
                                                source={{ uri: post.image_url }}
                                                style={styles.gridImage}
                                                resizeMode="cover"
                                            />
                                            {isNew(post.created_at) && (
                                                <View style={styles.gridNewBadge}>
                                                    <Text style={styles.gridNewBadgeText}>NEW</Text>
                                                </View>
                                            )}
                                            <View style={styles.gridInfo}>
                                                {post.caption ? (
                                                    <Text style={styles.gridCaption} numberOfLines={2}>
                                                        {post.caption}
                                                    </Text>
                                                ) : null}
                                                <Text style={styles.gridReporter} numberOfLines={1}>
                                                    {post.user_name}
                                                </Text>
                                                <Text style={styles.gridTime}>{formatTime(post.created_at)}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </ScrollView>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        COG Philippines · NTGD Field Correspondents · Auto-refreshes every 30s
                    </Text>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,10,40,0.9)' },
    safe: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 },
    emptyTitle: { color: '#fff', fontSize: 20, marginTop: 16, fontFamily: 'Anton_400Regular' },
    emptySub: { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },

    // Top bar
    topBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 2, borderBottomColor: '#C9A84C',
    },
    backBtn: { padding: 4, marginRight: 8 },
    topBarCenter: { flex: 1 },
    topBarTitle: {
        color: '#C9A84C', fontSize: 15, fontFamily: 'Anton_400Regular', letterSpacing: 0.5,
    },
    topBarMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    liveDot: {
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: '#22c55e', marginRight: 6,
    },
    topBarMetaText: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
    countPill: {
        backgroundColor: '#C9A84C', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', marginLeft: 8,
    },
    countPillNum: { color: '#1a1a2e', fontSize: 16, fontFamily: 'Anton_400Regular', lineHeight: 18 },
    countPillLabel: { color: '#1a1a2e', fontSize: 9, letterSpacing: 0.5 },

    content: { paddingBottom: 32 },
    contentWide: { paddingHorizontal: 16 },

    // Featured
    featured: { position: 'relative', marginBottom: 20 },
    featuredWide: { borderRadius: 16, overflow: 'hidden', marginTop: 12 },
    featuredImage: { width: '100%', height: SCREEN_W > 500 ? 460 : 300 },
    featuredImageWide: { height: 520 },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
    } as any,
    featuredTop: { padding: 14, flexDirection: 'row', justifyContent: 'flex-end' },
    featuredBottom: { padding: 16, paddingBottom: 40 },
    featuredCaption: {
        color: '#fff', fontSize: 18, lineHeight: 26,
        fontFamily: 'Anton_400Regular', marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    featuredReporter: {
        color: '#C9A84C', fontSize: 13, fontFamily: 'Anton_400Regular',
    },
    featuredRegion: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
    featuredTime: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },

    newBadge: {
        backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6,
    },
    newBadgeText: { color: '#fff', fontSize: 10, letterSpacing: 1, fontFamily: 'Anton_400Regular' },

    indicators: {
        position: 'absolute', bottom: 14, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    dot: {
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    dotActive: { backgroundColor: '#C9A84C', width: 20 },

    sectionLabel: {
        color: 'rgba(201,168,76,0.7)', fontSize: 11, letterSpacing: 1.4,
        paddingHorizontal: 16, marginBottom: 10, marginTop: 4,
    },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
    gridWide: { gap: 14 },
    gridCard: {
        width: (SCREEN_W - 44) / 2,
        backgroundColor: '#0f1b3d', borderRadius: 12, overflow: 'hidden',
        borderWidth: 2, borderColor: 'transparent',
    },
    gridCardWide: { width: (SCREEN_W - 80) / 3 },
    gridCardActive: { borderColor: '#C9A84C' },
    gridImage: { width: '100%', height: 140 },
    gridNewBadge: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: '#22c55e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    gridNewBadgeText: { color: '#fff', fontSize: 9, letterSpacing: 0.8 },
    gridInfo: { padding: 10 },
    gridCaption: { fontSize: 13, color: '#fff', lineHeight: 18, marginBottom: 4 },
    gridReporter: { fontSize: 11, color: '#C9A84C', marginBottom: 2 },
    gridTime: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },

    // Footer
    footer: {
        borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.25)',
        paddingVertical: 8, paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    footerText: { color: 'rgba(201,168,76,0.6)', fontSize: 10, letterSpacing: 0.8, textAlign: 'center' },
});
