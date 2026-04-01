import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabaseAdmin } from '../supabase';

type BarangayCount = { barangay: string; count: number };
type RegionCount = { region: string; label: string; lat: number; lng: number; count: number };

const REGION_COORDS: RegionCount[] = [
    { region: 'NLR', label: 'North Luzon Region',   lat: 16.5167, lng: 121.2000, count: 0 },
    { region: 'MMR', label: 'Metro Manila Region',  lat: 14.5995, lng: 120.9842, count: 0 },
    { region: 'SLR', label: 'South Luzon Region',   lat: 13.6218, lng: 123.1948, count: 0 },
    { region: 'VIS', label: 'Visayas',              lat: 10.3157, lng: 123.8854, count: 0 },
    { region: 'MIN', label: 'Mindanao',             lat:  7.8731, lng: 125.0000, count: 0 },
];

function buildLeafletHTML(markers: BarangayCount[], regionCounts: RegionCount[]): string {
    const markersJson = JSON.stringify(markers);
    const regionsJson = JSON.stringify(regionCounts);
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; background: #0a0f3c; }
  #map { width: 100vw; height: 100vh; }
  #status { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.7); color: #C9A84C; padding: 6px 14px;
    border-radius: 20px; font-size: 12px; z-index: 9999; pointer-events: none; }
  .badge {
    background: #1a1a2e; color: #C9A84C;
    border: 2px solid #C9A84C; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; box-shadow: 0 2px 8px rgba(0,0,0,0.5); line-height: 1;
  }
  .badge.zero {
    background: rgba(26,26,46,0.5); color: rgba(201,168,76,0.35);
    border-color: rgba(201,168,76,0.25); box-shadow: none;
  }
  .region-badge {
    background: #C9A84C; color: #1a1a2e;
    border: 3px solid #fff; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; box-shadow: 0 4px 12px rgba(0,0,0,0.6); line-height: 1;
    flex-direction: column; text-align: center;
  }
  .region-badge .r-count { font-size: 14px; }
  .region-badge .r-name { font-size: 8px; opacity: 0.8; margin-top: 1px; }
  .leaflet-popup-content-wrapper { border-radius: 12px; }
  .popup { text-align: center; padding: 4px 8px; }
  .popup-name { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .popup-count { font-size: 28px; font-weight: 900; color: #C9A84C; }
  .popup-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }
</style>
</head>
<body>
<div id="map"></div>
<div id="status">Locating barangays…</div>
<script>
  var ZOOM_THRESHOLD = 11;
  var map = L.map('map', { zoomControl: true }).setView([14.3262, 120.9388], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
  }).addTo(map);

  var barangayData = ${markersJson};
  var regionData = ${regionsJson};
  var maxCount = Math.max.apply(null, barangayData.map(function(b){ return b.count; })) || 1;
  var resolved = 0;
  var total = barangayData.length;
  var statusEl = document.getElementById('status');

  // Layer groups
  var barangayLayer = L.layerGroup().addTo(map);
  var regionLayer = L.layerGroup();
  var geocodeDone = false;

  // ── Region markers (fixed coords, always ready) ──────────────────
  var maxRegion = Math.max.apply(null, regionData.map(function(r){ return r.count; })) || 1;
  regionData.forEach(function(r) {
    var size = r.count === 0 ? 52 : Math.max(52, Math.min(90, 52 + Math.round((r.count / maxRegion) * 38)));
    var icon = L.divIcon({
      className: '',
      html: '<div class="region-badge" style="width:' + size + 'px;height:' + size + 'px;">' +
            '<span class="r-count">' + r.count.toLocaleString() + '</span>' +
            '<span class="r-name">' + r.region + '</span></div>',
      iconSize: [size, size], iconAnchor: [size/2, size/2], popupAnchor: [0, -(size/2+4)],
    });
    L.marker([r.lat, r.lng], { icon: icon }).addTo(regionLayer).bindPopup(
      '<div class="popup"><div class="popup-name">' + r.label + '</div>' +
      '<div class="popup-count">' + r.count.toLocaleString() + '</div>' +
      '<div class="popup-label">tracts given</div></div>'
    );
  });

  // ── Zoom handler ─────────────────────────────────────────────────
  function updateLayers() {
    var zoom = map.getZoom();
    if (zoom >= ZOOM_THRESHOLD) {
      if (map.hasLayer(regionLayer)) map.removeLayer(regionLayer);
      if (!map.hasLayer(barangayLayer)) map.addLayer(barangayLayer);
    } else {
      if (map.hasLayer(barangayLayer)) map.removeLayer(barangayLayer);
      if (!map.hasLayer(regionLayer)) map.addLayer(regionLayer);
    }
  }
  map.on('zoomend', updateLayers);

  // ── Barangay markers (geocoded) ──────────────────────────────────
  function placeMarker(b, lat, lng) {
    var isZero = b.count === 0;
    var size = isZero ? 26 : Math.max(34, Math.min(62, 34 + Math.round((b.count / maxCount) * 28)));
    var fontSize = size < 42 ? 10 : size < 52 ? 12 : 14;
    var icon = L.divIcon({
      className: '',
      html: '<div class="badge' + (isZero ? ' zero' : '') + '" style="width:' + size + 'px;height:' + size + 'px;font-size:' + fontSize + 'px;">' + b.count + '</div>',
      iconSize: [size, size], iconAnchor: [size/2, size/2], popupAnchor: [0, -(size/2+4)],
    });
    L.marker([lat, lng], { icon: icon }).addTo(barangayLayer).bindPopup(
      '<div class="popup"><div class="popup-name">' + b.barangay + '</div>' +
      '<div class="popup-count">' + b.count.toLocaleString() + '</div>' +
      '<div class="popup-label">tracts given</div></div>'
    );
  }

  function geocodeNext(index) {
    if (index >= barangayData.length) {
      statusEl.style.display = 'none';
      geocodeDone = true;
      return;
    }
    var b = barangayData[index];
    var query = encodeURIComponent(b.barangay + ', Dasmariñas, Cavite, Philippines');
    fetch('https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1')
      .then(function(r){ return r.json(); })
      .then(function(results) {
        resolved++;
        statusEl.textContent = 'Locating ' + resolved + ' / ' + total + '…';
        if (results && results[0]) {
          placeMarker(b, parseFloat(results[0].lat), parseFloat(results[0].lon));
        }
        setTimeout(function(){ geocodeNext(index + 1); }, 300);
      })
      .catch(function() {
        resolved++;
        setTimeout(function(){ geocodeNext(index + 1); }, 300);
      });
  }

  geocodeNext(0);
</script>
</body>
</html>`;
}

export default function MapScreen() {
    const [markers, setMarkers] = useState<BarangayCount[]>([]);
    const [regionCounts, setRegionCounts] = useState<RegionCount[]>(REGION_COORDS);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const ALL_BARANGAYS = [
        'Burol','Burol I','Burol II','Burol III','Datu Esmael',
        'Emmanuel Bergado I','Emmanuel Bergado II',
        'Fatima I','Fatima II','Fatima III','H-2',
        'Langkaan I','Langkaan II','Luzviminda I','Luzviminda II',
        'Paliparan I','Paliparan II','Paliparan III','Sabang',
        'Saint Peter I','Saint Peter II','Salawag',
        'Salitran I','Salitran II','Salitran III','Salitran IV',
        'Sampaloc I','Sampaloc II','Sampaloc III','Sampaloc IV','Sampaloc V',
        'San Agustin I','San Agustin II','San Agustin III',
        'San Andres I','San Andres II',
        'San Antonio de Padua I','San Antonio de Padua II',
        'San Dionisio','San Esteban',
        'San Francisco I','San Francisco II',
        'San Isidro Labrador I','San Isidro Labrador II',
        'San Jose','San Juan',
        'San Lorenzo Ruiz I','San Lorenzo Ruiz II',
        'San Luis I','San Luis II','San Manuel I','San Manuel II',
        'San Mateo','San Miguel','San Miguel II',
        'San Nicolas I','San Nicolas II','San Roque','San Simon',
        'Santa Cristina I','Santa Cristina II',
        'Santa Cruz I','Santa Cruz II',
        'Santa Fe','Santa Lucia','Santa Maria',
        'Santo Cristo','Santo Niño I','Santo Niño II',
        'Victoria Reyes','Zone I','Zone I-B','Zone II','Zone III','Zone IV',
    ];

    useEffect(() => {
        async function load() {
            try {
                const { data } = await supabaseAdmin
                    .from('tract_users')
                    .select('barangay, region, tracts_given');

                const grouped: Record<string, number> = {};
                const groupedRegion: Record<string, number> = {};
                if (data) {
                    data.forEach(row => {
                        if (row.barangay) {
                            grouped[row.barangay] = (grouped[row.barangay] || 0) + (row.tracts_given || 0);
                        }
                        if (row.region) {
                            groupedRegion[row.region] = (groupedRegion[row.region] || 0) + (row.tracts_given || 0);
                        }
                    });
                }

                const result: BarangayCount[] = ALL_BARANGAYS.map(b => ({
                    barangay: b,
                    count: grouped[b] || 0,
                }));

                setMarkers(result);
                setRegionCounts(REGION_COORDS.map(r => ({ ...r, count: groupedRegion[r.region] || 0 })));
                setTotal(Object.values(grouped).reduce((s, v) => s + v, 0));
            } catch (e) {
                console.error('MapScreen load error', e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const html = buildLeafletHTML(markers, regionCounts);

    const renderMap = () => {
        if (isLoading) {
            return <View style={styles.loader}><ActivityIndicator size="large" color="#1a1a2e" /></View>;
        }
        if (Platform.OS === 'web') {
            return (
                <iframe
                    srcDoc={html}
                    style={{ flex: 1, border: 'none', width: '100%', height: '100%' } as any}
                    title="Tract Map"
                    sandbox="allow-scripts allow-same-origin allow-downloads"
                />
            );
        }
        const { WebView } = require('react-native-webview');
        return <WebView source={{ html }} style={styles.map} javaScriptEnabled originWhitelist={['*']} />;
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>COG Philippines Tracts Giving Day</Text>
                <Text style={styles.headerSub}>Dasmariñas City · {total.toLocaleString()} tracts given</Text>
            </View>
            {renderMap()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: {
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
        alignItems: 'center', backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 18, color: '#1a1a2e' },
    headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
    map: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
