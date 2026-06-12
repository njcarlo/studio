import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform, Text, Animated, StyleSheet, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AuthScreen from './screens/AuthScreen';
import ActionScreen from './screens/ActionScreen';
import MapScreen from './screens/MapScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import CountdownScreen from './screens/CountdownScreen';
import LiveBoardScreen from './screens/LiveBoardScreen';
import LedWallScreen from './screens/LedWallScreen';
import LedWallBarangayScreen from './screens/LedWallBarangayScreen';
import CorrespondentScreen from './screens/CorrespondentScreen';
import NewsFeedScreen from './screens/NewsFeedScreen';
import { useAuth } from './context/AuthContext';

const EVENT_DATE = new Date('2026-06-12T06:00:00+08:00'); // June 12, 6am PHT
const isEventLive = () => new Date() >= EVENT_DATE;

// Paths that don't require authentication (accessible on monitors/public displays)
const PUBLIC_PATHS = new Set(['/', '/auth', '/news-feed', '/live-board', '/led-wall', '/led-wall-barangay']);

export type RootStackParamList = {
    Auth: undefined;
    Countdown: undefined;
    Main: undefined;
    AdminDashboard: undefined;
    LiveBoard: undefined;
    LedWall: undefined;
    LedWallBarangay: undefined;
    NewsFeed: undefined;
};

export type MainTabParamList = {
    Action: undefined;
    Map: undefined;
    Correspondent: undefined;
    News: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Small dismissible banner shown at the top once per login to announce the
// new Photos and News tabs. Fades in, sits for a few seconds, then fades out.
function NewTabsToast() {
    const opacity = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.ease, useNativeDriver: true }),
            Animated.delay(4000),
            Animated.timing(opacity, { toValue: 0, duration: 300, easing: Easing.ease, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    }, [opacity]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
            <SafeAreaView edges={['top']}>
                <View style={styles.toastInner}>
                    <Ionicons name="sparkles" size={16} color="#C9A84C" />
                    <Text style={styles.toastText}>Photos and News tabs are now online!</Text>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}

function MainTabs() {
    const { isDasmarinas, isCorrespondent } = useAuth();

    return (
        <View style={{ flex: 1 }}>
        <NewTabsToast />
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help';
                    if (route.name === 'Action') iconName = focused ? 'hand-right' : 'hand-right-outline';
                    else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
                    else if (route.name === 'Correspondent') iconName = focused ? 'camera' : 'camera-outline';
                    else if (route.name === 'News') iconName = focused ? 'newspaper' : 'newspaper-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2f95dc',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Action" component={ActionScreen} />
            {isDasmarinas && <Tab.Screen name="Map" component={MapScreen} />}
            <Tab.Screen name="Correspondent" component={CorrespondentScreen} options={{ tabBarLabel: 'Photos' }} />
            <Tab.Screen name="News" component={NewsFeedScreen} options={{ tabBarLabel: 'News' }} />
        </Tab.Navigator>
        </View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        alignItems: 'center',
    },
    toastInner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 8, paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: 'rgba(26,26,46,0.92)', borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
    },
    toastText: { color: '#fff', fontSize: 12.5 },
});

const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['tracttracker://', 'https://tracttracker.app', 'https://tract-tracker.vercel.app'],
    config: {
        screens: {
            Auth: 'auth',
            Countdown: 'countdown',
            Main: {
                path: '',
                screens: {
                    Action: 'action',
                    Map: 'map',
                    Correspondent: 'correspondent',
                    News: 'news',
                }
            },
            AdminDashboard: 'admin-dashboard',
            LiveBoard: 'live-board',
            LedWall: 'led-wall',
            LedWallBarangay: 'led-wall-barangay',
            NewsFeed: 'news-feed',
        },
    },
};

export default function AppNavigator() {
    const { session, isLoading, isTester, isCorrespondent } = useAuth();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        // Only clean up the URL bar when a logged-in user lands on /auth via direct URL.
        // No hard redirects — React Navigation's conditional stack handles auth gating.
        if (session && window.location.pathname === '/auth') {
            window.history.replaceState(null, '', '/');
        }
    }, [session]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#e74c3c" />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <>
                        {isTester || isCorrespondent || isEventLive() ? (
                            <Stack.Screen name="Main" component={MainTabs} />
                        ) : (
                            <Stack.Screen name="Countdown" component={CountdownScreen} />
                        )}
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="LiveBoard" component={LiveBoardScreen} />
                        <Stack.Screen name="LedWall" component={LedWallScreen} />
                        <Stack.Screen name="LedWallBarangay" component={LedWallBarangayScreen} />
                        <Stack.Screen name="NewsFeed" component={NewsFeedScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen name="LedWall" component={LedWallScreen} />
                        <Stack.Screen name="LedWallBarangay" component={LedWallBarangayScreen} />
                        <Stack.Screen name="NewsFeed" component={NewsFeedScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
