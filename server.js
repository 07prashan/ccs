const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const path = require("path")
const session = require("express-session");
const multer = require("multer");
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Session Middleware
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Set up sessions
app.use(
  session({
    secret: "secret",  // You can use an environment variable for production
    resave: false,
    saveUninitialized: true,
  })
);

// MongoDB Connection
const mongoURI = "mongodb+srv://prashant:204060bde@cluster0.veh0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema and Models
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  contact_no: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["user", "admin", "administrative"] },
});

const User = mongoose.model("User", userSchema);

// Routes
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// Signup Route
app.post("/signup", async (req, res) => {
  const { first_name, last_name, contact_no, email, password, role } = req.body;

  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

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
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send("Invalid credentials. <a href='/login'>Try again</a>.");
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("Invalid credentials. <a href='/login'>Try again</a>.");
    }

    // Store user data in the session (you can use this for authentication later)
    req.session.user = {
      id: user._id,
      first_name: user.first_name,
    };

    res.redirect("/home"); // Redirect to the home page after login
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in.");
  }
});

// Home Page Route
app.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if not logged in
  }
  res.render("index", { user: req.session.user }); // Render home page
});

// Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/login");
  });
});

// Start the Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


// Route to render Post a Complaint page

app.get("/post-complaint", (req, res) => {
  if (req.session.user) {
      res.render("post-complaint");  // This will render the 'post-complain.ejs' page
  } else {
      res.redirect("/login"); // Redirect to login if user is not authenticated
  }
});






// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory to store uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  category: String,
  description: String,
  location: String,
  file: String, // Path to the uploaded file
  userId: mongoose.Schema.Types.ObjectId, // Link complaint to a user
});

const Complaint = mongoose.model("Complaint", complaintSchema);

// POST Endpoint for Handling Complaint Submission
app.post("/submit-complaint", upload.single("file"), async (req, res) => {
  try {
    const { category, description, location } = req.body;
    const userId = req.session.user?.id; // Get user ID from session

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Save complaint details in the database
    const newComplaint = new Complaint({
      category,
      description,
      location,
      file: req.file.path, // Path of the uploaded file
      userId,
    });

    await newComplaint.save();

    res.json({ success: true, message: "Complaint submitted successfully!" });
  } catch (err) {
    console.error("Error submitting complaint:", err);
    res.status(500).json({ success: false, message: "Failed to submit complaint." });
  }
});
