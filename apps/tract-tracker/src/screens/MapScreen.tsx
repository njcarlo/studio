import React from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Map scope: Metro Manila Region (MMR) > Dasmariñas City
// All counts here are for barangays within Dasmarinas, which is a subset of MMR

const DASMARINAS_COORDS = {
    latitude: 14.3262,
    longitude: 120.9388,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

// Barangay-level data for Dasmariñas (MMR > Dasma)
const MOCK_BARANGAY_DATA = [
    { id: '1', name: 'Burol', count: 120, lat: 14.3312, lng: 120.9410 },
    { id: '2', name: 'Langkaan', count: 85, lat: 14.3160, lng: 120.9520 },
    { id: '3', name: 'Sampaloc', count: 320, lat: 14.3200, lng: 120.9300 },
];

const DASMA_TOTAL = MOCK_BARANGAY_DATA.reduce((sum, b) => sum + b.count, 0);

export default function MapScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>COG Nation Tracks Giving Day</Text>
                <Text style={styles.headerSub}>Dasmariñas City · MMR › Dasma</Text>
            </View>
            <MapView
                style={styles.map}
                initialRegion={DASMARINAS_COORDS}
            >
                {MOCK_BARANGAY_DATA.map((barangay) => (
                    <Marker
                        key={barangay.id}
                        coordinate={{ latitude: barangay.lat, longitude: barangay.lng }}
                        title={barangay.name}
                        description={`Tracts Given: ${barangay.count}`}
                    >
                        <View style={[styles.markerView, { transform: [{ scale: Math.max(1, barangay.count / 100) }] }]}>
                            <Text style={styles.markerText}>{barangay.count}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#fff',
        zIndex: 10,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: '600' },
    map: { width: '100%', height: '100%' },
    markerView: {
        backgroundColor: '#e74c3c',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#fff',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        elevation: 5,
    },
    markerText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
