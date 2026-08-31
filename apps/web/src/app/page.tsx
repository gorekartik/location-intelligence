'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ApiClient } from '@/lib/api-client';
import { LocationIntelResponse, Landmark } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import dynamic from 'next/dynamic';
import NoSSR from '@/components/NoSSR';

const Map = dynamic(() => import('@/components/map/Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse" />
});

export default function Home() {
    const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060]);
    const [locationData, setLocationData] = useState<LocationIntelResponse | null>(null);
    const [loading, setLoading] = useState(false);
    // 'checking' = fast DB lookup in progress
    // 'fetching_live' = Overpass is being called (slow path, shown after 2s)
    const [loadingPhase, setLoadingPhase] = useState<'checking' | 'fetching_live'>('checking');
    const [error, setError] = useState<string | null>(null);
    const [mapKey, setMapKey] = useState(0);
    const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchLocationData = async (lat: number, lng: number) => {
        setLoading(true);
        setLoadingPhase('checking');
        setError(null);

        // After 2 seconds with no response, assume Overpass is being called
        // and upgrade the message to inform the user it may take a while.
        phaseTimerRef.current = setTimeout(() => {
            setLoadingPhase('fetching_live');
        }, 15000);

        try {
            const data = await ApiClient.getLocationIntel(lat, lng);
            setLocationData(data);
            setCenter([lat, lng]);
            setMapKey(prev => prev + 1);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch location data');
            console.error('Error fetching location data:', err);
        } finally {
            if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
            setLoading(false);
            setLoadingPhase('checking'); // reset for next search
        }
    };

    const handleSearch = (lat: number, lng: number, name?: string) => {
        fetchLocationData(lat, lng);
    };

    const handleLandmarkClick = (landmark: Landmark) => {
        // Center map on clicked landmark
        const newCenter: [number, number] = [
            landmark.position.coordinates[1],  //GeoJson uses [lng, lat]
            landmark.position.coordinates[0],
        ];
        setCenter(newCenter);
        setMapKey(prev => prev + 1);
    };

    return (
        <main className="h-screen w-screen flex flex-col overflow-hidden">
            {/* Header with Search Bar */}
            <div className="bg-background border-b p-4 z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-2">
                        <h1 className="text-2xl font-bold">Location Intelligence Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Search by location name or coordinates to analyze retail potential
                        </p>
                    </div>
                    <SearchBar onSearch={handleSearch} />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 max-w-4xl mx-auto w-full">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Map Container */}
            <div className="flex-1 relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[999] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            {loadingPhase === 'checking' ? (
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium">Checking database…</p>
                                    <p className="text-xs text-muted-foreground">Looking for cached data nearby</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium animate-pulse text-primary">
                                        Fetching live data from OpenStreetMap…
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        This location hasn't been indexed yet.<br />
                                        Querying live map data — this may take up to 30 seconds.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <NoSSR>
                    <Map
                        key={mapKey}
                        center={center}
                        locationData={locationData}
                        onLandmarkClick={handleLandmarkClick}
                    />
                </NoSSR>

                {/* Sidebar */}
                {locationData && (
                    <Sidebar
                        zones={locationData.zones}
                        summary={locationData.summary}
                        onLandmarkClick={handleLandmarkClick}
                    />
                )}

                {/* Instructions overlay when no data */}
                {!locationData && !loading && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[999] pointer-events-none">
                        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-6 shadow-lg max-w-md">
                            <h3 className="font-semibold mb-2">Get Started</h3>
                            <p className="text-sm text-muted-foreground">
                                Enter a location name or coordinates in the search bar above to view retail intelligence insights.
                            </p>
                        </div>
                    </div>
                )}

                {/* Debug Info Overlay */}
                <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 p-4 rounded shadow border text-xs font-mono">
                    <p><strong>Debug Info:</strong></p>
                    <p>Center: {center[0].toFixed(4)}, {center[1].toFixed(4)}</p>
                    <p>Data Loaded: {locationData ? 'Yes' : 'No'}</p>
                    {locationData && (
                        <>
                            <p>Green Zone: {locationData.zones.green.length}</p>
                            <p>Yellow Zone: {locationData.zones.yellow.length}</p>
                            <p>Blue Zone: {locationData.zones.blue.length}</p>
                            {locationData.debug && (
                                <p
                                    className={`mt-1 font-bold ${locationData.debug.dataSource === 'overpass_live'
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                        }`}
                                >
                                    Source: {locationData.debug.dataSource === 'overpass_live'
                                        ? '🌐 Live (Overpass)'
                                        : '✅ DB Cache'
                                    }
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
