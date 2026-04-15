'use client';

import { Circle } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface ZoneCirclesProps {
    center: LatLngExpression;
}

export function ZoneCircles({ center }: ZoneCirclesProps) {
    return (
        <>
            {/* Green Zone: 0-5km */}
            <Circle
                center={center}
                radius={5000}
                pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.2, // Increased from 0.15
                    weight: 4,        // Increased from 2
                }}
            />

            {/* Yellow Zone: 5-10km */}
            <Circle
                center={center}
                radius={10000}
                pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.2, // Increased from 0.15
                    weight: 4,
                }}
            />

            {/* Blue Zone: 10-15km */}
            <Circle
                center={center}
                radius={15000}
                pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2, // Increased from 0.15
                    weight: 4,
                }}
            />
        </>
    );
}
