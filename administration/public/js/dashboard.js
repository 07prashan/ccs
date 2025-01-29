// Function to fetch dashboard statistics and update UI
async function fetchDashboardStats() {
    try {
        // Fetch the statistics data from the API
        const response = await fetch('/api/dashboard-stats');
        
        // Ensure the response is okay
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        
        // Parse the JSON response
        const stats = await response.json();

        // Update statistics with animation
        animateNumber('total-users', stats.totalUsers || 0);
        animateNumber('total-categories', stats.totalCategories || 0);
        animateNumber('total-complaints', stats.totalComplaints || 0);
        animateNumber('pending-complaints', stats.pendingComplaints || 0);
        animateNumber('in-process-complaints', stats.inProcessComplaints || 0);
        animateNumber('closed-complaints', stats.closedComplaints || 0);

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fallback: Set all values to 0 in case of error
        const elements = [
            'total-users', 
            'total-categories', 
            'total-complaints',
            'pending-complaints',
            'in-process-complaints',
            'closed-complaints'
        ];
        elements.forEach(id => {
            document.getElementById(id).textContent = '0';
        });
    }
}

// Function to animate number counting
function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    if (!element) return; // Guard clause if element not found

    // Convert targetNumber to integer
    targetNumber = parseInt(targetNumber) || 0;
    
    const duration = 1000; // Animation duration in milliseconds
    const steps = 50; // Number of steps in animation
    const stepDuration = duration / steps;
    let currentNumber = 0;
    const increment = targetNumber / steps;

    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= targetNumber) {
            element.textContent = targetNumber;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentNumber);
        }
    }, stepDuration);
}

// Initialize dropdowns when the page loads
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.dropbtn');
        const content = dropdown.querySelector('.dropdown-content');
        
        // For touch devices
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    d.querySelector('.dropdown-content').style.display = 'none';
                }
            });
            const currentDisplay = content.style.display;
            content.style.display = currentDisplay === 'block' ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                content.style.display = 'none';
            }
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();  // Initial fetch
    initializeDropdowns(); // Initialize dropdowns
});

// Refresh statistics every 5 minutes
setInterval(fetchDashboardStats, 300000);