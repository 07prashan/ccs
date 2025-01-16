document.addEventListener("DOMContentLoaded", () => {
    // Fetch and display all categories on page load
    fetchCategories();

    // Handle form submission for adding a new category
    const categoryForm = document.getElementById("categoryForm");
    categoryForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();

        if (!name || !description) {
            alert("Both fields are required!");
            return;
        }

        try {
            const response = await fetch("/admin/add-category", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, description }),
            });

            const result = await response.json();

            if (result.success) {
                alert("Category added successfully!");
                fetchCategories(); // Refresh the category list
                categoryForm.reset();
            } else {
                alert(result.message || "Failed to add category.");
            }
        } catch (error) {
            console.error("Error adding category:", error);
            alert("An error occurred while adding the category.");
        }
    });

    // Handle edit and delete actions
    document.addEventListener("click", async (event) => {
        const target = event.target;

        // Edit category functionality
        if (target.classList.contains("edit-btn")) {
            const id = target.dataset.id;
            const newName = prompt("Enter new category name:");
            const newDescription = prompt("Enter new description:");

            if (!newName || !newDescription) {
                alert("Both fields are required!");
                return;
            }

            try {
                const response = await fetch(`/admin/edit-category/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, description: newDescription }),
                });

                const result = await response.json();
                if (result.success) {
                    alert("Category updated successfully!");
                    fetchCategories(); // Refresh the category list
                } else {
                    alert("Failed to update category.");
                }
            } catch (error) {
                console.error("Error editing category:", error);
            }
        }

        // Delete category functionality
        if (target.classList.contains("delete-btn")) {
            const id = target.dataset.id;

            if (confirm("Are you sure you want to delete this category?")) {
                try {
                    const response = await fetch(`/admin/delete-category/${id}`, { method: "DELETE" });
                    const result = await response.json();

                    if (result.success) {
                        alert("Category deleted successfully!");
                        fetchCategories(); // Refresh the category list
                    } else {
                        alert("Failed to delete category.");
                    }
                } catch (error) {
                    console.error("Error deleting category:", error);
                }
            }
        }
    });
});

// Function to fetch and display all categories
async function fetchCategories() {
    try {
        const response = await fetch("/admin/get-categories");
        const data = await response.json();

        if (data.success) {
            const categoryList = document.getElementById("category-list");
            categoryList.innerHTML = ""; // Clear existing content

            // Populate categories dynamically
            data.categories.forEach((category) => {
                const categoryItem = document.createElement("div");
                categoryItem.className = "category-item";
                categoryItem.innerHTML = `
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                    <button class="edit-btn" data-id="${category._id}">Edit</button>
                    <button class="delete-btn" data-id="${category._id}">Delete</button>
                `;
                categoryList.appendChild(categoryItem);
            });
        } else {
            alert("Failed to load categories.");
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}
