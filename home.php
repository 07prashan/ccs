<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    // Redirect to login page if user is not logged in
    header("Location: index.html");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home - Capital Complaint System</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1 class="main-title">Capital Complaint System</h1>
    </header>

    <main>
        <h2>Welcome to the Capital Complaint System</h2>
        <p>Your role: <?php echo htmlspecialchars($_SESSION['role']); ?></p>
        <a href="logout.php" class="logout-btn">Logout</a>
    </main>

    <footer>
        <p>&copy; 2024 Capital Complaint System. All Rights Reserved.</p>
    </footer>
</body>
</html>
