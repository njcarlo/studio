import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

// Barangay coordinates for Dasmariñas City
const BARANGAY_COORDS: Record<string, { lat: number; lng: number }> = {
    'Burol': { lat: 14.3312, lng: 120.9410 },
    'Burol I': { lat: 14.3320, lng: 120.9415 },
    'Burol II': { lat: 14.3330, lng: 120.9420 },
    'Burol III': { lat: 14.3340, lng: 120.9425 },
    'Langkaan I': { lat: 14.3160, lng: 120.9520 },
    'Langkaan II': { lat: 14.3150, lng: 120.9530 },
    'Sampaloc I': { lat: 14.3200, lng: 120.9300 },
    'Sampaloc II': { lat: 14.3210, lng: 120.9310 },
    'Sampaloc III': { lat: 14.3220, lng: 120.9320 },
    'Salawag': { lat: 14.3100, lng: 120.9400 },
    'Salitran I': { lat: 14.3050, lng: 120.9350 },
    'Salitran II': { lat: 14.3060, lng: 120.9360 },
    'Paliparan I': { lat: 14.3400, lng: 120.9450 },
    'Paliparan II': { lat: 14.3410, lng: 120.9460 },
    'Paliparan III': { lat: 14.3420, lng: 120.9470 },
    'Sabang': { lat: 14.3250, lng: 120.9280 },
    'San Agustin I': { lat: 14.3180, lng: 120.9380 },
    'San Jose': { lat: 14.3270, lng: 120.9440 },
    'Zone I': { lat: 14.3290, lng: 120.9390 },
    'Zone II': { lat: 14.3295, lng: 120.9395 },
    'Zone III': { lat: 14.3300, lng: 120.9400 },
    'Zone IV': { lat: 14.3305, lng: 120.9405 },
};

type BarangayCount = { barangay: string; count: number; lat: number; lng: number };

function buildLeafletHTML(markers: BarangayCount[], total: number): string {
    const markersJson = JSON.stringify(markers);
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; }
  #map { width: 100vw; height: 100vh; }
  .count-badge {
    background: #1a1a2e;
    color: #FFD700;
    border: 2px solid #FFD700;
    border-radius: 50%;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 11px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }
  .count-badge.big {
    width: 48px; height: 48px;
    font-size: 13px;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([14.3262, 120.9388], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  var markers = ${markersJson};
  markers.forEach(function(b) {
    if (!b.lat || !b.lng) return;
    var size = b.count > 100 ? 48 : 36;
    var icon = L.divIcon({
      className: '',
      html: '<div class="count-badge' + (b.count > 100 ? ' big' : '') + '">' + b.count + '</div>',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
    L.marker([b.lat, b.lng], { icon: icon })
      .addTo(map)
      .bindPopup('<b>' + b.barangay + '</b><br>Tracts given: ' + b.count);
  });
</script>
</body>
</html>`;
}

export default function MapScreen() {
    const { authState } = useAuth();
    const [markers, setMarkers] = useState<BarangayCount[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data } = await supabase
                    .from('tract_users')
                    .select('barangay, tracts_given')
                    .eq('region', 'MMR');

                if (data) {
                    // Group by barangay
                    const grouped: Record<string, number> = {};
                    data.forEach(row => {
                        if (row.barangay) {
                            grouped[row.barangay] = (grouped[row.barangay] || 0) + (row.tracts_given || 0);
                        }
                    });

                    const result: BarangayCount[] = Object.entries(grouped)
                        .map(([barangay, count]) => ({
                            barangay,
                            count,
                            lat: BARANGAY_COORDS[barangay]?.lat ?? 0,
                            lng: BARANGAY_COORDS[barangay]?.lng ?? 0,
                        }))
                        .filter(b => b.lat !== 0);

                    setMarkers(result);
                    setTotal(result.reduce((s, b) => s + b.count, 0));
                }
            } catch (e) {
                console.error('MapScreen load error', e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const html = buildLeafletHTML(markers, total);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>COG Nation Tracts Giving Day</Text>
                <Text style={styles.headerSub}>Dasmariñas City · {total.toLocaleString()} tracts given</Text>
            </View>
            {isLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#1a1a2e" />
                </View>
            ) : (
                <WebView
                    source={{ html }}
                    style={styles.map}
                    javaScriptEnabled
                    originWhitelist={['*']}
                />
            )}
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
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
    headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: '600' },
    map: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});