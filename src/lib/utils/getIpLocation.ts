export async function getIpAndLocation(): Promise<{
    ip: string;
    location: {
        country?: string;
        region?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
    };
}> {
    try {
        // Using ipify API - you may need to sign up for an API key for production use
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();

        // Using ipapi.co for geolocation - consider alternatives for production
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoResponse.json();

        return {
            ip,
            location: {
                country: geoData.country_name,
                region: geoData.region,
                city: geoData.city,
                latitude: geoData.latitude,
                longitude: geoData.longitude
            }
        };
    } catch (error) {
        console.error('Error getting IP and location:', error);
        return {
            ip: 'unknown',
            location: {}
        };
    }
}