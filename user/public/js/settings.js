document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("password-form");
    const currentPasswordField = document.getElementById("current-password");
    const newPasswordField = document.getElementById("new-password");
    const confirmPasswordField = document.getElementById("confirm-password");
  
    const currentPasswordError = document.createElement("div");
    const newPasswordError = document.createElement("div");
  
    currentPasswordError.className = "error-message";
    newPasswordError.className = "error-message";
  
    currentPasswordField.insertAdjacentElement("afterend", currentPasswordError);
    confirmPasswordField.insertAdjacentElement("afterend", newPasswordError);
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      // Clear previous error messages
      currentPasswordError.textContent = "";
      newPasswordError.textContent = "";
  
      const currentPassword = currentPasswordField.value;
      const newPassword = newPasswordField.value;
      const confirmPassword = confirmPasswordField.value;
  
      try {
        const response = await fetch("/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        });
  
        const data = await response.json();
  
        if (data.success) {
          alert(data.message); // You can replace this with a success message in the UI
          form.reset();
        } else {
          if (data.message.includes("Current password")) {
            currentPasswordError.textContent = data.message;
          } else if (data.message.includes("New password")) {
            newPasswordError.textContent = data.message;
          } else {
            alert(data.message);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      }
    });
  
    // Toggle password visibility
    document.querySelectorAll(".toggle-password").forEach((icon) => {
      icon.addEventListener("click", () => {
        const inputId = icon.getAttribute("data-input");
        const input = document.getElementById(inputId);
  
        if (input.type === "password") {
          input.type = "text";
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
        } else {
          input.type = "password";
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
        }
      });
    });
  });
  