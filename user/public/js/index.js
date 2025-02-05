// Dummy complaints feed
const complaintsFeed = [
    {
        description: "Pothole on Main Street.",
        media: "https://via.placeholder.com/150",
        location: "Main Street",
    },
    {
        description: "Streetlight not working in Elm Grove.",
        media: "https://via.placeholder.com/150",
        location: "Elm Grove",
    },
];

document.addEventListener("DOMContentLoaded", () => {
    const complaintsContainer = document.getElementById("complaints-feed");
    if (complaintsContainer) {
        // Load complaints dynamically
        complaintsFeed.forEach((complaint) => {
            const complaintDiv = document.createElement("div");
            complaintDiv.classList.add("complaint");

            complaintDiv.innerHTML = `
                <h3>${complaint.description}</h3>
                <img src="${complaint.media}" alt="Complaint Media" />
                <p><strong>Location:</strong> ${complaint.location}</p>
            `;

            complaintsContainer.appendChild(complaintDiv);
        });
    }

    // Handle complaint submission
    const complaintForm = document.getElementById("complaint-form");
    if (complaintForm) {
        complaintForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Complaint submitted successfully!");
        });
    }
});




document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/complaints/recent')
        .then(response => response.json())
        .then(data => {
            const complaintsContainer = document.getElementById('complaints-container');
            complaintsContainer.innerHTML = '';

            if (data.length === 0) {
                complaintsContainer.innerHTML = '<p>No complaints yet.</p>';
                return;
            }

            data.forEach(complaint => {
                const complaintCard = document.createElement('div');
                complaintCard.className = 'complaint-card';

                complaintCard.innerHTML = `
                    <h3 class="complaint-name">${complaint.complaintNumber}: ${complaint.description}</h3>
                    <p class="complaint-details">${complaint.location} | ${new Date(complaint.regDate).toLocaleDateString()}</p>
                    ${complaint.file ? `<img src="${complaint.file}" alt="${complaint.description}" class="complaint-file"/>` : ''}
                    ${complaint.video ? `<video controls class="complaint-file"><source src="${complaint.video}" type="video/mp4"></video>` : ''}
                    <p class="complaint-status">${complaint.status}</p>
                `;
                
                complaintsContainer.appendChild(complaintCard);
            });
        })
        .catch(error => console.error('Error fetching complaints:', error));
});












document.addEventListener("DOMContentLoaded", () => {
    const complaintsContainer = document.getElementById("complaints-container");

    // Fetch complaints from the server
    fetch("fetch_complaints.php")
        .then(response => response.json())
        .then(data => {
            data.forEach(complaint => {
                const complaintCard = document.createElement("div");
                complaintCard.className = "complaint-card";

                complaintCard.innerHTML = `
                    <img src="${complaint.image_url}" alt="Complaint Image">
                    <div class="card-content">
                        <p class="description">${complaint.description}</p>
                        <p class="location">Location: ${complaint.location}</p>
                        <p class="status ${complaint.status.toLowerCase()}">${complaint.status}</p>
                    </div>
                `;
                complaintsContainer.appendChild(complaintCard);
            });
        })
        .catch(err => {
            console.error("Error fetching complaints:", err);
        });
});
