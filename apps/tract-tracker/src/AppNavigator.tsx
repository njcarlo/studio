import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform } from 'react-native';

import AuthScreen from './screens/AuthScreen';
import ActionScreen from './screens/ActionScreen';
import MapScreen from './screens/MapScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import CountdownScreen from './screens/CountdownScreen';
import LiveBoardScreen from './screens/LiveBoardScreen';
import CorrespondentScreen from './screens/CorrespondentScreen';
import NewsFeedScreen from './screens/NewsFeedScreen';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';

const EVENT_DATE = new Date('2026-06-12T06:00:00+08:00'); // June 12, 6am PHT
const isEventLive = () => new Date() >= EVENT_DATE;

// Paths that don't require authentication (accessible on monitors/public displays)
const PUBLIC_PATHS = new Set(['/', '/auth', '/news-feed', '/live-board']);

export type RootStackParamList = {
    Auth: undefined;
    Countdown: undefined;
    Main: undefined;
    AdminDashboard: undefined;
    LiveBoard: undefined;
    NewsFeed: undefined;
};

export type MainTabParamList = {
    Action: undefined;
    Map: undefined;
    Correspondent: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    const { isDasmarinas, isCorrespondent } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help';
                    if (route.name === 'Action') iconName = focused ? 'hand-right' : 'hand-right-outline';
                    else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
                    else if (route.name === 'Correspondent') iconName = focused ? 'camera' : 'camera-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2f95dc',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Action" component={ActionScreen} />
            {isDasmarinas && <Tab.Screen name="Map" component={MapScreen} />}
            {isCorrespondent && <Tab.Screen name="Correspondent" component={CorrespondentScreen} />}
        </Tab.Navigator>
    );
}

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
                }
            },
            AdminDashboard: 'admin-dashboard',
            LiveBoard: 'live-board',
            NewsFeed: 'news-feed',
        },
    },
};

export default function AppNavigator() {
    const { session, isLoading, isTester } = useAuth();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const path = window.location.pathname;
        if (session && path === '/auth') {
            window.history.replaceState(null, '', '/');
        } else if (!session && !isLoading && !PUBLIC_PATHS.has(path)) {
            window.location.replace('/auth');
        }
    }, [session, isLoading]);

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
                        {isTester || isEventLive() ? (
                            <Stack.Screen name="Main" component={MainTabs} />
                        ) : (
                            <Stack.Screen name="Countdown" component={CountdownScreen} />
                        )}
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="LiveBoard" component={LiveBoardScreen} />
                        <Stack.Screen name="NewsFeed" component={NewsFeedScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen name="NewsFeed" component={NewsFeedScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
