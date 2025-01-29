// Initialize the map
const map = L.map('map').setView([27.700769, 85.300140], 12); // Default location

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker at the center
const marker = L.marker([27.700769, 85.300140], {
    draggable: true // Make the marker draggable
}).addTo(map);

// Known locations (for fallback when no name is found)
const knownLocations = [
    { name: "Kathmandu", lat: 27.700769, lon: 85.300140 },
    { name: "Bhaktapur", lat: 27.6685, lon: 85.4280 },
    { name: "Lalitpur", lat: 27.6667, lon: 85.3325 }
];

// Function to calculate distance between two lat-lng points (Haversine formula)
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Function to perform reverse geocoding and get the most localized location name
async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.address) {
            // Extract the address or fallback to unknown
            const address = data.address.road || data.address.suburb || data.address.city || data.address.village || data.address.country;
            
            // Update the input field with the fetched address
            document.getElementById('location').value = address || "Unknown location";
        } else {
            // If no address found, fallback to nearest known location
            getNearestLocation(lat, lng);
        }

        // Update hidden fields for latitude and longitude
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;

        // Update hidden map link field
        const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
        document.getElementById('mapLink').value = mapLink;

    } catch (error) {
        console.error('Error fetching the address:', error);
        document.getElementById('location').value = "Error fetching address";
    }
}

// Function to find the nearest known location
function getNearestLocation(lat, lon) {
    let nearest = null;
    let minDistance = Infinity;

    // Loop through known locations to find the nearest one
    knownLocations.forEach(location => {
        const distance = haversine(lat, lon, location.lat, location.lon);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = location.name;
        }
    });

    // Update the location input field with the nearest known location
    document.getElementById('location').value = nearest || "Location not found";
}

// Update the location when the marker is dragged
marker.on('dragend', function (event) {
    const latLng = event.target.getLatLng();
    reverseGeocode(latLng.lat, latLng.lng); // Call reverse geocoding
});

// Allow the user to click on the map to select the location
map.on('click', function (event) {
    const latLng = event.latlng; // Get the latitude and longitude from the click
    marker.setLatLng(latLng); // Update the marker position
    reverseGeocode(latLng.lat, latLng.lng); // Call reverse geocoding to get the address
});

// Handle form submission
document.getElementById("complaint-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const category = document.getElementById("category").value;
    // const urgency = document.getElementById("urgency").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;
    const mapLink = document.getElementById("mapLink").value;
    const fileInput = document.getElementById("file");
    const file = fileInput.files[0]; // Get the uploaded file

    // Validate inputs
    if (!category || !description || !location) {
        alert("Please fill in all required fields.");
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("category", category);
    formData.append("urgency", urgency);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    formData.append("mapLink", mapLink);

    // Append file only if it exists
    if (file) {
        formData.append("file", file);
    }

    // Submit form data to the server
    try {
        const response = await fetch("/submit-complaint", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message); // Show success alert
            window.location.href = "/post-complaint"; // Redirect to the same page
        } else {
            alert(result.message); // Show error alert
        }
    } catch (error) {
        alert("An error occurred while submitting the complaint.");
        console.error("Error:", error);
    }
});
