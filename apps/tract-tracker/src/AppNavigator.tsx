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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';

const EVENT_DATE = new Date('2026-06-12T06:00:00+08:00'); // June 12, 6am PHT
const isEventLive = () => new Date() >= EVENT_DATE;

export type RootStackParamList = {
    Auth: undefined;
    Countdown: undefined;
    Main: undefined;
    AdminDashboard: undefined;
    LiveBoard: undefined;
};

export type MainTabParamList = {
    Action: undefined;
    Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    const { isDasmarinas } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help';
                    if (route.name === 'Action') iconName = focused ? 'hand-right' : 'hand-right-outline';
                    else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2f95dc',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Action" component={ActionScreen} />
            {isDasmarinas && <Tab.Screen name="Map" component={MapScreen} />}
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
                }
            },
            AdminDashboard: 'admin-dashboard',
            LiveBoard: 'live-board',
        },
    },
};

export default function AppNavigator() {
    const { session, isLoading, isTester } = useAuth();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const path = window.location.pathname;
        if (session && path === '/auth') {
            // Authenticated but landed on /auth — go to root
            window.history.replaceState(null, '', '/');
        } else if (!session && !isLoading && path !== '/auth') {
            // No session on any protected route — hard redirect to /auth
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
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={AuthScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
