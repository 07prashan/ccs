// Default coordinates (Kathmandu)
const defaultLat = 27.7172;
const defaultLng = 85.3240;

// Initialize the map
const map = L.map("map").setView([defaultLat, defaultLng], 13);

// Add OpenStreetMap tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Add a draggable marker
const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

// Known locations (fallback when no name is found)
const knownLocations = [
  { name: "Kathmandu", lat: 27.700769, lon: 85.300140 },
  { name: "Bhaktapur", lat: 27.6685, lon: 85.4280 },
  { name: "Lalitpur", lat: 27.6667, lon: 85.3325 },
];

// Haversine formula to calculate distance (in km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Update location fields
async function updateLocation(lat, lng) {
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lng;
  document.getElementById("mapLink").value = `https://www.google.com/maps?q=${lat},${lng}`;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&extratags=1`
    );
    const data = await res.json();

    // Attempt to extract the most specific name available by checking a list of address properties.
    // These keys are checked in order, so more specific properties come first.
    const placeName =
      data?.address?.name ||
      data?.address?.building ||
      data?.address?.amenity ||
      data?.address?.shop ||
      data?.address?.office ||
      data?.address?.industrial ||
      data?.address?.cafe ||
      data?.address?.restaurant ||
      data?.address?.bank ||
      data?.address?.bar ||
      data?.address?.hotel ||
      data?.address?.parking ||
      data?.address?.bus_stop ||
      data?.address?.train_station ||
      data?.address?.subway ||
      data?.address?.station ||
      data?.address?.market ||
      data?.address?.tourism ||  // could contain values like museum, attraction, gallery, etc.
      data?.address?.temple ||
      data?.address?.mosque ||
      data?.address?.stupa ||
      data?.address?.church ||
      data?.address?.synagogue ||
      data?.address?.shrine ||
      data?.address?.residential ||
      data?.address?.road ||
      data?.address?.neighbourhood ||
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.county ||
      data?.address?.state ||
      data?.address?.region ||
      data?.address?.country ||
      "Unknown location";

    // Update the location field with the determined place name
    document.getElementById("location").value = placeName;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    const nearestLocation = getNearestKnownLocation(lat, lng);
    document.getElementById("location").value = nearestLocation;
  }
}


// Find nearest known location
function getNearestKnownLocation(lat, lng) {
  return knownLocations.reduce((nearest, loc) => {
    const dist = haversine(lat, lng, loc.lat, loc.lon);
    return dist < nearest.distance ? { name: loc.name, distance: dist } : nearest;
  }, { name: "Unknown", distance: Infinity }).name;
}

// Handle marker drag & map click
marker.on("dragend", (e) => updateLocation(e.target.getLatLng().lat, e.target.getLatLng().lng));
map.on("click", (e) => {
  marker.setLatLng(e.latlng);
  updateLocation(e.latlng.lat, e.latlng.lng);
});

// Initialize location
updateLocation(defaultLat, defaultLng);

/* --- Urgency Level Detection --- */
document.addEventListener("DOMContentLoaded", function () {
  const descriptionInput = document.getElementById("description");
  const urgencyIndicator = document.getElementById("urgency-indicator");
  const responseTime = document.getElementById("response-time");
  const fileInput = document.getElementById("file");
  const filePreview = document.getElementById("file-preview");

  // Urgency Keywords
  const urgencyKeywords = {
    critical: ["life-threatening", "catastrophic", "critical failure", "severe disaster", "flood", "fire"],
    high: ["emergency", "danger", "urgent", "immediate", "severe", "unsafe", "electrocution", "explosion"],
    medium: [
      "problem", "issue", "broken", "damaged", "not working", 
      "water", "electricity", "leak", "power outage", "blackout", "flooded"
    ],
    low: ["minor", "small", "slight", "cosmetic"]
  };

  descriptionInput.addEventListener("input", function () {
    const text = descriptionInput.value.toLowerCase();
    let urgencyLevel = "medium"; // Default urgency

    if (urgencyKeywords.critical.some((keyword) => text.includes(keyword))) {
      urgencyLevel = "critical";
    } else if (urgencyKeywords.high.some((keyword) => text.includes(keyword))) {
      urgencyLevel = "high";
    } else if (urgencyKeywords.low.some((keyword) => text.includes(keyword))) {
      urgencyLevel = "low";
    }

    // Update urgency display
    urgencyIndicator.className = `urgency-${urgencyLevel}`;
    urgencyIndicator.textContent = urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1);
    responseTime.textContent = `Expected Response: ${{
      critical: "immediately",
      high: "within an hour",
      medium: "72 hours",
      low: "7 days",
    }[urgencyLevel]}`;
  });

  // File preview handling
  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    filePreview.innerHTML = file.type.startsWith("image/")
      ? `<img src="${URL.createObjectURL(file)}" alt="Preview">`
      : file.type.startsWith("video/")
      ? `<video width="200" controls><source src="${URL.createObjectURL(file)}" type="${file.type}"></video>`
      : "";
  });

  // Validate form before submission
  document.getElementById("complaint-form").addEventListener("submit", function (e) {
    if (!descriptionInput.value.trim()) {
      e.preventDefault();
      alert("Please provide a complaint description.");
    } else if (!document.getElementById("location").value.trim()) {
      e.preventDefault();
      alert("Please select a valid location on the map.");
    }
  });
});

/* --- Handle Complaint Submission --- */
document.getElementById("complaint-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent default submission

  const formData = new FormData(e.target);

  try {
    const response = await fetch("/submit-complaint", { method: "POST", body: formData });
    const result = await response.json();

    // Check if the response contains urgencyLevel
    if (result.success) {
      // Update the urgency level on the page
      document.getElementById("urgencyDisplay").innerText = "Urgency: " + (result.urgencyLevel || "Not set");

      // Show the correct alert with the urgency level
      alert(`Complaint submitted successfully! Urgency Level: ${result.urgencyLevel.toUpperCase()}`);

      // Redirect on success
      window.location.href = "/post-complaint"; 
    } else {
      alert("An error occurred while submitting the complaint.");
    }
  } catch (error) {
    alert("An error occurred while submitting the complaint.");
    console.error("Error:", error);
  }
});
