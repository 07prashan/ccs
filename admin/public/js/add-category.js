document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('add-category-form');

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const categoryName = document.getElementById('category-name').value;
        const categoryDescription = document.getElementById('category-description').value;

        const response = await fetch('/admin/add-category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: categoryName,
                description: categoryDescription,
            }),
        });

        const data = await response.json();
        if (data.success) {
            alert('Category added successfully!');
            // Optionally, refresh the category list or add the category to the list dynamically
            const categoryList = document.getElementById('category-list');
            const newCategory = document.createElement('li');
            newCategory.textContent = categoryName;
            categoryList.appendChild(newCategory);
        } else {
            alert('Error adding category!');
        }
    });
});
