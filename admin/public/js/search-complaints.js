document.getElementById('search-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form submission
  
    const searchQuery = document.getElementById('search-input').value;
  
    try {
      // Construct the query string
      let query = `/admin/search-complaints?searchQuery=${searchQuery}`;
  
      // Fetch the data
      const response = await fetch(query);
  
      // Check if the response is OK (status code 200)
      if (!response.ok) {
        throw new Error('Failed to fetch complaint data');
      }
  
      // Try to parse JSON response
      const data = await response.json();
  
      // Handle the case when there are no complaints
      const searchResultsSection = document.getElementById('search-results');
      if (data.complaints && data.complaints.length === 0) {
        searchResultsSection.innerHTML = '<p>No complaints found matching your query.</p>';
      } else {
        // Process and display complaints
        let complaintsTable = '<table class="complaints-table"><thead><tr><th>Complaint Number</th><th>Complainant Name</th><th>Category</th><th>Status</th><th>Date Submitted</th></tr></thead><tbody>';
        data.complaints.forEach(complaint => {
          complaintsTable += `<tr>
                                <td>${complaint.complaintNumber}</td>
                                <td>${complaint.complainantName}</td>
                                <td>${complaint.category}</td>
                                <td>${complaint.status}</td>
                                <td>${new Date(complaint.dateSubmitted).toDateString()}</td>
                              </tr>`;
        });
        complaintsTable += '</tbody></table>';
        searchResultsSection.innerHTML = complaintsTable;
      }
    } catch (error) {
      console.error('Error fetching complaint data:', error);
      document.getElementById('search-results').innerHTML = `<p>Error: ${error.message}</p>`;
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const searchForm = document.getElementById("search-form");
  
    // Validate input before submitting
    searchForm.addEventListener("submit", (event) => {
      if (!searchInput.value.trim()) {
        event.preventDefault();
        alert("Please enter a search query.");
      }
    });
  
    // Optional: Add additional client-side functionality if needed
  });
  