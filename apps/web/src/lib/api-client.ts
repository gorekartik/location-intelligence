import { LocationIntelResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
    /**
     * Fetch location intelligence data
     */
    static async getLocationIntel(lat: number, lng: number): Promise<LocationIntelResponse> {
        const url = `${API_BASE_URL}/api/location-intel?lat=${lat}&lng=${lng}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching location intel:', error);
            throw error;
        }
    }

    /**
     * Geocode a location name to coordinates using Nominatim
     */
    static async geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'LocationIntelligenceSystem/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.length === 0) {
                return null;
            }

            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        } catch (error) {
            console.error('Error geocoding location:', error);
            return null;
        }
    }
}
