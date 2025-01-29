function openManageModal(complaintId) {
    // Show modal
    document.getElementById('manageModal').classList.remove('hidden');

    // Set the complaint ID to the form's hidden input
    document.getElementById('complaintId').value = complaintId;
}

function closeManageModal() {
    // Hide modal
    document.getElementById('manageModal').classList.add('hidden');
}

// Handle the form submission to update status
document.getElementById('manageForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission
    
    const complaintId = document.getElementById('complaintId').value;
    const status = document.getElementById('status').value;

    // Make a POST request to update the complaint status
    fetch(`/admin/update-complaint-status/${complaintId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    })
    .then(response => response.json())
    .then(data => {
        // Update UI by removing the complaint row
        document.getElementById(`complaint-${complaintId}`).remove();
        closeManageModal();
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Handle the form submission to delete complaint
document.getElementById('deleteForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const complaintId = document.getElementById('complaintId').value;

    // Make a DELETE request to delete the complaint
    fetch(`/admin/delete-complaint/${complaintId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        // Remove the complaint row from the table
        document.getElementById(`complaint-${complaintId}`).remove();
        closeManageModal();
    })
    .catch(error => {
        console.error('Error:', error);
    });
});