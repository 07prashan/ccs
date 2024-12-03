<?php
// Database connection
$conn = new mysqli("localhost", "root", "", "complaint_system");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $description = $_POST['complaint-description'];
    $location = $_POST['location'];
    $status = "Unsolved"; // Default status

    // Handle file upload
    $targetDir = "uploads/";
    $fileName = basename($_FILES["file-upload"]["name"]);
    $targetFilePath = $targetDir . $fileName;

    if (move_uploaded_file($_FILES["file-upload"]["tmp_name"], $targetFilePath)) {
        // Save complaint to database
        $stmt = $conn->prepare("INSERT INTO complaints (description, image_url, location, status) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $description, $targetFilePath, $location, $status);

        if ($stmt->execute()) {
            echo "Complaint posted successfully!";
        } else {
            echo "Error: " . $stmt->error;
        }
        $stmt->close();
    } else {
        echo "Failed to upload file.";
    }
}
$conn->close();
?>
