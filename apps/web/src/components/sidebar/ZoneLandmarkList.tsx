'use client';

import { Landmark } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ZoneLandmarkListProps {
    landmarks: Landmark[];
    zoneName: string;
    zoneColor: string;
    onLandmarkClick?: (landmark: Landmark) => void;
}

export function ZoneLandmarkList({ landmarks, zoneName, zoneColor, onLandmarkClick }: ZoneLandmarkListProps) {
    if (landmarks.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No landmarks in {zoneName} zone
            </div>
        );
    }

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
                {landmarks.map((landmark) => (
                    <div
                        key={landmark.id}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => onLandmarkClick?.(landmark)}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{landmark.name}</h4>
                                <Badge
                                    variant="outline"
                                    className="mt-1 text-xs"
                                    style={{ borderColor: zoneColor }}
                                >
                                    {landmark.category}
                                </Badge>
                            </div>

                            {landmark.rating && (
                                <div className="flex items-center gap-1 text-xs">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span>{landmark.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{(landmark.distance / 1000).toFixed(2)} km away</span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
