window.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch("/api/dashboard-stats");
      const data = await response.json();
  
      console.log("API Response:", data); // Log the response
  
      if (data.total !== undefined) {
        document.getElementById("total-complaints").innerText = data.total;
        document.getElementById("pending-complaints").innerText = data.pending;
        document.getElementById("in-process-complaints").innerText = data.inProcess;
        document.getElementById("closed-complaints").innerText = data.closed;
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  });
  