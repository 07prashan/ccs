document.querySelectorAll(".dropdown").forEach(dropdown => {
    const button = dropdown.querySelector(".dropbtn");
    const content = dropdown.querySelector(".dropdown-content");

    button.addEventListener("click", () => {
        content.style.display = content.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) {
            content.style.display = "none";
        }
    });
});

// document.addEventListener('DOMContentLoaded', function () {
//     const dropdowns = document.querySelectorAll('.dropdown');

//     dropdowns.forEach(function (dropdown) {
//         const button = dropdown.querySelector('.dropbtn');
//         button.addEventListener('click', function () {
//             const content = dropdown.querySelector('.dropdown-content');
//             content.style.display = content.style.display === 'block' ? 'none' : 'block';
//         });
//     });

//     // Close the dropdown if clicked outside
//     document.addEventListener('click', function (event) {
//         if (!event.target.closest('.dropdown')) {
//             document.querySelectorAll('.dropdown-content').forEach(function (dropdownContent) {
//                 dropdownContent.style.display = 'none';
//             });
//         }
//     });
// });
