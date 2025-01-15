
// document.querySelectorAll(".dropdown").forEach(dropdown => {
//     const button = dropdown.querySelector(".dropbtn");
//     const content = dropdown.querySelector(".dropdown-content");

//     button.addEventListener("click", () => {
//         content.style.display = content.style.display === "block" ? "none" : "block";
//     });

//     document.addEventListener("click", (event) => {
//         if (!dropdown.contains(event.target)) {
//             content.style.display = "none";
//         }
//     });
// });


// Fetch Dashboard Statistics and Update the UI
async function fetchDashboardStats() {
    try {
        // Fetch the statistics data from the API
        const response = await fetch('/api/dashboard-stats');
        
        // Ensure the response is okay
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        
        // Parse the JSON response
        const stats = await response.json();

        // Update the UI with the fetched stats
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('total-categories').textContent = stats.totalCategories || 0;
        document.getElementById('total-complaints').textContent = stats.totalComplaints || 0;
        document.getElementById('pending-complaints').textContent = stats.pendingComplaints || 0;
        document.getElementById('in-process-complaints').textContent = stats.inProcessComplaints || 0;
        document.getElementById('closed-complaints').textContent = stats.closedComplaints || 0;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Optionally, display an error message to the user
    }
}

// Call the function to fetch and update stats on page load
document.addEventListener('DOMContentLoaded', fetchDashboardStats);
