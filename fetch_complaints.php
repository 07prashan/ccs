<?php
// Database connection
$conn = new mysqli("localhost", "root", "", "complaint_system");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch complaints
$sql = "SELECT description, image_url, location, status FROM complaints ORDER BY created_at DESC";
$result = $conn->query($sql);

$complaints = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }
}

// Return complaints as JSON
header('Content-Type: application/json');
echo json_encode($complaints);

$conn->close();
?>
