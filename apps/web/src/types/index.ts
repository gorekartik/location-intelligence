export interface Landmark {
    id: string;
    name: string;
    category: string;
    position: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    distance: number; // in meters
    rating?: number;
    hours?: any;
}

export interface ZoneData {
    green: Landmark[];
    yellow: Landmark[];
    blue: Landmark[];
}

export interface LocationIntelResponse {
    zones: ZoneData;
    connectivity: any[];
    summary: string;
    debug?: {
        spatial: number;
        roads: number;
        gemini: number;
        total: number;
    };
}

export interface SearchLocation {
    name?: string;
    lat: number;
    lng: number;
}
