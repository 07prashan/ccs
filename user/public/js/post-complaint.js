// document.addEventListener("DOMContentLoaded", function () {
//   const map = L.map("map").setView([27.700769, 85.300140], 12); // Default location: Delhi, India

//   // Load map tiles
//   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       maxZoom: 19,
//       attribution: '© OpenStreetMap contributors'
//   }).addTo(map);

//   // Marker for the location
//   let marker;

//   // On map click, update the location input and place a marker
//   map.on("click", function (event) {
//       const { lat, lng } = event.latlng;

//       // Update input field
//       document.getElementById("location").value = `${lat}, ${lng}`;

//       // Update or add marker
//       if (marker) {
//           marker.setLatLng([lat, lng]);
//       } else {
//           marker = L.marker([lat, lng]).addTo(map);
//       }
//   });
// });


  
//     // Try HTML5 geolocation to get user's location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const pos = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           };
  
//           // Center map to user's location
//           map.setCenter(pos);
//           marker.setPosition(pos);
  
//           // Update location input with user's coordinates
//           document.getElementById("location").value = `${pos.lat}, ${pos.lng}`;
//         },
//         () => {
//           console.error("Error: The Geolocation service failed.");
//         }
//       );
//     } else {
//       // Browser doesn't support Geolocation
//       console.error("Error: Your browser doesn't support geolocation.");
//     }
  



//LEAFLET maps alternative method
//LEAFLET maps alternative method

// Initialize the map
var map = L.map('map').setView([27.700769, 85.300140], 12); // Default location

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker at the center
var marker = L.marker([27.700769, 85.300140], {
    draggable: true // Make the marker draggable
}).addTo(map);

// Known locations (for fallback when no name is found)
const knownLocations = [
    { name: "Kathmandu", lat: 27.700769, lon: 85.300140 },
    { name: "Bhaktapur", lat: 27.6685, lon: 85.4280 },
    { name: "Lalitpur", lat: 27.6667, lon: 85.3325 }
    // Add more locations here as needed
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
function reverseGeocode(lat, lng) {
    var url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    // Fetch the address details from Nominatim API
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                const address = data.address.road || data.address.suburb || data.address.city || data.address.village || data.address.country;
                
                // If a more detailed address is found, use it
                if (address) {
                    document.getElementById('location').value = address;
                } else {
                    // If no detailed address, use the nearest known location
                    getNearestLocation(lat, lng);
                }
            } else {
                // If no address, fall back to the nearest known location
                getNearestLocation(lat, lng);
            }
        })
        .catch(error => {
            console.error('Error fetching the address:', error);
            document.getElementById('location').value = "Error fetching address";
        });
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
marker.on('dragend', function(event) {
    var latLng = event.target.getLatLng();
    reverseGeocode(latLng.lat, latLng.lng); // Call reverse geocoding
});

// Allow the user to click on the map to select the location
map.on('click', function(event) {
    var latLng = event.latlng; // Get the latitude and longitude from the click
    marker.setLatLng(latLng); // Update the marker position
    reverseGeocode(latLng.lat, latLng.lng); // Call reverse geocoding to get the address
});

// Handle form submission
document.getElementById("complaint-form").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;
    const fileInput = document.getElementById("file");
    const file = fileInput.files[0]; // Get the uploaded file

    // Validate inputs
    if (!category || !description || !location || !file) {
        alert("Please fill in all fields and upload a file.");
        return;
    }

    // Simulate form submission (or send to your server via fetch/axios)
    const formData = new FormData();
    formData.append("category", category);
    formData.append("description", description);
    formData.append("location", location);
    // Append file only if it exists
    if (file) {
        formData.append("file", file);
    }

    fetch("/submit-complaint", {
        method: "POST",
        body: formData
    })
    .then((response) => {
        if (response.redirected) {
            // If redirected, navigate to the new URL
            window.location.href = response.url;
        } else {
            // If not redirected, try to parse response
            return response.json();
        }
    })
    .then((data) => {
        if (data && data.success) {
            alert("Complaint submitted successfully!");
            document.getElementById("complaint-form").reset();
        }
    })
    .catch((err) => {
        console.error("Error submitting complaint:", err);
        alert("An error occurred while submitting the complaint.");
    });
});