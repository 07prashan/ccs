document.addEventListener("DOMContentLoaded", () => {
    const signupContainer = document.getElementById("signup-container");
    const loginContainer = document.getElementById("login-container");

    const showLoginLink = document.getElementById("show-login");
    const showSignupLink = document.getElementById("show-signup");

    // Show Login Form
    showLoginLink.addEventListener("click", (event) => {
        event.preventDefault();
        signupContainer.style.display = "none";
        loginContainer.style.display = "block";
    });

    // Show Sign-Up Form
    showSignupLink.addEventListener("click", (event) => {
        event.preventDefault();
        loginContainer.style.display = "none";
        signupContainer.style.display = "block";
    });
});
