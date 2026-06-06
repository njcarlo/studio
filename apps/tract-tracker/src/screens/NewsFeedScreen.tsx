import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ImageBackground, ScrollView,
    Image, TouchableOpacity, ActivityIndicator, useWindowDimensions,
    Animated, Easing, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabaseAdmin } from '../supabase';
import { RootStackParamList } from '../AppNavigator';
import { useAuth } from '../context/AuthContext';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const REFRESH_INTERVAL = 30_000;
const SLIDE_INTERVAL = 9_000;

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
        ' · ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

function isNew(iso: string) {
    return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000;
}

// Split caption from auto-appended hashtags for nicer display
function splitCaption(text: string) {
    const lines = text.split('\n');
    const main = lines.filter(l => !l.trim().startsWith('#')).join('\n').trim();
    const tags  = lines.filter(l => l.trim().startsWith('#')).map(l => l.trim()).join('  ');
    return { main, tags };
}

function useLayout(width: number, height: number) {
    const isMonitor = width >= 1024;
    const isTablet  = width >= 640;

    // Hero slideshow takes a fixed slice of the viewport
    const heroH = Math.min(Math.floor(height * (isMonitor ? 0.58 : isTablet ? 0.52 : 0.46)), 640);

    // Cards are centered at max 600px (Facebook-like) on wide screens
    const cardMaxW = isMonitor ? 620 : isTablet ? 520 : undefined;

    // Avatar and font sizes scale for readability on monitors
    const avatarSize   = isMonitor ? 52 : 40;
    const nameFont     = isMonitor ? 18 : 15;
    const captionFont  = isMonitor ? 17 : 14;
    const tagFont      = isMonitor ? 14 : 12;
    const metaFont     = isMonitor ? 13 : 11;
    const heroCapFont  = isMonitor ? 36 : isTablet ? 26 : 20;
    const heroMetaFont = isMonitor ? 20 : isTablet ? 15 : 13;
    const thumbSize    = isMonitor ? 90 : isTablet ? 76 : 64;

    return {
        heroH, cardMaxW, avatarSize, nameFont, captionFont, tagFont, metaFont,
        heroCapFont, heroMetaFont, thumbSize, isMonitor, isTablet,
    };
}

export default function NewsFeedScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { width, height } = useWindowDimensions();
    const layout = useLayout(width, height);
    const { isAdmin } = useAuth();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [heroIdx, setHeroIdx] = useState(0);
    const [lastUpdated, setLastUpdated] = useState('');

    const heroIdxRef    = useRef(0);
    const postCountRef  = useRef(0);
    const slideTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
    const filmstripRef  = useRef<ScrollView>(null);
    const fadeAnim      = useRef(new Animated.Value(1)).current;

    const fetchPosts = useCallback(async () => {
        try {
            const { data } = await supabaseAdmin
                .from('correspondent_posts')
                .select('id, user_name, region, image_url, caption, created_at')
                .order('created_at', { ascending: false })
                .limit(60);
            if (data) {
                setPosts(data);
                postCountRef.current = data.length;
                const now = new Date();
                setLastUpdated(
                    now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
                    ' ' + now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
                );
            }
        } catch (e) {
            console.error('NewsFeed fetch error', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const goToHero = useCallback((idx: number) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.ease })
            .start(() => {
                heroIdxRef.current = idx;
                setHeroIdx(idx);
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            });
        const gap = 8;
        const itemW = layout.thumbSize + gap;
        filmstripRef.current?.scrollTo({ x: Math.max(0, idx * itemW - width / 2 + itemW / 2), animated: true });
    }, [fadeAnim, layout.thumbSize, width]);

    const resetTimer = useCallback(() => {
        if (slideTimer.current) clearInterval(slideTimer.current);
        slideTimer.current = setInterval(() => {
            const next = (heroIdxRef.current + 1) % (postCountRef.current || 1);
            goToHero(next);
        }, SLIDE_INTERVAL);
    }, [goToHero]);

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, REFRESH_INTERVAL);
        const channel = supabaseAdmin
            .channel('newsfeed_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'correspondent_posts' }, () => fetchPosts())
            .subscribe();
        return () => {
            clearInterval(interval);
            if (slideTimer.current) clearInterval(slideTimer.current);
            supabaseAdmin.removeChannel(channel);
        };
    }, [fetchPosts]);

    useEffect(() => {
        heroIdxRef.current = 0;
        setHeroIdx(0);
        if (posts.length > 1) resetTimer();
    }, [posts.length, resetTimer]);

    const handleThumbPress = (i: number) => { goToHero(i); if (posts.length > 1) resetTimer(); };

    const deletePost = useCallback(async (post: Post) => {
        Alert.alert(
            'Delete Report',
            `Remove this report by ${post.user_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        await supabaseAdmin.from('correspondent_posts').delete().eq('id', post.id);
                        try {
                            const urlPath = new URL(post.image_url).pathname;
                            const storagePath = urlPath.split('/correspondent-photos/').at(-1);
                            if (storagePath) await supabaseAdmin.storage.from('correspondent-photos').remove([storagePath]);
                        } catch (_) {}
                        setPosts(prev => {
                            const updated = prev.filter(p => p.id !== post.id);
                            postCountRef.current = updated.length;
                            const newIdx = Math.min(heroIdxRef.current, Math.max(0, updated.length - 1));
                            heroIdxRef.current = newIdx;
                            setHeroIdx(newIdx);
                            return updated;
                        });
                    },
                },
            ]
        );
    }, []);

    const goBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Main');
    const heroPost = posts[heroIdx] ?? null;

    // Width of card content area (respects max-width centering)
    const feedCardW = layout.cardMaxW ?? width;
    const cardHPad = layout.isTablet ? 16 : 0;

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>

                {/* ── Top bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={layout.isMonitor ? 26 : 20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                    <View style={styles.topBarCenter}>
                        <Text style={[styles.topBarTitle, { fontSize: layout.isMonitor ? 22 : 15 }]}>
                            NTGD Field Reports
                        </Text>
                        <View style={styles.topBarMeta}>
                            <View style={styles.liveDot} />
                            <Text style={[styles.topBarMetaText, { fontSize: layout.metaFont }]}>
                                Live · as of {lastUpdated}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.countPill}>
                        <Text style={[styles.countPillNum, { fontSize: layout.isMonitor ? 22 : 16 }]}>{posts.length}</Text>
                        <Text style={[styles.countPillLabel, { fontSize: layout.isMonitor ? 11 : 9 }]}>posts</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#C9A84C" />
                        <Text style={[styles.loadingText, { fontSize: layout.metaFont }]}>Loading reports…</Text>
                    </View>
                ) : posts.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="newspaper-outline" size={80} color="rgba(201,168,76,0.35)" />
                        <Text style={[styles.emptyTitle, { fontSize: layout.isMonitor ? 28 : 20 }]}>No reports yet</Text>
                        <Text style={[styles.emptySub, { fontSize: layout.metaFont }]}>
                            Correspondents' field photos will appear here.
                        </Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>

                        {/* ── Hero slideshow ── */}
                        {heroPost && (
                            <View style={[styles.heroWrap, { height: layout.heroH }]}>
                                <Animated.Image
                                    source={{ uri: heroPost.image_url }}
                                    style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
                                    resizeMode="cover"
                                />
                                <View style={styles.heroGradient as any} />

                                {isNew(heroPost.created_at) && (
                                    <View style={styles.newBadge}>
                                        <Text style={[styles.newBadgeText, { fontSize: layout.isMonitor ? 13 : 10 }]}>JUST IN</Text>
                                    </View>
                                )}

                                {isAdmin && (
                                    <TouchableOpacity style={styles.heroDeleteBtn} onPress={() => deletePost(heroPost)}>
                                        <Ionicons name="trash-outline" size={layout.isMonitor ? 22 : 18} color="#fff" />
                                    </TouchableOpacity>
                                )}

                                {posts.length > 1 && (
                                    <>
                                        <TouchableOpacity style={[styles.navArrow, styles.navLeft]} onPress={() => handleThumbPress((heroIdx - 1 + posts.length) % posts.length)}>
                                            <Ionicons name="chevron-back" size={layout.isMonitor ? 40 : 26} color="rgba(255,255,255,0.9)" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.navArrow, styles.navRight]} onPress={() => handleThumbPress((heroIdx + 1) % posts.length)}>
                                            <Ionicons name="chevron-forward" size={layout.isMonitor ? 40 : 26} color="rgba(255,255,255,0.9)" />
                                        </TouchableOpacity>
                                    </>
                                )}

                                <View style={[styles.heroInfo, { paddingHorizontal: layout.isMonitor ? 40 : 16 }]}>
                                    {(() => { const { main } = splitCaption(heroPost.caption); return main ? (
                                        <Text style={[styles.heroCaption, { fontSize: layout.heroCapFont, lineHeight: layout.heroCapFont * 1.3 }]} numberOfLines={3}>
                                            {main}
                                        </Text>
                                    ) : null; })()}
                                    <View style={styles.heroMeta}>
                                        <Ionicons name="person-circle" size={layout.heroMetaFont + 8} color="#C9A84C" />
                                        <Text style={[styles.heroReporter, { fontSize: layout.heroMetaFont }]}>{heroPost.user_name}</Text>
                                        {heroPost.region ? <Text style={[styles.heroRegion, { fontSize: layout.heroMetaFont }]}>· {heroPost.region}</Text> : null}
                                        <Text style={[styles.heroTime, { fontSize: layout.metaFont }]}>· {formatTime(heroPost.created_at)}</Text>
                                    </View>
                                    {posts.length > 1 && (
                                        <View style={styles.dots}>
                                            {posts.slice(0, 14).map((_, i) => (
                                                <TouchableOpacity key={i} style={[styles.dot, i === heroIdx && styles.dotActive]} onPress={() => handleThumbPress(i)} />
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* ── Filmstrip ── */}
                        {posts.length > 1 && (
                            <View style={styles.filmstripWrap}>
                                <ScrollView ref={filmstripRef} horizontal showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={[styles.filmstrip, { paddingHorizontal: layout.isTablet ? 20 : 10 }]}>
                                    {posts.map((post, i) => (
                                        <TouchableOpacity
                                            key={post.id}
                                            style={[styles.thumb, { width: layout.thumbSize, height: layout.thumbSize, borderColor: i === heroIdx ? '#C9A84C' : 'rgba(255,255,255,0.1)' }]}
                                            onPress={() => handleThumbPress(i)} activeOpacity={0.75}
                                        >
                                            <Image source={{ uri: post.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                                            {isNew(post.created_at) && <View style={styles.thumbNewDot} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* ── Facebook-style feed ── */}
                        <View style={[styles.feed, { paddingHorizontal: cardHPad }]}>
                            <Text style={[styles.feedLabel, { fontSize: layout.isMonitor ? 13 : 11 }]}>ALL REPORTS</Text>

                            {posts.map(post => {
                                const { main, tags } = splitCaption(post.caption);
                                const initials = post.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                return (
                                    <View
                                        key={post.id}
                                        style={[
                                            styles.card,
                                            layout.cardMaxW ? { alignSelf: 'center', width: layout.cardMaxW } : { width: '100%' },
                                        ]}
                                    >
                                        {/* Card header */}
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.avatar, { width: layout.avatarSize, height: layout.avatarSize, borderRadius: layout.avatarSize / 2 }]}>
                                                <Text style={[styles.avatarText, { fontSize: layout.avatarSize * 0.38 }]}>{initials}</Text>
                                            </View>
                                            <View style={styles.cardMeta}>
                                                <Text style={[styles.cardName, { fontSize: layout.nameFont }]}>{post.user_name}</Text>
                                                <Text style={[styles.cardSubMeta, { fontSize: layout.metaFont }]}>
                                                    {post.region ? `${post.region} · ` : ''}{formatTime(post.created_at)}
                                                    {isNew(post.created_at) ? '  🟢 NEW' : ''}
                                                </Text>
                                            </View>
                                            {isAdmin && (
                                                <TouchableOpacity style={styles.cardDeleteBtn} onPress={() => deletePost(post)}>
                                                    <Ionicons name="trash-outline" size={layout.isMonitor ? 20 : 17} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Photo — 4:3 aspect ratio */}
                                        <Image
                                            source={{ uri: post.image_url }}
                                            style={[styles.cardImage, { aspectRatio: 4 / 3 }]}
                                            resizeMode="cover"
                                        />

                                        {/* Caption + hashtags */}
                                        {(main || tags) ? (
                                            <View style={styles.cardBody}>
                                                {main ? (
                                                    <Text style={[styles.cardCaption, { fontSize: layout.captionFont, lineHeight: layout.captionFont * 1.55 }]}>
                                                        {main}
                                                    </Text>
                                                ) : null}
                                                {tags ? (
                                                    <Text style={[styles.cardTags, { fontSize: layout.tagFont }]}>{tags}</Text>
                                                ) : null}
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            })}
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { fontSize: layout.isMonitor ? 13 : 10 }]}>
                        COG Philippines · NTGD Field Correspondents · Auto-refreshes every 30s
                    </Text>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,10,40,0.92)' },
    safe: { flex: 1 },
    scrollArea: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 14 },
    emptyTitle: { color: '#fff', marginTop: 20, fontFamily: 'Anton_400Regular' },
    emptySub: { color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 10, lineHeight: 28 },

    topBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 2, borderBottomColor: '#C9A84C',
    },
    backBtn: { padding: 4, marginRight: 8 },
    topBarCenter: { flex: 1 },
    topBarTitle: { color: '#C9A84C', fontFamily: 'Anton_400Regular', letterSpacing: 0.5 },
    topBarMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 7 },
    topBarMetaText: { color: 'rgba(255,255,255,0.55)' },
    countPill: { backgroundColor: '#C9A84C', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', marginLeft: 8 },
    countPillNum: { color: '#1a1a2e', fontFamily: 'Anton_400Regular', lineHeight: 26 },
    countPillLabel: { color: '#1a1a2e', letterSpacing: 0.5 },

    // ── Hero ──
    heroWrap: { position: 'relative', overflow: 'hidden' },
    heroGradient: {
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.95) 100%)',
    },
    newBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    newBadgeText: { color: '#fff', letterSpacing: 1.2, fontFamily: 'Anton_400Regular' },
    heroDeleteBtn: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 8, padding: 8 },
    navArrow: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 12, zIndex: 10 },
    navLeft: { left: 0 },
    navRight: { right: 0 },
    heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 16 },
    heroCaption: { color: '#fff', fontFamily: 'Anton_400Regular', marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
    heroMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    heroReporter: { color: '#C9A84C', fontFamily: 'Anton_400Regular' },
    heroRegion: { color: 'rgba(255,255,255,0.65)' },
    heroTime: { color: 'rgba(255,255,255,0.45)' },
    dots: { flexDirection: 'row', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
    dotActive: { backgroundColor: '#C9A84C', width: 24 },

    // ── Filmstrip ──
    filmstripWrap: { borderTopWidth: 2, borderTopColor: 'rgba(201,168,76,0.3)', backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 8 },
    filmstrip: { gap: 8, alignItems: 'center' },
    thumb: { borderRadius: 8, overflow: 'hidden', borderWidth: 2.5 },
    thumbNewDot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: '#fff' },

    // ── Feed ──
    feed: { paddingTop: 16 },
    feedLabel: { color: 'rgba(201,168,76,0.7)', letterSpacing: 1.4, marginBottom: 12, paddingHorizontal: 16 },

    // Post card — Facebook-style
    card: {
        backgroundColor: '#111c44', borderRadius: 16, overflow: 'hidden',
        marginBottom: 20, marginHorizontal: 'auto' as any,
        shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 },
    avatar: { backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: '#1a1a2e', fontFamily: 'Anton_400Regular' },
    cardMeta: { flex: 1 },
    cardName: { color: '#fff', fontFamily: 'Anton_400Regular', marginBottom: 2 },
    cardSubMeta: { color: 'rgba(255,255,255,0.45)' },
    cardDeleteBtn: { padding: 6 },
    cardImage: { width: '100%' },
    cardBody: { padding: 14, paddingTop: 12 },
    cardCaption: { color: '#e2e8f0', marginBottom: 8 },
    cardTags: { color: '#C9A84C', lineHeight: 22 },

    footer: { borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.25)', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.65)' },
    footerText: { color: 'rgba(201,168,76,0.6)', letterSpacing: 0.8, textAlign: 'center' },
});
