const axios = require("axios");

async function geocodePlace(place) {
    const url = "https://nominatim.openstreetmap.org/search";

    const response = await axios.get(url, {
        params: {
            q: place,
            format: "json",
            limit: 1,
        },
        headers: {
            "User-Agent": "wanderlust-app",
        },
    });

    if (response.data.length === 0) {
        return null;
    }

    return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
    };
}

module.exports = geocodePlace;
