const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const { body, validationResult } = require("express-validator"); // Importing express-validator
const app = express();
const router = express.Router();
const Category = require('./models/Category');  // Add this ONCE at the top with other requires
// const User = require('../models/User'); // Import User model


// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Set up the view engine to use EJS for rendering
app.set("view engine", "ejs");

// Set up static file directories for each role
app.use(express.static(path.join(__dirname, "user", "public")));
app.use("/admin", express.static(path.join(__dirname, "admin", "public")));
app.use("/administration", express.static(path.join(__dirname, "administration", "public")));

app.use('/admin/public', express.static(path.join(__dirname, 'admin', 'public')));
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Add view directories for user, admin, and administration roles
// Make sure this directory exists
const uploadsDirectory = path.join(__dirname, 'uploads');
app.set("views", [
  path.join(__dirname, "user", "views"),
  path.join(__dirname, "admin", "views"),
  path.join(__dirname, "administration", "views"),
]);


// Middleware to check if user is an admin or developer
function checkAdminOrDeveloper(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'developer') {
    return res.status(403).send('Access denied');
  }
  next();
}
// Middleware to check the user's role
function checkRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.redirect("/login");
    }
    next();
  };
}

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
  role: { type: String, enum: ["user", "admin", "administrative"], default: "user" }, // Default role
  regDate: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema); // Compile the user model
User.updateMany({ regDate: { $exists: false } }, { $set: { regDate: new Date() } })
  .then(() => console.log('RegDate added to users without it'))
  .catch(err => console.error('Error updating users:', err));

// Complaint schema to handle user complaints
const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
  complaintNumber: { type: String, required: true },
  ComplainantName: {type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  file: { type: String },
  regDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["Not Processed Yet", "In Process", "Closed Complaint"], default: "Not Processed Yet" } // Add the status field
});

const Complaint = mongoose.model("Complaint", complaintSchema); // Compile the complaint model
module.exports = Complaint;




// Define storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads'));  // Upload folder
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);  // Unique filename
  }
});

// Set up multer for single file uploads
const upload = multer({ storage: storage });

// Upload route for handling file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);  // Check the uploaded file details
  res.send('File uploaded successfully');
});

app.post('/upload', upload.single('file'), (req, res) => {
  console.log("Uploaded file path:", req.file.path);  // Log the file path
  res.send('File uploaded successfully');
});





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

    const { first_name, last_name, contact_no, email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        first_name,
        last_name,
        contact_no,
        email,
        password: hashedPassword,
      });

      await newUser.save();
      res.redirect("/login"); // Redirect to login after successful signup
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
    // Find the user based on the provided email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the entered password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Store the relevant user information in the session
    req.session.user = {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    };

    // Redirect based on the user's role
    if (user.role === "admin") {
      res.redirect("/admin/home");
    } else if (user.role === "administrative") {
      res.redirect("/administration/home");
    } else {
      res.redirect("/home");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});


// User Home Page
app.get("/home", (req, res) => {
  if (!req.session.user || req.session.user.role !== "user") {
    return res.redirect("/login");
  }
  res.render(path.join(__dirname, "user", "views", "index"), {
    user: req.session.user,
  });
});

// Admin Home Page
app.get("/admin/home", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  res.render(path.join(__dirname, "admin", "views", "index"), {
    admin: req.session.user,
  });
});

// Administrative Home Page
app.get("/administration/home", (req, res) => {
  if (!req.session.user || req.session.user.role !== "administrative") {
    return res.redirect("/login");
  }
  res.render(path.join(__dirname, "administration", "views", "index"), {
    admin: req.session.user,
  });
});

//dashboard root user/ admin
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && user.password === password) {
      req.session.user = user; // Save user session

      // Redirect based on role
      if (user.role === "admin") {
        return res.redirect("/admin/dashboard");
      } else if (user.role === "user") {
        return res.redirect("/user/dashboard");
      }
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
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

app.get("/post-complaint", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  
  try {
    const categories = await Category.find({});
    res.render("post-complaint", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error loading categories.");
  }
});

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
      const userSession = req.session.user;
      
      if (!userSession) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const ComplainantName = `${userSession.first_name} ${userSession.last_name}`;
      const complaintCount = await Complaint.countDocuments();
      const complaintNumber = `CMP${complaintCount + 1}`;

      const newComplaint = new Complaint({
        userId: userSession.id,
        complaintNumber,
        ComplainantName,
        category,
        description,
        location,
        file: req.file ? req.file.filename : null,
        regDate: new Date(),
        status: "Not Processed Yet"
      });

      await newComplaint.save();
      
      // Return success JSON response instead of redirecting
      return res.status(200).json({
        success: true,
        message: "Complaint submitted successfully",
        complaint: newComplaint
      });

    } catch (error) {
      console.error("Error submitting complaint:", error);
      return res.status(500).json({ 
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
// //
// app.get("/user/dashboard", checkRole("user"), (req, res) => {
//   // Render the user dashboard view
//   res.render("user/dashboard", { user: req.session.user });
// });


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
      status: { $in: [null, undefined, "Not Processed Yet"] }, // Updated for null, undefined, and exact string match
    });

    const inProcess = await Complaint.countDocuments({
      userId,
      status: { $regex: /^in process$/i }, // Case-insensitive regex
    });

    const closed = await Complaint.countDocuments({
      userId,
      status: { $regex: /^closed complaint$/i }, // Case-insensitive regex
    });

    // Log the statistics
    // console.log("Dashboard Stats:", { total, pending, inProcess, closed });

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









//admin view
// Admin Routes
app.get("/admin", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  res.render(path.join(__dirname, "admin", "views", "index"));
});


//to check all unique statuses
app.get("/debug-statuses", async (req, res) => {
  try {
      const uniqueStatuses = await Complaint.distinct('status');
      console.log('All unique statuses in database:', uniqueStatuses);
      res.json(uniqueStatuses);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error checking statuses');
  }
});
// Admin Dashboard Route
// Admin Dashboard Route
app.get("/admin/dashboard", async (req, res) => {
  // Log session user for debugging
  console.log(req.session.user);

  // Check if the user is logged in and has admin role
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }

  try {
    // Fetch all stats from the database
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalCategories = await Category.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: "Not Processed Yet" });
    const inProcessComplaints = await Complaint.countDocuments({ status: "In Process" });
    const closedComplaints = await Complaint.countDocuments({ status: "Closed Complaint" });

    // Log the stats to ensure they are being fetched correctly
    // console.log('Total Users:', totalUsers);
    // console.log('Total Categories:', totalCategories);
    // console.log('Total Complaints:', totalComplaints);
    // console.log('Pending Complaints:', pendingComplaints);
    // console.log('In Process Complaints:', inProcessComplaints);
    // console.log('Closed Complaints:', closedComplaints);

    // Render the admin dashboard with the fetched stats
    res.render(path.join(__dirname, "admin", "views", "dashboard"), {
      admin: req.session.user,
      stats: {
        totalUsers,
        totalCategories,
        totalComplaints,
        pendingComplaints,
        inProcessComplaints,
        closedComplaints,
      }
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    res.status(500).send("Error loading dashboard.");
  }
});

// API for dashboard stats
app.get("/api/dashboard-stats", async (req, res) => {
  if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
  }

  try {
      // Check counts directly for each status
      const pendingComplaints = await Complaint.countDocuments({
          status: "Not Processed Yet"
      });
      // console.log('Pending Complaints:', pendingComplaints);

      const inProcessComplaints = await Complaint.countDocuments({
          status: "In Process"
      });
      // console.log('In Process Complaints:', inProcessComplaints);

      const closedComplaints = await Complaint.countDocuments({
          status: "Closed Complaint"
      });
      // console.log('Closed Complaints:', closedComplaints);

      // Fetch other stats (total users, total categories)
      const totalUsers = await User.countDocuments({ role: "user" });
      // console.log('Total Users:', totalUsers);
      
      const totalCategories = await Category.countDocuments();
      // console.log('Total Categories:', totalCategories);

      // Return the stats as JSON response
      res.json({
          totalUsers,
          totalCategories,
          pendingComplaints,
          inProcessComplaints,
          closedComplaints,
      });
  } catch (err) {
      console.error("Error fetching complaint stats:", err);
      res.status(500).json({ error: "Server Error" });
  }
});



// Wrap the await in an async function
// Insert predefined categories into the database
const createCategories = async () => {
  try {
    const predefinedCategories = [
      { name: "Waste Issue", description: "Waste disposal related issues." },
      { name: "Electricity Issue", description: "Issues related to electricity." },
      { name: "Water Issue", description: "Issues related to water supply." },
      { name: "Road Issue", description: "Issues related to roads." },
      { name: "Theft/Violence", description: "Cases of theft and violence." },
    ];

    const existingCategories = await Category.find({});

    if (existingCategories.length === 0) {
      await Category.insertMany(predefinedCategories);
      console.log("Categories inserted successfully!");
    } else {
      console.log("Categories already exist.");
    }
  } catch (error) {
    console.error("Error inserting categories:", error);
  }
};

// Call the async function to insert predefined categories
createCategories();




// POST route to add category
app.post("/admin/add-category", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }

  const { name, description } = req.body;

  try {
    // Check if the category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.json({ success: false, message: "Category already exists!" });
    }

    // Create and save a new category
    const newCategory = new Category({ name, description });
    await newCategory.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding category:", error);
    res.json({ success: false, message: "Failed to add category." });
  }
});

// Route to fetch and display all categories (Admin view)
app.get("/admin/add-category", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }

  try {
    const categories = await Category.find({});
    res.render("add-category", { categories }); // Ensure "add-category.ejs" exists in your views directory
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error loading page.");
  }
});


//Edit a Category:
app.put("/admin/edit-category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (updatedCategory) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Category not found." });
    }
  } catch (error) {
    console.error("Error editing category:", error);
    res.json({ success: false, message: "Failed to edit category." });
  }
});

//Delete a Category:
// Route to delete an existing category (Admin only)
app.delete("/admin/delete-category/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);
    if (deletedCategory) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Category not found." });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.json({ success: false, message: "Failed to delete category." });
  }
});


//manageuser
app.get('/admin/manage-users', async (req, res) => {
  try {
    const users = await User.find({}); // Fetch all users
    res.render('manage-users', {
      users: users.map(user => ({
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        contact_no: user.contact_no,
        email: user.email,
        role: user.role,
        regDate: user.regDate ? new Date(user.regDate).toLocaleDateString() : 'N/A', // Format regDate
      })),
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Server Error');
  }
});


// Delete a User by ID
app.delete("/admin/delete-user/:id", async (req, res) => {
  try {
      const userId = req.params.id;
      await User.findByIdAndDelete(userId); // Delete user by ID
      res.json({ success: true });
  } catch (err) {
      console.error("Error deleting user:", err);
      res.json({ success: false });
  }
});

//routes
// Fetch User Details
app.get("/admin/user-details/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      contact_no: user.contact_no,
      email: user.email,
      role: user.role,
      regDate: user.regDate, // Add this line to include registration date
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).send("Server Error");
  }
});


// Update User Role
app.post("/admin/update-role/:id", async (req, res) => {
  try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
      res.json({ success: true });
  } catch (err) {
      console.error("Error updating user role:", err);
      res.json({ success: false });
  }
});
// Fetch Complaints for a User
app.get("/admin/user-complaints/:id", async (req, res) => {
  try {
      // Fetch complaints and populate userId to get first_name and last_name
      const complaints = await Complaint.find({ userId: req.params.id })
        .populate('userId', 'first_name last_name'); // Populate the user's first_name and last_name

      // Extract relevant data and add complainantName field
      const complaintData = complaints.map(c => ({
          complaintNumber: c.complaintNumber,
          complainantName: `${c.userId.first_name} ${c.userId.last_name}`, // Construct the complainant's full name
          category: c.category,
          description: c.description,
          location: c.location,
          file: c.file,
          regDate: c.regDate.toISOString() // Format date if necessary
      }));

      res.json({ complaints: complaintData });
  } catch (err) {
      console.error("Error fetching complaints:", err);
      res.status(500).send("Server Error");
  }
});

// Route to manage all complaints page
app.get('/admin/all-complaints', async (req, res) => {
  try {
    // Fetch all complaints and populate the userId to get complainant name
    const complaints = await Complaint.find()
      .populate('userId', 'first_name last_name'); // Populate userId with first_name and last_name

    // Convert regDate to Date object and add complainant name
    complaints.forEach(complaint => {
      if (complaint.regDate && typeof complaint.regDate === 'string') {
        complaint.regDate = new Date(complaint.regDate); // Convert the string to Date
      }
    });

    // Render the data to the view
    res.render('all-complaints', { complaints });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching complaints');
  }
});

// Update complaint status
app.post('/admin/update-complaint-status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Update complaint status in the database
        await Complaint.findByIdAndUpdate(id, { status });

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error("Error updating complaint status:", error);
        res.status(500).json({ message: 'Failed to update status' });
    }
});

// Delete complaint
app.delete('/admin/delete-complaint/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Delete the complaint from the database
        await Complaint.findByIdAndDelete(id);

        res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        console.error("Error deleting complaint:", error);
        res.status(500).json({ message: 'Failed to delete complaint' });
    }
});
// Route for "Not Processed Complaints"
app.get('/admin/not-processed', async (req, res) => {
  try {
    // Fetch complaints with "Not Processed Yet" status and populate userId to get complainant name
    const complaints = await Complaint.find({ status: "Not Processed Yet" })
      .populate('userId', 'first_name last_name'); // Populate userId with first_name and last_name
    
    // Render the 'not-processed' page with the complaints data
    res.render('not-processed', { complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send('Failed to load complaints');
  }
});

// Route to show "In Process" complaints
app.get('/admin/in-process', async (req, res) => {
  try {
    // Fetch complaints with "In Process" status and populate userId to get complainant name
    const complaints = await Complaint.find({ status: 'In Process' })
      .populate('userId', 'first_name last_name'); // Populate userId with first_name and last_name
    
    // Render the 'in-process' page with the complaints data
    res.render('in-process', { complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send('Error fetching complaints');
  }
});

// Route to show "Closed Complaints"
app.get('/admin/closed-complaints', async (req, res) => {
  try {
    // Fetch complaints with "Closed Complaint" status and populate userId to get complainant name
    const complaints = await Complaint.find({ status: 'Closed Complaint' })
      .populate('userId', 'first_name last_name'); // Populate userId with first_name and last_name
    
    // Render the 'closed-complaints' page with the complaints data
    res.render('closed-complaints', { complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send('Error fetching complaints');
  }
});

// User-reports page route
app.get('/admin/user-reports', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let users = [];
    let message = null; // Initialize message as null to avoid undefined reference

    // If no date range is provided, fetch all users
    if (!fromDate || !toDate) {
      users = await User.find({});
    } else {
      // Parse the date range from the request query
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // Check for valid date range
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        message = 'Invalid date format. Please provide valid dates.';
      } else if (from > to) {
        message = 'From date cannot be later than To date.';
      } else {
        // Query to find users in the given date range
        users = await User.find({
          regDate: {
            $gte: from,
            $lte: to
          }
        });
      }
    }

    // Render user data to the view (with or without message)
    res.render('user-reports', { users, message });

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.render('user-reports', { message: 'An error occurred while fetching user data.' });
  }
});


// Route for Complaints Report
app.get('/admin/complaints-report', async (req, res) => {
  try {
    // Extract the start and end dates from query parameters (e.g., /admin/complaints-report?startDate=2025-01-01&endDate=2025-01-31)
    const { startDate, endDate } = req.query;

    let filter = {};

    if (startDate && endDate) {
      filter.regDate = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate)
      };
    }

    // Fetch complaints filtered by the given date range
    const complaints = await Complaint.find(filter)
      .populate('userId', 'first_name last_name'); // Populate userId with first_name and last_name

    // Convert regDate to Date object for display and add complainant name
    complaints.forEach(complaint => {
      if (complaint.regDate && typeof complaint.regDate === 'string') {
        complaint.regDate = new Date(complaint.regDate); // Convert the string to Date
      }
    });

    // Render the complaints-report view with the filtered complaints
    res.render('complaints-report', { complaints, startDate, endDate });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching complaints report');
  }
});

//search user
app.get('/admin/search-user', async (req, res) => {
  const searchQuery = req.query.searchQuery;

  try {
    const searchQuery = req.query.searchQuery || ''; // Get the search query from the URL query parameter
    let users = [];

    if (searchQuery) {
      // Search users by name, email, or contact number (case-insensitive)
      users = await User.find({
        $or: [
          { first_name: { $regex: searchQuery, $options: 'i' } },
          { last_name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { contact_no: { $regex: searchQuery, $options: 'i' } },
        ],
      });
    }

    res.render('search-user', { users });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes
app.get('/admin/search-complaints', async (req, res) => {
  const searchQuery = req.query.searchQuery?.trim();

  if (!searchQuery) {
    // Render the page without complaints if no search query is provided
    return res.render('search-complaints', { complaints: null });
  }

  try {
    // Search for complaints by complaintNumber, ComplainantName, category, or status
    const complaints = await Complaint.find({
      $or: [
        { complaintNumber: { $regex: searchQuery, $options: 'i' } },
        { ComplainantName: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
        { status: { $regex: searchQuery, $options: 'i' } },
      ],
    });

    // Render the page with the search results
    res.render('search-complaints', { complaints });
  } catch (err) {
    console.error('Error during search:', err);
    res.status(500).send('Internal Server Error');
  }
});



//
app.get("/admin/settings", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  res.render(path.join(__dirname, "admin", "views", "settings"));
});


// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/login");
  });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);

});