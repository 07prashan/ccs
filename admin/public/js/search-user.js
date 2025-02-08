document.getElementById('search-form').addEventListener('submit', async function(event) {
  event.preventDefault(); // Prevent the default form submission

  const searchQuery = document.getElementById('search-input').value;

  try {
    // Fetch data with the search query
    const response = await fetch(`/admin/search-user?searchQuery=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json' // Expecting JSON response
      }
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    // Parse the JSON response and update the results section
    const data = await response.json();
    const resultsSection = document.getElementById('search-results');

    if (data.users && data.users.length > 0) {
      const tableHtml = `
        <table class="user-reports-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.users.map(user => `
              <tr>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.contact_no}</td>
                <td>${user.role}</td>
                <td>${new Date(user.regDate).toDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      resultsSection.innerHTML = tableHtml;
    } else {
      resultsSection.innerHTML = '<p>No users found matching your query.</p>';
    }
  } catch (error) {
    console.error('Error fetching search data:', error);
    document.getElementById('search-results').innerHTML = `<p>Error: ${error.message}</p>`;
  }
});
