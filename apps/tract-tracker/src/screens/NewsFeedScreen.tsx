import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ImageBackground, ScrollView,
    Image, TouchableOpacity, ActivityIndicator, useWindowDimensions,
    Animated, Easing,
} from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase, callApi } from '../supabase';
import { RootStackParamList } from '../AppNavigator';
import { useAuth } from '../context/AuthContext';

const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2244&auto=format&fit=crop' };
const AnimatedCachedImage = Animated.createAnimatedComponent(CachedImage);
const REFRESH_INTERVAL = 10_000;
const SLIDE_INTERVAL   = 10_000;

interface Post {
    id: string;
    user_name: string;
    region: string;
    barangay: string;
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

function splitCaption(text: string) {
    const lines = text.split('\n');
    const main = lines.filter(l => !l.trim().startsWith('#')).join('\n').trim();
    const tags  = lines.filter(l => l.trim().startsWith('#')).map(l => l.trim()).join('  ');
    return { main, tags };
}

// CSS gradient styles — web-only, kept outside StyleSheet.create to avoid RN type errors
const webGrad = {
    slideshowTopGrad: {
        position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
    } as any,
    slideshowBottomGrad: {
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.97) 100%)',
    } as any,
    heroGradient: {
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.95) 100%)',
    } as any,
};

function useLayout(width: number, _height: number) {
    const isMonitor = width >= 1024;
    const isTablet  = width >= 640;

    const cardMaxW     = isMonitor ? 560 : isTablet ? 500 : undefined;
    const avatarSize   = isMonitor ? 48 : 40;
    const nameFont     = isMonitor ? 17 : 15;
    const captionFont  = isMonitor ? 16 : 14;
    const tagFont      = isMonitor ? 13 : 12;
    const metaFont     = isMonitor ? 13 : 11;
    const heroCapFont  = isMonitor ? 42 : isTablet ? 32 : 24;
    const heroMetaFont = isMonitor ? 22 : isTablet ? 17 : 14;
    const thumbSize    = isMonitor ? 80 : isTablet ? 68 : 58;

    return {
        cardMaxW, avatarSize, nameFont, captionFont, tagFont, metaFont,
        heroCapFont, heroMetaFont, thumbSize, isMonitor, isTablet,
    };
}

export default function NewsFeedScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { width, height } = useWindowDimensions();
    const layout = useLayout(width, height);
    const { isAdmin, user } = useAuth();

    const [posts, setPosts]             = useState<Post[]>([]);
    const [loading, setLoading]         = useState(true);
    const [heroIdx, setHeroIdx]         = useState(0);
    const [lastUpdated, setLastUpdated] = useState('');
    const [viewMode, setViewMode]       = useState<'slideshow' | 'feed'>('slideshow');
    const [lightboxPost, setLightboxPost] = useState<Post | null>(null);

    const heroIdxRef    = useRef(0);
    const postCountRef  = useRef(0);
    const slideTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
    const filmstripRef  = useRef<ScrollView>(null);
    const fadeAnim      = useRef(new Animated.Value(1)).current;
    const lightboxAnim  = useRef(new Animated.Value(0)).current;

    const fetchPosts = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('correspondent_posts')
                .select('id, user_name, region, barangay, image_url, caption, created_at')
                .order('created_at', { ascending: false })
                .limit(60);
            if (data) {
                // Preserve the currently-displayed post's position across background
                // refreshes — find where it landed in the new list instead of
                // jarringly resetting the slideshow back to index 0 every 10s.
                setPosts(prev => {
                    const currentId = prev[heroIdxRef.current]?.id;
                    const preservedIdx = currentId ? data.findIndex(p => p.id === currentId) : -1;
                    const nextIdx = preservedIdx >= 0 ? preservedIdx : 0;
                    if (nextIdx !== heroIdxRef.current) {
                        heroIdxRef.current = nextIdx;
                        setHeroIdx(nextIdx);
                    }
                    return data;
                });
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
        const itemW = layout.thumbSize + 8;
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
        const channel = supabase
            .channel('newsfeed_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'correspondent_posts' }, () => fetchPosts())
            .subscribe();
        return () => {
            clearInterval(interval);
            if (slideTimer.current) clearInterval(slideTimer.current);
            supabase.removeChannel(channel);
        };
    }, [fetchPosts]);

    useEffect(() => {
        if (posts.length > 1) resetTimer();
        else if (slideTimer.current) { clearInterval(slideTimer.current); slideTimer.current = null; }
    }, [posts.length, resetTimer]);

    const handleThumbPress = (i: number) => { goToHero(i); if (posts.length > 1) resetTimer(); };

    const deletePost = useCallback(async (post: Post) => {
        if (!user) return;
        if (!window.confirm(`Remove this report by ${post.user_name}?`)) return;
        const { error } = await callApi('posts-api', { action: 'delete', requesterId: user.id, postId: post.id });
        if (error) { console.error('deletePost error', error.message); return; }
        setPosts(prev => {
            const updated = prev.filter(p => p.id !== post.id);
            postCountRef.current = updated.length;
            const newIdx = Math.min(heroIdxRef.current, Math.max(0, updated.length - 1));
            heroIdxRef.current = newIdx;
            setHeroIdx(newIdx);
            return updated;
        });
    }, [user]);

    const openLightbox = useCallback((post: Post) => {
        setLightboxPost(post);
        lightboxAnim.setValue(0);
        Animated.spring(lightboxAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
    }, [lightboxAnim]);

    const closeLightbox = useCallback(() => {
        Animated.timing(lightboxAnim, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.ease }).start(() => {
            setLightboxPost(null);
        });
    }, [lightboxAnim]);

    const goBack  = () => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Main');
    const heroPost = posts[heroIdx] ?? null;
    const cardHPad = layout.isTablet ? 16 : 0;

    // Shared filmstrip — rendered in both modes; ref is valid whichever is mounted
    const FilmstripBar = posts.length > 1 ? (
        <View style={styles.filmstripWrap}>
            <ScrollView ref={filmstripRef} horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.filmstrip, { paddingHorizontal: layout.isTablet ? 20 : 10 }]}>
                {posts.map((post, i) => (
                    <TouchableOpacity
                        key={post.id}
                        style={[styles.thumb, {
                            width: layout.thumbSize, height: layout.thumbSize,
                            borderColor: i === heroIdx ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                        }]}
                        onPress={() => handleThumbPress(i)} activeOpacity={0.75}
                    >
                        <CachedImage source={{ uri: post.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
                        {isNew(post.created_at) && <View style={styles.thumbNewDot} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    ) : null;

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

                    {/* Slideshow ↔ Feed toggle */}
                    {posts.length > 0 && (
                        <TouchableOpacity
                            style={styles.viewToggleBtn}
                            onPress={() => setViewMode(m => m === 'slideshow' ? 'feed' : 'slideshow')}
                        >
                            <Ionicons
                                name={viewMode === 'slideshow' ? 'list' : 'play-circle'}
                                size={layout.isMonitor ? 20 : 17}
                                color="#C9A84C"
                            />
                            <Text style={[styles.viewToggleText, { fontSize: layout.isMonitor ? 13 : 11 }]}>
                                {viewMode === 'slideshow' ? 'Feed' : 'Slideshow'}
                            </Text>
                        </TouchableOpacity>
                    )}

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

                ) : viewMode === 'slideshow' ? (

                    /* ══════════════════ FULL-SCREEN SLIDESHOW ══════════════════ */
                    <View style={styles.slideshowFull}>
                        {heroPost && (
                            <>
                                {/* Full-bleed image */}
                                <AnimatedCachedImage
                                    source={{ uri: heroPost.image_url }}
                                    style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                />

                                {/* Gradient overlays */}
                                <View style={webGrad.slideshowTopGrad} />
                                <View style={webGrad.slideshowBottomGrad} />

                                {/* Badges */}
                                {isNew(heroPost.created_at) && (
                                    <View style={styles.newBadge}>
                                        <Text style={[styles.newBadgeText, { fontSize: layout.isMonitor ? 14 : 11 }]}>JUST IN</Text>
                                    </View>
                                )}
                                {isAdmin && (
                                    <TouchableOpacity style={styles.heroDeleteBtn} onPress={() => deletePost(heroPost)}>
                                        <Ionicons name="trash-outline" size={layout.isMonitor ? 22 : 18} color="#fff" />
                                    </TouchableOpacity>
                                )}

                                {/* Left / right nav */}
                                {posts.length > 1 && (
                                    <>
                                        <TouchableOpacity style={[styles.navArrow, styles.navLeft]}
                                            onPress={() => handleThumbPress((heroIdx - 1 + posts.length) % posts.length)}>
                                            <Ionicons name="chevron-back" size={layout.isMonitor ? 64 : 40} color="rgba(255,255,255,0.9)" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.navArrow, styles.navRight]}
                                            onPress={() => handleThumbPress((heroIdx + 1) % posts.length)}>
                                            <Ionicons name="chevron-forward" size={layout.isMonitor ? 64 : 40} color="rgba(255,255,255,0.9)" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        )}

                        {/* Spacer pushes caption + filmstrip to bottom */}
                        <View style={{ flex: 1 }} />

                        {/* Caption overlay */}
                        {heroPost && (
                            <View style={[styles.slideshowInfo, { paddingHorizontal: layout.isMonitor ? 60 : 20 }]}>
                                {(() => { const { main } = splitCaption(heroPost.caption); return main ? (
                                    <Text style={[styles.heroCaption, { fontSize: layout.heroCapFont, lineHeight: layout.heroCapFont * 1.25 }]} numberOfLines={3}>
                                        {main}
                                    </Text>
                                ) : null; })()}
                                <View style={styles.heroMeta}>
                                    <Ionicons name="person-circle" size={layout.heroMetaFont + 10} color="#C9A84C" />
                                    <Text style={[styles.heroReporter, { fontSize: layout.heroMetaFont }]}>{heroPost.user_name}</Text>
                                    {heroPost.region ? <Text style={[styles.heroRegion, { fontSize: layout.heroMetaFont }]}>· {heroPost.region}</Text> : null}
                                    {heroPost.barangay ? <Text style={[styles.heroRegion, { fontSize: layout.heroMetaFont }]}>· {heroPost.barangay}</Text> : null}
                                    <Text style={[styles.heroTime, { fontSize: layout.metaFont }]}>· {formatTime(heroPost.created_at)}</Text>
                                </View>
                                {posts.length > 1 && (
                                    <View style={styles.dots}>
                                        {posts.slice(0, 20).map((_, i) => (
                                            <TouchableOpacity key={i} style={[styles.dot, i === heroIdx && styles.dotActive]} onPress={() => handleThumbPress(i)} />
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Filmstrip pinned at very bottom */}
                        {FilmstripBar}
                    </View>

                ) : (

                    /* ══════════════════ NEWS FEED ══════════════════ */
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>

                        {/* Filmstrip at top of feed — tap to jump to a post in slideshow */}
                        {FilmstripBar}

                        {/* Card feed */}
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
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.avatar, { width: layout.avatarSize, height: layout.avatarSize, borderRadius: layout.avatarSize / 2 }]}>
                                                <Text style={[styles.avatarText, { fontSize: layout.avatarSize * 0.38 }]}>{initials}</Text>
                                            </View>
                                            <View style={styles.cardMeta}>
                                                <Text style={[styles.cardName, { fontSize: layout.nameFont }]}>{post.user_name}</Text>
                                                <Text style={[styles.cardSubMeta, { fontSize: layout.metaFont }]}>
                                                    {post.region ? `${post.region} · ` : ''}{post.barangay ? `${post.barangay} · ` : ''}{formatTime(post.created_at)}
                                                    {isNew(post.created_at) ? '  🟢 NEW' : ''}
                                                </Text>
                                            </View>
                                            {isAdmin && (
                                                <TouchableOpacity style={styles.cardDeleteBtn} onPress={() => deletePost(post)}>
                                                    <Ionicons name="trash-outline" size={layout.isMonitor ? 20 : 17} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <TouchableOpacity onPress={() => openLightbox(post)} activeOpacity={0.92}>
                                            <CachedImage
                                                source={{ uri: post.image_url }}
                                                style={styles.cardImage}
                                                contentFit="contain"
                                                cachePolicy="memory-disk"
                                            />
                                        </TouchableOpacity>

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
                        COG Philippines · NTGD Field Correspondents · Auto-refreshes every 10s
                    </Text>
                </View>
            </SafeAreaView>
            {/* ── Lightbox ── */}
            {lightboxPost && (
                <Animated.View style={[StyleSheet.absoluteFill, styles.lightboxBg, { opacity: lightboxAnim }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeLightbox} activeOpacity={1} />
                    <Animated.View
                        style={[styles.lightboxContent, {
                            transform: [{ scale: lightboxAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
                        }]}
                    >
                        <TouchableOpacity style={styles.lightboxCloseBtn} onPress={closeLightbox}>
                            <Ionicons name="close-circle" size={34} color="rgba(255,255,255,0.85)" />
                        </TouchableOpacity>
                        <CachedImage
                            source={{ uri: lightboxPost.image_url }}
                            style={{ width: width * 0.92, height: height * 0.72 }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
                        <View style={styles.lightboxInfo}>
                            <Text style={[styles.lightboxName, { fontSize: layout.isMonitor ? 18 : 15 }]}>
                                {lightboxPost.user_name}
                                {lightboxPost.region ? <Text style={styles.lightboxRegion}>  ·  {lightboxPost.region}</Text> : null}
                                {lightboxPost.barangay ? <Text style={styles.lightboxRegion}>  ·  {lightboxPost.barangay}</Text> : null}
                            </Text>
                            {(() => { const { main } = splitCaption(lightboxPost.caption); return main ? (
                                <Text style={[styles.lightboxCaption, { fontSize: layout.isMonitor ? 15 : 13 }]}>{main}</Text>
                            ) : null; })()}
                        </View>
                    </Animated.View>
                </Animated.View>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg:          { flex: 1 },
    overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,10,40,0.70)' },
    safe:        { flex: 1 },
    scrollArea:  { flex: 1 },
    centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 14 },
    emptyTitle:  { color: '#fff', marginTop: 20, fontFamily: 'Anton_400Regular' },
    emptySub:    { color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 10, lineHeight: 28 },

    // ── Top bar ──
    topBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 2, borderBottomColor: '#C9A84C',
    },
    backBtn:        { padding: 4, marginRight: 8 },
    topBarCenter:   { flex: 1 },
    topBarTitle:    { color: '#C9A84C', fontFamily: 'Anton_400Regular', letterSpacing: 0.5 },
    topBarMeta:     { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    liveDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 7 },
    topBarMetaText: { color: 'rgba(255,255,255,0.55)' },
    viewToggleBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
        borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
    },
    viewToggleText: { color: '#C9A84C' },
    countPill:      { backgroundColor: '#C9A84C', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
    countPillNum:   { color: '#1a1a2e', fontFamily: 'Anton_400Regular', lineHeight: 26 },
    countPillLabel: { color: '#1a1a2e', letterSpacing: 0.5 },

    // ── Full-screen slideshow ──
    slideshowFull: { flex: 1, flexDirection: 'column' },
    slideshowInfo: { paddingBottom: 18 },

    // ── Hero (feed mode) ──
    heroWrap: { position: 'relative', overflow: 'hidden', alignSelf: 'center', borderRadius: 12, marginVertical: 8 },
    heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 16 },

    // ── Shared hero overlays ──
    newBadge:    { position: 'absolute', top: 14, left: 14, backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    newBadgeText:{ color: '#fff', letterSpacing: 1.2, fontFamily: 'Anton_400Regular' },
    heroDeleteBtn: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 8, padding: 8 },
    navArrow: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 16, zIndex: 10 },
    navLeft:  { left: 0 },
    navRight: { right: 0 },
    heroCaption: {
        color: '#fff', fontFamily: 'Anton_400Regular', marginBottom: 12,
        textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
    },
    heroMeta:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    heroReporter: { color: '#C9A84C', fontFamily: 'Anton_400Regular' },
    heroRegion:   { color: 'rgba(255,255,255,0.65)' },
    heroTime:     { color: 'rgba(255,255,255,0.45)' },
    dots:         { flexDirection: 'row', gap: 8 },
    dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
    dotActive:    { backgroundColor: '#C9A84C', width: 24 },

    // ── Filmstrip ──
    filmstripWrap: { borderTopWidth: 2, borderTopColor: 'rgba(201,168,76,0.3)', backgroundColor: 'rgba(0,0,0,0.75)', paddingVertical: 8 },
    filmstrip:     { gap: 8, alignItems: 'center' },
    thumb:         { borderRadius: 8, overflow: 'hidden', borderWidth: 2.5 },
    thumbNewDot:   { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: '#fff' },

    // ── Feed ──
    feed:      { paddingTop: 16, flexDirection: 'column' },
    feedLabel: { color: 'rgba(201,168,76,0.7)', letterSpacing: 1.4, marginBottom: 12, paddingHorizontal: 16 },

    card: {
        backgroundColor: '#111c44', borderRadius: 16, overflow: 'hidden',
        marginBottom: 20, marginHorizontal: 'auto' as any,
        shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },
    cardHeader:  { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 },
    avatar:      { backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText:  { color: '#1a1a2e', fontFamily: 'Anton_400Regular' },
    cardMeta:    { flex: 1 },
    cardName:    { color: '#fff', fontFamily: 'Anton_400Regular', marginBottom: 2 },
    cardSubMeta: { color: 'rgba(255,255,255,0.45)' },
    cardDeleteBtn: { padding: 6 },
    cardImage:   { width: '100%', aspectRatio: 1, backgroundColor: '#0a0f2a' },
    cardBody:    { padding: 14, paddingTop: 12 },
    cardCaption: { color: '#e2e8f0', marginBottom: 8 },
    cardTags:    { color: '#C9A84C', lineHeight: 22 },

    footer:     { borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.25)', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.65)' },
    footerText: { color: 'rgba(201,168,76,0.6)', letterSpacing: 0.8, textAlign: 'center' },

    // ── Lightbox ──
    lightboxBg: {
        backgroundColor: 'rgba(0,0,0,0.93)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    lightboxContent: {
        alignItems: 'center',
        width: '100%',
    },
    lightboxCloseBtn: {
        alignSelf: 'flex-end',
        paddingRight: 16,
        paddingBottom: 8,
    },
    lightboxInfo: {
        paddingHorizontal: 20,
        paddingTop: 12,
        maxWidth: 600,
        width: '100%',
    },
    lightboxName:    { color: '#C9A84C', fontFamily: 'Anton_400Regular', marginBottom: 4 },
    lightboxRegion:  { color: 'rgba(255,255,255,0.5)' },
    lightboxCaption: { color: '#e2e8f0', lineHeight: 22 },
});
