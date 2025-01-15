document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailField = document.getElementById("email");
  const passwordField = document.getElementById("password");
  const roleField = document.getElementById("role");

  form.addEventListener("submit", (e) => {
    // Get trimmed values
    const email = emailField.value.trim();
    const password = passwordField.value.trim();
    const role = roleField.value;

    let isValid = true; // Flag to track overall form validity

    // Clear previous error messages
    document.querySelectorAll(".error-message").forEach((el) => el.remove());
    [emailField, passwordField, roleField].forEach((field) =>
      field.classList.remove("invalid")
    );

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showError(emailField, "Email is required.");
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showError(emailField, "Please enter a valid email address.");
      isValid = false;
    }

    // Password Validation
    if (!password) {
      showError(passwordField, "Password is required.");
      isValid = false;
    }

    // Role Validation
    if (!role) {
      showError(roleField, "Please select your role.");
      isValid = false;
    }

    // Prevent submission if the form is invalid
    if (!isValid) {
      e.preventDefault();
    }
  });

  /**
   * Function to display error message and highlight the field
   * @param {HTMLElement} field - The input field to highlight
   * @param {string} message - The error message to display
   */
  function showError(field, message) {
    field.classList.add("invalid");
    const error = document.createElement("span");
    error.classList.add("error-message");
    error.style.color = "red";
    error.style.fontSize = "0.9em";
    error.textContent = message;
    field.parentNode.appendChild(error);
  }
});
