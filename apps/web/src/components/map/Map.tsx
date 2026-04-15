'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationIntelResponse, Landmark } from '@/types';
import L from 'leaflet';
import { useEffect } from 'react';
import { ZoneCircles } from './ZoneCircles';
import { LandmarkMarkers } from './LandmarkMarkers';

// Fix for default marker icon
const iconFix = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface MapProps {
    center: [number, number];
    locationData: LocationIntelResponse | null;
    onLandmarkClick: (landmark: Landmark) => void;
}

export default function Map({ center, locationData, onLandmarkClick }: MapProps) {
    useEffect(() => {
        iconFix();
    }, []);

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={center}>
                <Popup>Selected Location</Popup>
            </Marker>

            <ZoneCircles center={center} />

            {locationData && (
                <LandmarkMarkers
                    landmarks={[
                        ...locationData.zones.green,
                        ...locationData.zones.yellow,
                        ...locationData.zones.blue,
                    ]}
                    onMarkerClick={onLandmarkClick}
                />
            )}
        </MapContainer>
    );
}
