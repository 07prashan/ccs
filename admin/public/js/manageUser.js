document.addEventListener("DOMContentLoaded", () => {
    const deleteButtons = document.querySelectorAll(".delete-user");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const userId = button.getAttribute("data-id");
            if (confirm("Are you sure you want to delete this user?")) {
                fetch(`/admin/delete-user/${userId}`, {
                    method: "DELETE",
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.success) {
                            alert("User deleted successfully");
                            location.reload();
                        } else {
                            alert("Failed to delete user");
                        }
                    });
            }
        });
    });
});
document.addEventListener("DOMContentLoaded", function () {
    // Open View Details
    document.querySelectorAll(".view-details").forEach((button) => {
      button.addEventListener("click", function () {
        const userId = this.dataset.id;
        const detailsRow = document.getElementById(`details-row-${userId}`);
  
        if (detailsRow.style.display === "none") {
          // Fetch user details
          fetch(`/admin/user-details/${userId}`)
            .then((response) => response.json())
            .then((data) => {
              document.getElementById(`first_name_${userId}`).textContent = data.first_name;
              document.getElementById(`last_name_${userId}`).textContent = data.last_name;
              document.getElementById(`contact_no_${userId}`).textContent = data.contact_no;
              document.getElementById(`email_${userId}`).textContent = data.email;
              document.getElementById(`role_${userId}`).value = data.role;
              document.getElementById(`reg_date_${userId}`).textContent = new Date(data.regDate).toLocaleDateString(); // Display registration date
            });
  
          detailsRow.style.display = "table-row"; // Show the details
        } else {
          detailsRow.style.display = "none"; // Hide the details
        }
      });
    });
  });
  

    // Update User Role
    document.querySelectorAll('.update-role').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.id;
            const newRole = document.getElementById(`role_${userId}`).value;

            // Send updated role to server
            fetch(`/admin/update-role/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Role updated successfully');
                } else {
                    alert('Failed to update role');
                }
            });
        });
    });

    // Open Complaints
    document.querySelectorAll('.complaints').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.id;
            const complaintsRow = document.getElementById(`complaints-row-${userId}`);

            // Toggle the complaints row visibility
            if (complaintsRow.style.display === "none") {
                fetch(`/admin/user-complaints/${userId}`)
                    .then(response => response.json())
                    .then(data => {
                        let complaintsHtml = '<h5>Complaints:</h5><ul>';
                        data.complaints.forEach(complaint => {
                            complaintsHtml += `
                                <li>
                                    <strong>Complaint Number:</strong> ${complaint.complaintNumber}<br>
                                    <strong>Category:</strong> ${complaint.category}<br>
                                    <strong>Description:</strong> ${complaint.description}<br>
                                    <strong>Location:</strong> ${complaint.location}<br>
                                    <strong>File:</strong> <a href="/uploads/${complaint.file}" target="_blank">View File</a><br>
                                    <strong>Registered On:</strong> ${complaint.regDate}
                                </li>
                            `;
                        });
                        complaintsHtml += '</ul>';
                        document.getElementById(`complaints-content-${userId}`).innerHTML = complaintsHtml;
                    });

                complaintsRow.style.display = "table-row"; // Show the complaints
            } else {
                complaintsRow.style.display = "none"; // Hide the complaints
            }
        });
    });

