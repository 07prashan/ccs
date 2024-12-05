// Initialize Google Maps
function initMap() {
    const mapOptions = {
      center: { lat: -34.397, lng: 150.644 }, // Default coordinates
      zoom: 8,
    };
  
    // Create the map
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  
    // Create a draggable marker
    const marker = new google.maps.Marker({
      position: map.getCenter(),
      map: map,
      draggable: true,
    });
  
    // Update location input field when marker is dragged
    google.maps.event.addListener(marker, "dragend", function (event) {
      const latLng = event.latLng;
      document.getElementById("location").value = `${latLng.lat()}, ${latLng.lng()}`;
    });
  
    // Try HTML5 geolocation to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
  
          // Center map to user's location
          map.setCenter(pos);
          marker.setPosition(pos);
  
          // Update location input with user's coordinates
          document.getElementById("location").value = `${pos.lat}, ${pos.lng}`;
        },
        () => {
          console.error("Error: The Geolocation service failed.");
        }
      );
    } else {
      // Browser doesn't support Geolocation
      console.error("Error: Your browser doesn't support geolocation.");
    }
  }
  
  // Handle form submission
  document.getElementById("complaint-form").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission behavior
  
    const category = document.getElementById("category").value;
    const description = document.getElementById("complaint-description").value;
    const location = document.getElementById("location").value;
    const fileInput = document.getElementById("file-upload");
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
    formData.append("file", file);
  
    fetch("/submit-complaint", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Complaint submitted successfully!");
          document.getElementById("complaint-form").reset();
        } else {
          alert("Failed to submit complaint. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Error submitting complaint:", err);
        alert("An error occurred while submitting the complaint.");
      });
  });
  