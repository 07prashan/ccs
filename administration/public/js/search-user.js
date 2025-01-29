// search-user.js
document.getElementById('search-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission
  
    const searchQuery = document.getElementById('search-input').value;
  
    try {
      // Fetch data with the search query
      const response = await fetch(`/administration/search-user?searchQuery=${encodeURIComponent(searchQuery)}`);
  
      // Check if the response is successful
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
  
      // Parse the HTML response and replace the content
      const html = await response.text();
      document.getElementById('search-results').innerHTML = html;
    } catch (error) {
      console.error('Error fetching search data:', error);
      document.getElementById('search-results').innerHTML = `<p>Error: ${error.message}</p>`;
    }
  });
  