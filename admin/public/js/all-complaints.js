document.addEventListener('DOMContentLoaded', function() {
    const manageButtons = document.querySelectorAll('.manage-btn');
    const modal = document.getElementById('manage-modal');
    const complaintIdInput = document.getElementById('complaintId');
    const deleteComplaintIdInput = document.getElementById('deleteComplaintId');
    const closeModalBtn = document.querySelector('.close-modal');

    // Open modal on button click
    manageButtons.forEach(button => {
        button.addEventListener('click', () => {
            const complaintId = button.getAttribute('data-id');
            const status = button.getAttribute('data-status'); // Get the current status

            complaintIdInput.value = complaintId; // Set the complaint ID
            deleteComplaintIdInput.value = complaintId; // Set the complaint ID for deletion
            
            // Set the status in the modal
            document.getElementById('status').value = status;

            modal.classList.remove('hidden');
        });
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Handle status update form submission
    const statusForm = document.getElementById('manage-form');
    statusForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const complaintId = complaintIdInput.value;
        const status = document.getElementById('status').value;

        try {
            const response = await fetch(`/admin/update-complaint-status/${complaintId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                alert('Complaint status updated successfully!');
                window.location.reload(); // Reload the page
            } else {
                alert('Failed to update complaint status.');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('An error occurred. Please try again.');
        }
    });

    // Handle delete form submission
    const deleteForm = document.getElementById('delete-form');
    deleteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const complaintId = deleteComplaintIdInput.value;

        try {
            const response = await fetch(`/admin/delete-complaint/${complaintId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Complaint deleted successfully!');
                window.location.reload(); // Reload the page
            } else {
                alert('Failed to delete complaint.');
            }
        } catch (error) {
            console.error('Error deleting complaint:', error);
            alert('An error occurred. Please try again.');
        }
    });
});
