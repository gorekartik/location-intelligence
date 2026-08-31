'use client';

import { Marker, Popup, Tooltip } from 'react-leaflet';
import { LatLngExpression, DivIcon } from 'leaflet';
import { Landmark } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

// Create custom icons based on category
const createCustomIcon = (category: string, color: string): DivIcon => {
    if (typeof window === 'undefined') {
        return null as any; // Return placeholder during SSR
    }

    const L = require('leaflet');

    return L.divIcon({
        html: `
            <div style="
                background-color: ${color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 1px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                opacity: 0.7;
            "></div>
        `,
        className: 'custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

const getCategoryColor = (category: string): string => {
    const categoryMap: Record<string, string> = {
        restaurant: '#ef4444',   // soft red
        cafe: '#f97316',         // warm orange
        hospital: '#f43f5e',     // muted pink-red (calm medical red)
        pharmacy: '#22c55e',     // green (health)
        bank: '#3b82f6',         // calm blue
        marketplace: '#a855f7',  // soft purple
        park: '#10b981',        // nature green
        playground: '#84cc16',   // light lime green
        stadium: '#06b6d4',     // cyan (sports/energy)
        monument: '#8b5cf6',    // violet
        memorial: '#ec4899',    // soft pink
        commercial: '#f59e0b',  // amber
        retail: '#eab308',      // yellow
        office: '#6366f1',     // indigo
    };

    return categoryMap[category.toLowerCase()] || '#6b7280';
};

interface LandmarkMarkersProps {
    landmarks: Landmark[];
    onMarkerClick?: (landmark: Landmark) => void;
}

export function LandmarkMarkers({ landmarks, onMarkerClick }: LandmarkMarkersProps) {
    return (
        <>
            {landmarks.map((landmark) => {
                const position: LatLngExpression = [
                    landmark.position.coordinates[1],
                    landmark.position.coordinates[0],
                ];

                const icon = createCustomIcon(
                    landmark.category,
                    getCategoryColor(landmark.category)
                );

                return (
                    <Marker
                        key={landmark.id}
                        position={position}
                        icon={icon}
                        eventHandlers={{
                            click: () => onMarkerClick?.(landmark),
                        }}
                    >
                        <Tooltip
                            direction="top"
                            offset={[0, -10]}
                            opacity={1}
                            className="leaflet-tooltip-shadcn"
                        >
                            <div className="bg-popover text-popover-foreground rounded-md border shadow-md p-2 min-w-[180px] text-sm z-[1000]">
                                <h3 className="font-semibold mb-1">{landmark.name}</h3>

                                <Badge variant="secondary" className="mb-2 h-5 text-[10px] px-1.5">
                                    {landmark.category}
                                </Badge>

                                {landmark.rating && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium text-xs">{landmark.rating.toFixed(1)}</span>
                                    </div>
                                )}

                                {landmark.hours?.opening_hours && (
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                        <span className="font-medium">Hours:</span> {landmark.hours.opening_hours}
                                    </div>
                                )}

                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                    <span className="font-medium">Dist:</span> {(landmark.distance / 1000).toFixed(2)} km
                                </div>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </>
    );
}
