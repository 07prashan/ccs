const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const { body, validationResult } = require("express-validator"); // Importing express-validator

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "user", "views")); // Updated views directory
app.set("views", path.join(__dirname, "admin", "views"));
app.use(express.static(path.join(__dirname, "user", "public"))); // Updated static files directory

// Session Middleware
app.use(
  session({
    secret: "your_secret_key", // Secret for session encryption (use an env variable in production)
    resave: false, // Avoid resaving unchanged sessions
    saveUninitialized: true, // Save uninitialized sessions
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// MongoDB Connection
const mongoURI =
  "mongodb+srv://prashant:204060bde@cluster0.veh0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema and Models

// User schema to store user information
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  contact_no: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["user", "admin", "administrative"] },
});

const User = mongoose.model("User", userSchema); // Compile the user model

// Complaint schema to handle user complaints
const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
  complaintNumber: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  file: { type: String },
  regDate: { type: Date, default: Date.now },
  status: { type: String, default: null },
});

const Complaint = mongoose.model("Complaint", complaintSchema); // Compile the complaint model

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage }); // File upload configuration

// Routes

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Signup route to register new users
app.post(
  "/signup",
  body("email").isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, contact_no, email, password, role } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
      const newUser = new User({
        first_name,
        last_name,
        contact_no,
        email,
        password: hashedPassword,
        role,
      });

      await newUser.save();
      res.redirect("/home");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error signing up. Email may already exist.");
    }
  }
);

// Login route to authenticate users
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .send("Invalid credentials. <a href='/login'>Try again</a>.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .send("Invalid credentials. <a href='/login'>Try again</a>.");
    }

     // Store user session data
     req.session.user = {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    };

    // Redirect based on role
    if (user.role === "admin") {
      res.redirect("/admin/home");
    } else {
      res.redirect("/home");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in.");
  }
});



// Home page
app.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("index", { user: req.session.user });
});


// Admin Home Page
app.get("/admin/home", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  res.render("index", { admin: req.session.user });
});


// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/login");
  });
});

// Post a complaint page
app.get("/post-complaint", (req, res) => {
  if (req.session.user) {
    res.render("post-complaint");
  } else {
    res.redirect("/login");
  }
});

// Submit a complaint
app.post(
  "/submit-complaint",
  upload.single("file"),
  body("category").notEmpty().withMessage("Category is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("location").notEmpty().withMessage("Location is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const { category, description, location } = req.body;
      const userId = req.session.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const complaintCount = await Complaint.countDocuments();
      const complaintNumber = `CMP${complaintCount + 1}`;

      const newComplaint = new Complaint({
        userId: req.session.user.id,
        complaintNumber,
        category,
        description,
        location,
        file: req.file ? req.file.filename : null,
        regDate: new Date(),
        status: null,
      });

      await newComplaint.save();
      // Instead of redirect, you can send a JSON response
      // res.json({ success: true, complaintNumber: newComplaint.complaintNumber });
      res.redirect("/complaint-history");
    } catch (error) {
      console.error("Error submitting complaint:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error submitting complaint",
        error: error.message 
      });
    }
  }
);

// Complaint history
app.get("/complaint-history", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const complaints = await Complaint.find({ userId: req.session.user.id })
      .populate("userId", "first_name last_name email")
      .sort({ regDate: -1 });

    res.render("complaint-history", { complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Dashboard route
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", { user: req.session.user });
});

// API for dashboard stats
app.get("/api/dashboard-stats", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.session.user.id;

  try {
    const total = await Complaint.countDocuments({ userId });
    const pending = await Complaint.countDocuments({
      userId,
      status: null,
    });
    const inProcess = await Complaint.countDocuments({
      userId,
      status: "in process",
    });
    const closed = await Complaint.countDocuments({
      userId,
      status: "closed",
    });

    res.json({ total, pending, inProcess, closed });
  } catch (err) {
    console.error("Error fetching complaint stats:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Route for displaying full complaint details
app.get("/complaint-details/:id", async (req, res) => {
  const complaintId = req.params.id;

  try {
    // Fetch the full complaint data using the provided complaint ID
    const complaint = await Complaint.findById(complaintId).populate("userId");

    if (!complaint) {
      return res.status(404).send("Complaint not found");
    }

    res.render("complaint-details", { complaint });
  } catch (err) {
    console.error("Error fetching complaint details:", err);
    res.status(500).send("Error retrieving complaint details");
  }
});

// Settings page route
app.get("/settings", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("settings", { user: req.session.user });
});

// Password change route
app.post("/change-password", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  // Check if new password matches confirm password
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      message: "New passwords do not match" 
    });
  }

  // Check password complexity (optional but recommended)
  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: "New password must be at least 6 characters long" 
    });
  }

  try {
    // Find the user in the database
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Current password is incorrect" 
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error changing password" 
    });
  }
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);

});

