<?php
$conn = new mysqli("localhost", "root", "", "complaint_system");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];
    $role = $_POST['role'];

    $stmt = $conn->prepare("SELECT id, password FROM users WHERE email = ? AND role = ?");
    $stmt->bind_param("ss", $email, $role);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($user_id, $hashed_password);
        $stmt->fetch();

        if (password_verify($password, $hashed_password)) {
            // Start a session for the logged-in user
            session_start();
            $_SESSION['user_id'] = $user_id;
            $_SESSION['role'] = $role;

            // Redirect to home page after successful login
            header("Location: home.php");
            exit();
        } else {
            echo "Incorrect password.";
        }
    } else {
        echo "No account found for this email and role.";
    }

    $stmt->close();
}
$conn->close();
?>
