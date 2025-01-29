document.getElementById('date-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const fromDate = document.getElementById('from-date').value;
    const toDate = document.getElementById('to-date').value;

    // Construct the query string
    let query = `/administration/user-reports?fromDate=${fromDate}&toDate=${toDate}`;

    // Perform the fetch request
    fetch(query)
        .then(response => {
            // Check if the response is OK (status code 200)
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            // Return the response as text (HTML)
            return response.text();
        })
        .then(html => {
            // Display the result in the report-results section
            document.getElementById('report-results').innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            // Display error message in the report-results section
            document.getElementById('report-results').innerHTML = `<p>Error: ${error.message}</p>`;
        });
});
