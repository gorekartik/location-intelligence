
//This file is not used anywhere for now
//This file is a wrapper component around react-leaflet’s MapContainer
//It provides a basic map setup with a center marker and tile layer
'use client';

import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icon in Next.js - must run only on client
let iconFixed = false;

function fixLeafletIcon() {
    if (typeof window === 'undefined' || iconFixed) return;

    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
    });
    iconFixed = true;
}

interface MapContainerProps {
    center: LatLngExpression;
    zoom?: number;
    children?: React.ReactNode;
}

export function MapContainer({ center, zoom = 11, children }: MapContainerProps) {
    useEffect(() => {
        fixLeafletIcon();
    }, []);

    return (
        <div className="h-full w-full relative" suppressHydrationWarning>
            <LeafletMapContainer
                center={center}
                zoom={zoom}
                className="h-full w-full z-0"
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Center marker */}
                <Marker position={center}>
                    <Popup>Search Center</Popup>
                </Marker>

                {children}
            </LeafletMapContainer>
        </div>
    );
}
