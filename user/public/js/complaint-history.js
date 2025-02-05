document.addEventListener("DOMContentLoaded", function () {
    // Modal elements
    const viewModal = document.getElementById("viewDetailsModal");
    const editModal = document.getElementById("editModal");
    const deleteModal = document.getElementById("deleteModal");
  
    // Close modal function
    function closeModal(modal) {
      modal.style.display = "none";
    }
  
    document.querySelectorAll(".close").forEach(button => {
      button.addEventListener("click", function () {
        closeModal(viewModal);
        closeModal(editModal);
        closeModal(deleteModal);
      });
    });
  
    // View Details
    document.querySelectorAll(".view-details-btn").forEach(button => {
      button.addEventListener("click", function () {
        const row = this.closest("tr"); // Find the closest row
        document.getElementById("detail-complaintNumber").textContent = row.cells[0].textContent;
        document.getElementById("detail-complainant").textContent = row.cells[1].textContent;
        document.getElementById("detail-category").textContent = row.getAttribute("data-category") || "N/A";
        document.getElementById("detail-description").textContent = row.getAttribute("data-description") || "N/A";
        document.getElementById("detail-location").textContent = row.getAttribute("data-location") || "N/A";
        document.getElementById("detail-date").textContent = row.cells[2].textContent;
        document.getElementById("detail-status").textContent = row.getAttribute("data-status") || "N/A";
        document.getElementById("detail-file").innerHTML = row.getAttribute("data-file") !== "No file attached" 
            ? `<a href="/uploads/${row.getAttribute("data-file")}" target="_blank">See Image/Video</a>` 
            : "No file attached";
        viewModal.style.display = "block"; // Show modal
      });
    });
  
    // Edit Complaint Handling
    document.querySelectorAll(".edit-btn").forEach(button => {
      button.addEventListener("click", async function () {
        const complaintId = this.getAttribute("data-id");
        // Ensure complaintId is defined (if not, then the complaint ID attribute is missing)
        if (!complaintId) {
          alert("Complaint ID is missing!");
          return;
        }
        const category = this.getAttribute("data-category");
        const description = this.getAttribute("data-description");
        const locationVal = this.getAttribute("data-location");
        const file = this.getAttribute("data-file");
        const latitude = this.getAttribute("data-lat");
        const longitude = this.getAttribute("data-lng");
  
        // Handle file preview if file exists
        const filePreview = document.getElementById("edit-file-preview");
        if (file && file !== "null") {
          filePreview.innerHTML = `<a href="/uploads/${file}" target="_blank">View Previous File</a>`;
        } else {
          filePreview.innerHTML = "No file attached";
        }
  
        // Update the edit map with the given coordinates
        updateEditMap(latitude, longitude);
  
        // Show modal
        editModal.style.display = "block";
        console.log("Fetching complaint with ID:", complaintId);
  
        try {
          const response = await fetch(`/complaint/${complaintId}`);
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
          }
          const complaint = await response.json();
          console.log("Complaint data:", complaint);
          
          // Populate form
          document.getElementById("edit-complaint-id").value = complaint._id;
          document.getElementById("edit-category").value = complaint.category;
          document.getElementById("edit-description").value = complaint.description;
          document.getElementById("edit-location").value = complaint.location;
          document.getElementById("edit-latitude").value = complaint.latitude;
          document.getElementById("edit-longitude").value = complaint.longitude;
  
          if (complaint.file) {
            document.getElementById("edit-file-preview").innerHTML = `<a href="/uploads/${complaint.file}" target="_blank">View Uploaded File</a>`;
          } else {
            document.getElementById("edit-file-preview").innerHTML = "No file attached";
          }
  
          // Update edit map to complaint coordinates
          updateEditMap(complaint.latitude, complaint.longitude);
        } catch (error) {
          console.error("Failed to fetch complaint:", error);
          alert("Failed to load complaint details: " + error.message);
        }
      });
    });
  
    // Edit Form Submission Handling
    document.getElementById("editComplaintForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      const complaintId = document.getElementById("edit-complaint-id").value;
  
      const formData = new FormData();
      formData.append("category", document.getElementById("edit-category").value);
      formData.append("description", document.getElementById("edit-description").value);
      formData.append("location", document.getElementById("edit-location").value);
      formData.append("latitude", document.getElementById("edit-latitude").value);
      formData.append("longitude", document.getElementById("edit-longitude").value);
      const fileInput = document.getElementById("edit-file").files[0];
      if (fileInput) formData.append("file", fileInput);
  
      try {
        const response = await fetch(`/complaint/${complaintId}`, {
          method: "PUT",
          body: formData,
        });
  
        if (response.ok) {
          alert("Complaint updated successfully!");
          location.reload();
        } else {
          alert("Failed to update complaint.");
        }
      } catch (error) {
        console.error("Error updating complaint:", error);
        alert("An error occurred.");
      }
    });
  
    // Delete Complaint Handling
    let deleteComplaintId = null;
    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", function () {
        deleteComplaintId = this.getAttribute("data-complaint-id");
        deleteModal.style.display = "block";
      });
    });
  
    document.getElementById("confirmDelete").addEventListener("click", async function () {
      const response = await fetch(`/complaint/${deleteComplaintId}`, { method: "DELETE" });
      if (response.ok) {
        alert("Complaint deleted!");
        location.reload();
      } else {
        alert("Failed to delete complaint.");
      }
    });
  });
  
  // ----- Leaflet Map for Editing Complaint -----
  let editMap, editMarker;
  function initEditMap() {
    // Set initial view to default coordinates (Kathmandu)
    const defaultLat = 27.7172;
    const defaultLng = 85.3240;
    editMap = L.map("edit-map").setView([defaultLat, defaultLng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(editMap);
  
    // Add a draggable marker
    editMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(editMap);
  
    // When the marker is dragged, update the coordinates and location field
    editMarker.on("dragend", function (event) {
      const latLng = editMarker.getLatLng();
      document.getElementById("edit-latitude").value = latLng.lat;
      document.getElementById("edit-longitude").value = latLng.lng;
      updateEditLocation(latLng.lat, latLng.lng);
    });
  
    // Also update location on map click
    editMap.on("click", function (e) {
      editMarker.setLatLng(e.latlng);
      document.getElementById("edit-latitude").value = e.latlng.lat;
      document.getElementById("edit-longitude").value = e.latlng.lng;
      updateEditLocation(e.latlng.lat, e.latlng.lng);
    });
  }
  
  function updateEditMap(lat, lng) {
    if (!lat || !lng) return;
    const latLng = [parseFloat(lat), parseFloat(lng)];
    editMarker.setLatLng(latLng);
    editMap.setView(latLng, 14);
    updateEditLocation(lat, lng);
  }
  
  async function updateEditLocation(lat, lng) {
    document.getElementById("edit-latitude").value = lat;
    document.getElementById("edit-longitude").value = lng;
  
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&extratags=1`
      );
      const data = await res.json();
  
      const address =
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
        data?.address?.tourism ||
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
  
      document.getElementById("edit-location").value = address;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      document.getElementById("edit-location").value = "Unknown location";
    }
  }
  
  initEditMap();
  