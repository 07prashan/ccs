document.addEventListener('DOMContentLoaded', () => {
    console.log("Complaint History Page Loaded");

    // Add any interactivity or future dynamic features
    const complaintRows = document.querySelectorAll('table tbody tr');

    complaintRows.forEach(row => {
        row.addEventListener('click', () => {
            const complaintNumber = row.querySelector('td:nth-child(2)').textContent;
            // alert(`Complaint ${complaintNumber} clicked!`);
        });
    });
});

// Wait for the document to fully load
document.addEventListener("DOMContentLoaded", function() {
    // Get all 'View Details' buttons
    const viewDetailsButtons = document.querySelectorAll(".view-details-btn");
  
    // Add click event listener to each button
    viewDetailsButtons.forEach((button) => {
      button.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent form submission or link navigation
        
        // Get the complaint ID from the button's data attribute
        const complaintId = button.getAttribute("data-complaint-id");
  
        // Find the corresponding complaint details row
        const complaintDetailsRow = document.getElementById(`details-${complaintId}`);
  
        // Toggle the display of the complaint details
      if (complaintDetailsRow) {
        const isHidden = complaintDetailsRow.style.display === "none" || !complaintDetailsRow.style.display;
        complaintDetailsRow.style.display = isHidden ? "table-row" : "none"; // Toggle visibility
      }
    });
  });
});
  