import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AuthScreen from './screens/AuthScreen';
import ActionScreen from './screens/ActionScreen';
import MapScreen from './screens/MapScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    AdminDashboard: undefined;
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
    prefixes: ['tracttracker://', 'https://tracttracker.app'],
    config: {
        screens: {
            Auth: 'auth',
            Main: {
                screens: {
                    Action: 'action',
                    Map: 'map',
                }
            },
            AdminDashboard: 'admin-dashboard',
        },
    },
};

export default function AppNavigator() {
    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
