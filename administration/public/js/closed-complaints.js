let currentComplaintId = null;

// Function to open the modal and populate complaint ID
function openManageModal(complaintId) {
    currentComplaintId = complaintId;
    document.getElementById('complaintId').value = complaintId;
    document.getElementById('manageModal').classList.remove('hidden');
}

// Function to close the modal
function closeManageModal() {
    document.getElementById('manageModal').classList.add('hidden');
}

// Function to delete a complaint
function deleteComplaint() {
    if (currentComplaintId) {
        fetch(`/administration/delete-complaint/${currentComplaintId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('Complaint deleted successfully');
            location.reload();  // Reload the page to reflect changes
        })
        .catch(error => {
            console.error("Error deleting complaint:", error);
            alert('Failed to delete complaint');
        });
    }
}

// Handle form submission to update status
document.getElementById('manageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const status = document.getElementById('status').value;
    if (currentComplaintId) {
        fetch(`/administration/update-complaint-status/${currentComplaintId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
        .then(response => response.json())
        .then(data => {
            alert('Complaint status updated');
            location.reload();  // Reload the page to reflect changes
        })
        .catch(error => {
            console.error("Error updating complaint status:", error);
            alert('Failed to update status');
        });
    }
});
