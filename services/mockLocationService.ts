
// Real-time location services using OpenStreetMap (Nominatim) and Zippopotam.us

// Interface for Nominatim results (internal)
interface NominatimResult {
    display_name: string;
    place_id: number;
    lat: string;
    lon: string;
}

// Interface for Zippopotam results (internal)
interface ZippopotamResult {
    "post code": string;
    country: string;
    "country abbreviation": string;
    places: Array<{
        "place name": string;
        "state": string;
        "state abbreviation": string;
        "latitude": string;
        "longitude": string;
    }>;
}

export const searchAddress = async (query: string): Promise<string[]> => {
    // Basic validation to avoid spamming APIs with empty/short queries
    if (!query || query.length < 3) return [];
    
    try {
        // Using OpenStreetMap's Nominatim API (Free, no key required for low usage)
        // We limit to 5 results and bias towards US for this demo context
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=us`;
        
        const response = await fetch(url, {
            headers: {
                // Nominatim requires a User-Agent identifying the application
                'Accept-Language': 'en-US'
            }
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data: NominatimResult[] = await response.json();
        
        // Map the complex object to simple address strings for the Typeahead UI
        return data.map(item => item.display_name);
    } catch (error) {
        console.warn("Address search failed (possibly rate limited or network issue):", error);
        return [];
    }
};

export const lookupZip = async (zip: string): Promise<{ city: string; state: string; country: string } | null> => {
    // US Zip codes are 5 digits
    if (!zip || zip.length !== 5 || isNaN(Number(zip))) return null;
    
    try {
        // Zippopotam.us API (Free, no key required)
        // Currently configured for US ('us'), but supports other countries
        const url = `https://api.zippopotam.us/us/${zip}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            // Zip code likely doesn't exist
            return null;
        }

        const data: ZippopotamResult = await response.json();
        
        if (data.places && data.places.length > 0) {
            const place = data.places[0];
            return {
                city: place["place name"],
                state: place["state abbreviation"], // Use abbreviation (e.g. "CA") for forms
                country: "USA" // Zippopotam returns "United States", but we use standard ISO/Short form
            };
        }
        
        return null;
    } catch (error) {
        console.error("Zip lookup failed:", error);
        return null;
    }
};
