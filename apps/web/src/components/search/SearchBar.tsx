'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

interface SearchBarProps {
    onSearch: (lat: number, lng: number, name?: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchValue.trim()) return;

        setLoading(true);

        try {
            // Check if input is coordinates (format: "lat, lng" or "lat,lng")
            const coordPattern = /^[-+]?\d+\.?\d*\s*,\s*[-+]?\d+\.?\d*$/;

            if (coordPattern.test(searchValue)) {
                // Parse as coordinates
                const [latStr, lngStr] = searchValue.split(',').map(s => s.trim());
                const lat = parseFloat(latStr);
                const lng = parseFloat(lngStr);

                if (!isNaN(lat) && !isNaN(lng)) {
                    onSearch(lat, lng);
                } else {
                    alert('Invalid coordinates format');
                }
            } else {
                // Geocode location name
                const result = await ApiClient.geocodeLocation(searchValue);

                if (result) {
                    onSearch(result.lat, result.lng, searchValue);
                } else {
                    alert('Location not found. Try a different search term.');
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex gap-2 w-full">
            <Input
                type="text"
                placeholder="Search by location name or coordinates (lat, lng)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={loading}
            />
            <Button
                onClick={handleSearch}
                disabled={loading}
                className="px-6"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Search className="w-4 h-4" />
                )}
            </Button>
        </div>
    );
}
