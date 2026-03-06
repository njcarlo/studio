import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web stub for react-native-maps — native maps are not supported on web.
// This prevents a silent crash when bundling for web.

export default function MapView({ children, style }) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.placeholder}>
                <Text style={styles.icon}>🗺️</Text>
                <Text style={styles.title}>Map View</Text>
                <Text style={styles.subtitle}>Interactive maps are available on the mobile app.</Text>
            </View>
            {children}
        </View>
    );
}

export function Marker({ title, description }) {
    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8ecf0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        alignItems: 'center',
        padding: 40,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        maxWidth: 300,
    },
});
