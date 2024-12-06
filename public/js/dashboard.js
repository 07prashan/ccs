document.addEventListener("DOMContentLoaded", () => {
    fetch('/api/dashboard-stats')
        .then((response) => response.json())
        .then((data) => {
            document.getElementById('total-complaints').textContent = data.total;
            document.getElementById('pending-complaints').textContent = data.pending;
            document.getElementById('in-process-complaints').textContent = data.inProcess;
            document.getElementById('closed-complaints').textContent = data.closed;
        })
        .catch((error) => {
            console.error("Error fetching dashboard stats:", error);
        });
});
