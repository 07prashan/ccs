document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('change-password-form');
    const messageContainer = document.getElementById('message-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        messageContainer.innerHTML = '';

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Basic client-side validation
        if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match', false);
            return;
        }

        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters long', false);
            return;
        }

        try {
            const response = await fetch('/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage(data.message, true);
                // Clear form fields
                form.reset();
            } else {
                showMessage(data.message, false);
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', false);
        }
    });

    function showMessage(message, isSuccess) {
        messageContainer.innerHTML = message;
        messageContainer.className = isSuccess ? 'success-message' : 'error-message';
    }
});
//toggle passwords

document.addEventListener("DOMContentLoaded", function () {
    const togglePasswordIcons = document.querySelectorAll(".toggle-password");

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener("click", function () {
            const inputId = this.getAttribute("data-input");
            const input = document.getElementById(inputId);

            if (input.type === "password") {
                input.type = "text";
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            }
        });
    });
});
