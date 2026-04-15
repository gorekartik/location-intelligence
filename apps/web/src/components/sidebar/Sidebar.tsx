'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Sparkles } from 'lucide-react';
import { ZoneLandmarkList } from './ZoneLandmarkList';
import { Landmark, ZoneData } from '@/types';

interface SidebarProps {
    zones: ZoneData;
    summary: string;
    onLandmarkClick?: (landmark: Landmark) => void;
}

export function Sidebar({ zones, summary, onLandmarkClick }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'green' | 'yellow' | 'blue'>('green');

    const zoneConfig = {
        green: { name: 'Green Zone (0-5km)', color: '#10b981', landmarks: zones.green },
        yellow: { name: 'Yellow Zone (5-10km)', color: '#f59e0b', landmarks: zones.yellow },
        blue: { name: 'Blue Zone (10-15km)', color: '#3b82f6', landmarks: zones.blue },
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className="fixed top-24 left-4 z-[1000] shadow-lg" // Moved down to top-24 to uncover from header
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>

            <SheetContent
                side="left"
                className="w-[400px] sm:w-[540px] overflow-y-auto h-screen z-[2000] bg-background shadow-2xl"
            >
                <SheetHeader>
                    <SheetTitle>Location Intelligence</SheetTitle>
                </SheetHeader>

                {/* AI Summary Section */}
                {summary && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <h3 className="font-semibold text-sm">AI Summary</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
                    </div>
                )}

                {/* Zone Tabs */}
                <div className="mt-6">
                    <div className="flex gap-2 border-b pb-2">
                        {Object.entries(zoneConfig).map(([key, config]) => (
                            <Button
                                key={key}
                                variant={activeTab === key ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(key as 'green' | 'yellow' | 'blue')}
                                className="flex-1"
                                style={
                                    activeTab === key
                                        ? { backgroundColor: config.color }
                                        : {}
                                }
                            >
                                <span className="truncate">{config.name.split(' ')[0]}</span>
                                <Badge variant="secondary" className="ml-2">
                                    {config.landmarks.length}
                                </Badge>
                            </Button>
                        ))}
                    </div>

                    {/* Landmark List */}
                    <div className="mt-4">
                        <ZoneLandmarkList
                            landmarks={zoneConfig[activeTab].landmarks}
                            zoneName={zoneConfig[activeTab].name}
                            zoneColor={zoneConfig[activeTab].color}
                            onLandmarkClick={onLandmarkClick}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
