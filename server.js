const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
const fs = require('fs');
const uploadsPath = path.join(__dirname, 'uploads');
// const Department = require('./models/department');
// const ComplaintRouter = require('./services/complaintRouter');
const {Complaint}  = require("./models/complaint");
const User = require('./models/User'); 
const Category = require('./models/Category');
const UrgencyDetector = require('./ai/urgencyDetection');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const multer = require("multer");
const { body, validationResult } = require("express-validator"); // Importing express-validator
const flash = require("connect-flash");
const autoIncrement = require('mongoose-sequence')(mongoose);
const router = express.Router();
const { createComplaintNumber } = require("./models/complaint");

const urgencyDetector = new UrgencyDetector();
const { predictUrgency } = require('./ai/predict-urgency');




// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://prashant:204060bde@cluster0.veh0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      collection: 'sessions'
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// MongoDB Connection
const mongoURI =
  "mongodb+srv://prashant:204060bde@cluster0.veh0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(mongoURI, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());
// Configure flash messages
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up static file directories for each role
app.use(express.static(path.join(__dirname, "user", "public")));
app.use("/admin", express.static(path.join(__dirname, "admin", "public")));
app.use('/admin/public', express.static(path.join(__dirname, 'admin', 'public')));
app.use('/administration/public', express.static(path.join(__dirname, 'administration','public')));
// Set up the view engine to use EJS for rendering
app.set("view engine", "ejs");

const uploadsDirectory = path.join(__dirname, 'uploads');
app.set("views", [
  path.join(__dirname, "user", "views"),
  path.join(__dirname, "admin", "views"),
  path.join(__dirname, "administration", "views"),
]);

//Authenticate middleware
function isAuthenticated(req, res, next) {
  console.log('Session data:', req.session);  // Add this
  if (req.session && req.session.user && req.session.user.id) {
      console.log('User is authenticated');  // Add this
      next();
  } else {
      console.log('User is not authenticated');  // Add this
      res.redirect('/login');
  }
}
// Log middleware to track file requests
app.use('/uploads', (req, res, next) => {
  console.log('Accessing:', req.url);
  next();
});

app.use('/uploads', express.static(uploadsPath));

// Static file serving middleware
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
      console.log('Serving file:', filePath);
      // Set appropriate content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
          case '.jpg':
          case '.jpeg':
              res.set('Content-Type', 'image/jpeg');
              break;
          case '.png':
              res.set('Content-Type', 'image/png');
              break;
          case '.mp4':
              res.set('Content-Type', 'video/mp4');
              break;
      }
  }
}));

// Error handling middleware for uploads
app.use('/uploads', (err, req, res, next) => {
  console.error('Upload route error:', err);
  res.status(404).send('File not found');
});




// Role-based middleware
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  next();
};

const checkAdministrative = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'administrative') {
    return res.redirect('/login');
  }
  next();
};

const checkAdminOrDeveloper = (req, res, next) => {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'developer')) {
    return res.status(403).send('Access denied');
  }
  next();
};

const checkAdministrationAccess = (req, res, next) => {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'administrative')) {
    return res.redirect('/login');
  }
  next();
};


// Middleware to process urgency level
const processUrgency = (req, res, next) => {
  if (req.body.description) {
      const urgencyResult = urgencyDetector.getUrgencyLevel(req.body.description);
      req.body.urgency = urgencyResult;
  }
  next();
};




// Schema and Models

// Update users without a regDate
User.updateMany({ regDate: { $exists: false } }, { $set: { regDate: new Date() } })
  .then(() => console.log('RegDate added to users without it'))
  .catch(err => console.error('Error updating users:', err));

// // Define the User schema
// const userSchema = new mongoose.Schema({
//   first_name: { type: String, required: true },
//   last_name: { type: String, required: true },
//   email: { type: String, unique: true, required: true },
//   contact_no: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ["user", "admin", "administrative"], default: "user" },
//   regDate: { type: Date, default: Date.now },
// });



// // Complaint schema to handle user complaints

// const complaintSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   complaintNumberPrefix: { type: String, default: "CMP" },
//   complaintNumber: { type: Number, required: true, unique: true },  ComplainantName: { type: String, required: true },
//   category: { type: String, required: true },
//   urgency: { type: String, required: true },
//   description: { type: String, required: true },
//   location: { type: String, required: true }, // Name of the location
//   latitude: { type: Number, required: true }, // Latitude of the location
//   longitude: { type: Number, required: true }, // Longitude of the location
//   mapLink: { type: String, required: true }, // Direct map link
//   file: { type: String },
//   regDate: { type: Date, default: Date.now },
//   status: {
//     type: String,
//     enum: ["Not Processed Yet", "In Process", "Closed Complaint"],
//     default: "Not Processed Yet",
//   },
// });
// complaintSchema.plugin(autoIncrement, { inc_field: 'complaintNumber', start_seq: 1 });
// // const Complaint = mongoose.model("Complaint", complaintSchema);
// module.exports = Complaint;


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
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
   
    console.log("Full upload details:", {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });

    const newComplaint = new Complaint({
      userId: req.session.user._id,
      description: req.body.description,
      location: req.body.location,
      file: req.file.filename,
      // Add other required fields
    });

    newComplaint.save()
      .then(savedComplaint => {
        res.json({ 
          message: 'File uploaded successfully', 
          complaint: savedComplaint 
        });
      })
      .catch(err => {
        console.error("Complaint save error:", err);
        res.status(500).json({ 
          message: 'Error saving complaint', 
          error: err.message 
        });
      });
  } catch (error) {
    console.error("Upload route error:", error);
    res.status(500).send('Server error during upload');
  }
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


// Sign-Up route
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
      const trimmedPassword = password.trim(); // Trim whitespace before hashing
      const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
      const newUser = new User({
        first_name,
        last_name,
        contact_no,
        email,
        password: hashedPassword,
      });
      console.log('Hashed Password during Sign-Up:', hashedPassword); // Log to check

      await newUser.save();
      res.redirect("/login"); // Redirect to login after successful signup
    } catch (err) {
      console.error(err);
      res.status(500).send("Error signing up. Email may already exist.");
    }
  }
);

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const trimmedPassword = password.trim();
    // console.log('Login attempt details:');
    // console.log('Input password (trimmed):', trimmedPassword);
    // console.log('Stored hash version:', user.password.substring(0, 4));
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    // console.log('Password match result:', isMatch);
    // If login successful but using old hash format, update to new format
    if (isMatch && user.password.startsWith('$2a$')) {
      const newHash = await bcrypt.hash(trimmedPassword, 10);
      await User.updateOne({ _id: user._id }, { password: newHash });
    }

    // Store session data
    req.session.user = {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    };

    // Redirect user based on role
    if (user.role === "admin") {
      return res.redirect("/admin/home");
    } else if (user.role === "administrative") {
      return res.redirect("/administration/home");
    } else {
      return res.redirect("/home");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});





// User Home Page
app.get("/home", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "user") {
      return res.redirect("/login");
  }

  try {
      const complaints = await Complaint.find()
          .sort({ regDate: -1 })
          .limit(10);

      // Add debug information
      const complaintsWithDebug = complaints.map(complaint => {
          if (complaint.file) {
              const filePath = path.join(__dirname, 'uploads', complaint.file);
              console.log(`Checking file: ${filePath}`);
              console.log(`File exists: ${fs.existsSync(filePath)}`);
          }
          return complaint;
      });

      res.render(path.join(__dirname, "user", "views", "index"), {
          user: req.session.user,
          complaints: complaintsWithDebug,
      });
  } catch (error) {
      console.error('Error fetching complaints:', error);
      res.status(500).send('Error fetching complaints');
  }
});

// Endpoint to get recent complaints (if needed separately)
app.get('/api/complaints/recent', async (req, res) => {
  try {
      const complaints = await Complaint.find()
          .sort({ regDate: -1 })
          .limit(10); // Fetch the most recent ten complaints
      res.json(complaints);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching complaints' });
  }
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


// GET Route: Render the post-complaint page
app.get("/post-complaint", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
 
  try {
    const categories = await Category.find({});
    res.render("post-complaint", { categories }); // Pass categories to the template
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error loading categories.");
  }
});

// POST Route: Handle Complaint Submission
app.post("/submit-complaint", upload.single("file"), async (req, res) => {
  try {
    const { category, description, location, latitude, longitude, mapLink } = req.body;
    const userSession = req.session.user;

    if (!userSession) {
      return res.status(401).json({ success: false, message: "User not authenticated. Please log in." });
    }

    // AI-based urgency detection
    let urgencyResult;
    try {
      urgencyResult = urgencyDetector.getUrgencyLevel(description);
    } catch (aiError) {
      console.error("AI urgency detection failed, using fallback:", aiError);
      urgencyResult = { level: "medium", priority: 2, responseTime: "72 hours", description: "Standard priority complaint." };
    }

    console.log("Computed Urgency:", urgencyResult);

    // Find nearest appropriate department
    let departmentResult;
    try {
      departmentResult = await ComplaintRouter.routeComplaint({
        category,
        latitude,
        longitude
      });
      console.log("Department Assignment:", departmentResult);
    } catch (routingError) {
      console.error("Department routing failed:", routingError);
      departmentResult = null;
    }

    const complainantName = `${userSession.first_name} ${userSession.last_name}`;

    // Get the latest complaint number
    const lastComplaint = await Complaint.findOne().sort({ regDate: -1 }).select("complaintNumber");

    // Extract the number from the last complaint (CMP1 -> 1)
    let newComplaintNumber = 1;
    if (lastComplaint && lastComplaint.complaintNumber) {
      const lastNumber = parseInt(lastComplaint.complaintNumber.replace("CMP", ""), 10);
      if (!isNaN(lastNumber)) {
        newComplaintNumber = lastNumber + 1;
      }
    }

    const complaintNumber = `CMP${newComplaintNumber}`;

    // Create New Complaint with department assignment
    const newComplaint = new Complaint({
      userId: userSession.id,
      complaintNumber,
      complainantName,
      category,
      urgency: urgencyResult.level,
      urgencyDetails: {
        priority: urgencyResult.priority,
        responseTime: urgencyResult.responseTime,
        description: urgencyResult.description,
      },
      description,
      location,
      latitude,
      longitude,
      mapLink,
      file: req.file ? req.file.filename : null,
      regDate: new Date(),
      status: departmentResult ? "Assigned" : "Not Processed Yet",
      // Add department assignment if available
      ...(departmentResult && {
        assignedDepartment: {
          id: departmentResult.department._id,
          name: departmentResult.department.name,
          type: departmentResult.department.type,
          distance: departmentResult.distance
        }
      })
    });

    await newComplaint.save();

    // Prepare response message
    let responseMessage = `Complaint submitted successfully! Urgency Level: ${urgencyResult.level.toUpperCase()}`;
    if (departmentResult) {
      responseMessage += ` | Assigned to: ${departmentResult.department.name} (${departmentResult.distance.toFixed(2)} km away)`;
    }

    return res.status(200).json({
      success: true,
      message: responseMessage,
      complaintId: newComplaint._id,
      urgencyLevel: newComplaint.urgency,
      departmentAssignment: departmentResult ? {
        name: departmentResult.department.name,
        distance: departmentResult.distance,
        type: departmentResult.department.type
      } : null
    });

  } catch (error) {
    console.error("Error submitting complaint:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while submitting the complaint.",
      error: error.message,
    });
  }
});

// // services/complaintRouter.js
// class ComplaintRouter {
//   static async routeComplaint(complaint) {
//       try {
//           // Get department type for the complaint category
//           const departmentType = Department.getDepartmentTypeForCategory(complaint.category);

//           // Find nearest department of the required type
//           const nearestDepartment = await Department.findNearest(
//               [parseFloat(complaint.longitude), parseFloat(complaint.latitude)],
//               departmentType
//           );

//           if (!nearestDepartment) {
//               throw new Error(`No ${departmentType} department found within range`);
//           }

//           // Calculate distance using Haversine formula
//           const distance = this.calculateDistance(
//               complaint.latitude,
//               complaint.longitude,
//               nearestDepartment.location.coordinates[1],
//               nearestDepartment.location.coordinates[0]
//           );

//           return {
//               department: nearestDepartment,
//               distance: distance // in kilometers
//           };
//       } catch (error) {
//           console.error('Error routing complaint:', error);
//           throw error;
//       }
//   }

//   static calculateDistance(lat1, lon1, lat2, lon2) {
//       const R = 6371; // Earth's radius in kilometers
//       const dLat = this.toRad(lat2 - lat1);
//       const dLon = this.toRad(lon2 - lon1);
//       const a = 
//           Math.sin(dLat/2) * Math.sin(dLat/2) +
//           Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
//           Math.sin(dLon/2) * Math.sin(dLon/2);
//       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//       return R * c;
//   }

//   static toRad(value) {
//       return value * Math.PI / 180;
//   }
// }

// module.exports = ComplaintRouter;


// Complaint history route
app.get("/complaint-history", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Retrieve categories dynamically from the database
    const categories = await Category.find({}).lean();

    // Retrieve complaints for the current user
    const complaints = await Complaint.find({ userId: req.session.user.id })
      .populate("userId", "first_name last_name email")
      .sort({ regDate: -1 });

    // Format registration date to include time
    complaints.forEach((complaint) => {
      complaint.formattedDate = new Date(complaint.regDate).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    });

    // Render the view with both complaints and categories
    res.render("complaint-history", { complaints, categories });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Load complaint details.
app.get('/complaint/:id', async (req, res) => {
  try {
      const { id } = req.params;

      // Check if ID is valid (MongoDB ObjectId format)
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ error: "Invalid complaint ID" });
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
          return res.status(404).json({ error: "Complaint not found" });
      }

      res.json(complaint);
  } catch (error) {
      console.error("Error fetching complaint:", error);
      res.status(500).json({ error: "Server error" });
  }
});

// API to update complaint.
app.put("/complaint/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, location, latitude, longitude, mapLink } = req.body;

    // Recalculate urgency based on updated description
    let urgencyResult;
    try {
      urgencyResult = urgencyDetector.getUrgencyLevel(description);
    } catch (aiError) {
      console.error("AI urgency detection failed, using fallback:", aiError);
      urgencyResult = { level: "medium", priority: 2, responseTime: "72 hours", description: "Standard priority complaint." };
    }
    console.log("Recomputed Urgency:", urgencyResult);

    // Re-route the complaint based on updated category and location
    let departmentResult;
    try {
      departmentResult = await ComplaintRouter.routeComplaint({
        category,
        latitude,
        longitude
      });
      console.log("Department Assignment:", departmentResult);
    } catch (routingError) {
      console.error("Department routing failed:", routingError);
      departmentResult = null;
    }

    // Prepare updated fields (including recalculated urgency and department assignment)
    const updatedFields = {
      category,
      description,
      location,
      latitude,
      longitude,
      mapLink,
      urgency: urgencyResult.level,
      urgencyDetails: {
        priority: urgencyResult.priority,
        responseTime: urgencyResult.responseTime,
        description: urgencyResult.description
      },
      status: departmentResult ? "Assigned" : "Not Processed Yet"
    };

    if (departmentResult) {
      updatedFields.assignedDepartment = {
        id: departmentResult.department._id,
        name: departmentResult.department.name,
        type: departmentResult.department.type,
        distance: departmentResult.distance
      };
    } else {
      updatedFields.assignedDepartment = null;
    }

    // Handle file upload if a new file is provided
    if (req.file) {
      updatedFields.file = req.file.filename;
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedComplaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({ message: "Complaint updated", complaint: updatedComplaint });
  } catch (error) {
    console.error("Error updating complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// API to delete complaint
app.delete("/complaint/:id", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deletedComplaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!deletedComplaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    res.status(500).json({ message: "Internal Server Error" });
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


// Route to serve Contact Us page
app.get("/contact-us", (req, res) => {
  res.render("contact-us");
});


// Profile Route
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userSession = req.session.user || req.session.admin || req.session.administration;
    if (!userSession) return res.redirect('/login');

    // Fetch user details from database
    const user = await User.findById(userSession.id);
    if (!user) return res.redirect('/login');

    // Construct complainantName
    const complainantName = `${user.first_name} ${user.last_name}`;

    // Count complaints submitted by the user
    const complaintCount = await Complaint.countDocuments({ complainantName });

    // Determine profile view path
    let profilePage = path.join(__dirname, 'user/views/profile.ejs'); // Default

    if (userSession.role === "admin") {
      profilePage = path.join(__dirname, 'admin/views/profile.ejs');
    } else if (userSession.role === "administrative") {
      profilePage = path.join(__dirname, 'administration/views/profile.ejs');
    }

    console.log(`Rendering profile page for role: ${userSession.role}`);

    // Render the correct profile page
    return res.render(profilePage, {
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contactNo: user.contact_no,
        role: user.role,
        regDate: user.regDate,
        complaintCount
      }
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).send('Server Error');
  }
});







// User settings route
app.get('/settings', (req, res) => {
  console.log('Full Session:', req.session);

  const userSession = req.session.user || req.session.admin || req.session.administration;

  if (!userSession) {
    console.log('No Valid Session');
    return res.redirect('/login');
  }

  // Determine which settings page to render based on role
  let settingsPage = 'user/views/settings.ejs'; // Default to user settings
  if (userSession.role === "admin") {
    settingsPage = 'admin/views/settings.ejs';
  } else if (userSession.role === "administrative") {
    settingsPage = 'administration/views/settings.ejs';
  }

  console.log(`Rendering settings for role: ${userSession.role}`);
  return res.render(path.join(__dirname, settingsPage), { user: userSession });
});
// Password change route
app.post("/change-password", async (req, res) => {
  // Check if any valid session exists
  const userSession = req.session.user || req.session.admin || req.session.administration;

  if (!userSession) {
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

  // Check password complexity
  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: "New password must be at least 6 characters long" 
    });
  }

  try {
    // Find the user in the database
    const user = await User.findById(userSession.id);

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
const checkAdminAccess = (req, res, next) => {
  // Check if the user is logged in with admin role
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

// Admin Dashboard Route
app.get("/admin/dashboard", async (req, res) => {
  // Log session user for debugging
  console.log(req.session.user);

  // Check if the user is logged in and has admin role
  if (!req.session.user || !(req.session.user.role === "admin" || req.session.user.role === "administrative")) {
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
      // Fetch complaints and populate userId to get first_name andnlast_name
      const complaints = await Complaint.find({ userId: req.params.id })
        .populate('userId', 'first_name last_name'); // Populate the user's first_name andnlast_name

      // Extract relevant data and add complainantName field
      const complaintData = complaints.map(c => ({
          complaintNumber: c.complaintNumber,
          complainantName: `${c.userId.first_name} ${c.userId.last_name}`, // Construct the complainant's full name
          category: c.category,
          urgency: c.urgency,
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
      .populate('userId', 'first_name last_name'); // Populate userId with first_name andnlast_name

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
  const searchQuery = req.query.searchQuery || ''; // Get the search query from the URL query parameter

  try {
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

    // Check if the request expects JSON
    if (req.headers.accept === 'application/json') {
      return res.json({ users });
    }

    // If not an AJAX request, render the search-user page normally
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
        { urgency: { $regex: searchQuery, $options: 'i' } },
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









// General route protection middleware
const checkAdministrativeAccess = (req, res, next) => {
  // Check if the user is logged in with administrative role
  if (!req.session.user || req.session.user.role !== "administrative") {
    return res.redirect("/login");
  }
  next();
};


// Redirect to administration index.ejs
app.get('/administration', (req, res) => {
  res.render('index'); // Renders the 'index.ejs' from 'administration/views'
});



 // Ensure this part is inside an async function
// Administration Dashboard Route
// Administration Dashboard Route
app.get("/administration/dashboard", async (req, res) => {
  console.log(req.session.user);

  // Check if the user is logged in and has 'admin' or 'administrative' role
  if (!req.session.user || !(req.session.user.role === "administrative")) {
    return res.redirect("/login");
  }

  try {
    // Fetch stats from the database
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalCategories = await Category.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: "Not Processed Yet" });
    const inProcessComplaints = await Complaint.countDocuments({ status: "In Process" });
    const closedComplaints = await Complaint.countDocuments({ status: "Closed Complaint" });

    // Render the dashboard view with fetched stats
    res.render(path.join(__dirname, "administration", "views", "dashboard"), {
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
    console.error("Error loading administration dashboard:", err);
    res.status(500).send("Error loading dashboard.");
  }
});


// API for administration dashboard stats
app.get("/api/administration-dashboard-stats", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Check counts directly for each status
    const pendingComplaints = await Complaint.countDocuments({
      status: "Not Processed Yet"
    });

    const inProcessComplaints = await Complaint.countDocuments({
      status: "In Process"
    });

    const closedComplaints = await Complaint.countDocuments({
      status: "Closed Complaint"
    });

    // Fetch other stats (total users, total categories)
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalCategories = await Category.countDocuments();

    // Return the stats as JSON response
    res.json({
      totalUsers,
      totalCategories,
      pendingComplaints,
      inProcessComplaints,
      closedComplaints,
    });
  } catch (err) {
    console.error("Error fetching administration stats:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


// Administration route for all-complaints page

app.get('/administration/all-complaints', checkAdministrative, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'first_name last_name')
      .sort({ regDate: -1 });
    
    complaints.forEach(complaint => {
      if (complaint.regDate && typeof complaint.regDate === 'string') {
        complaint.regDate = new Date(complaint.regDate);
      }
    });
    
    // Debugging: Log the full path to the view
    const viewPath = path.join(__dirname, 'administration/views/all-complaints.ejs');
    console.log('Attempting to render view from:', viewPath);
    
    // Explicitly specify the full path
    res.render(viewPath, {
      complaints,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error in /administration/all-complaints:', error);
    
    // More detailed error handling
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('View file not found. Check the file path and existence of all-complaints.ejs');
    }
    
    res.status(500).send('Error fetching complaints: ' + error.message);
  }
});

// Route to update complaint status
app.post('/administration/update-complaint-status/:id', checkAdministrationAccess, async (req, res) => {
  try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedComplaint = await Complaint.findByIdAndUpdate(
          id,
          { status },
          { new: true }
      );

      if (!updatedComplaint) {
          return res.status(404).json({ message: 'Complaint not found' });
      }

      res.json({ 
          message: 'Status updated successfully',
          complaint: updatedComplaint 
      });

  } catch (error) {
      console.error('Error updating complaint status:', error);
      res.status(500).json({ message: 'Failed to update complaint status' });
  }
});

// Route to delete complaint
app.delete('/administration/delete-complaint/:id', checkAdministrationAccess, async (req, res) => {
  try {
      const { id } = req.params;
      const deletedComplaint = await Complaint.findByIdAndDelete(id);

      if (!deletedComplaint) {
          return res.status(404).json({ message: 'Complaint not found' });
      }

      res.json({ message: 'Complaint deleted successfully' });

  } catch (error) {
      console.error('Error deleting complaint:', error);
      res.status(500).json({ message: 'Failed to delete complaint' });
  }
});




// Route for "Not Processed Complaints"
app.get('/administration/not-processed', checkAdministrativeAccess, async (req, res) => {
  try {
    // Fetch complaints with "Not Processed Yet" status and populate userId to get complainant name
    const complaints = await Complaint.find({ status: "Not Processed Yet" })
      .populate('userId', 'first_name last_name');
    
    // Debugging: Log the view path and full file system path
    const viewPath = path.join(__dirname, 'administration/views/not-processed.ejs');
    // console.log('Attempting to render view from:', viewPath);
    
    // Use absolute path rendering
    res.render(viewPath, { 
      complaints, 
      user: req.session.user 
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send('Failed to load complaints');
  }
});

// Route to show "In Process" complaints
app.get('/administration/in-process', checkAdministrativeAccess, async (req, res) => {
  try {
    // Fetch complaints with "In Process" status and populate userId to get complainant name
    const complaints = await Complaint.find({ status: 'In Process' })
      .populate('userId', 'first_name last_name');
    
      // Use absolute path rendering
    const viewPath = path.join(__dirname, 'administration/views/in-process.ejs');
    
    res.render(viewPath, { 
      complaints, 
      user: req.session.user 
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send('Error fetching complaints');
  }
});

// Route to show "Closed Complaints"
app.get('/administration/closed-complaints', checkAdministrativeAccess, async (req, res) => {
  try {
    // Fetch complaints with "Closed Complaint" status and populate userId to get complainant name
    const complaints = await Complaint.find({ status: 'Closed Complaint' })
      .populate('userId', 'first_name last_name');
   // Use absolute path rendering
   const viewPath = path.join(__dirname, 'administration/views/closed-complaints.ejs');
    
   res.render(viewPath, { 
     complaints, 
     user: req.session.user 
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).send('Error fetching complaints');
  }
});

app.get('/administration/user-reports', checkAdministrativeAccess, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let users = [];
    let message = null;

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

    // Use absolute path rendering
    const viewPath = path.join(__dirname, 'administration/views/user-reports.ejs');
    
    // Render user data to the view (with or without message)
    res.render(viewPath, { 
      users, 
      message,
      user: req.session.user 
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    
    const viewPath = path.join(__dirname, 'administration/views/user-reports.ejs');
    res.render(viewPath, { 
      users: [], 
      message: 'An error occurred while fetching user data.',
      user: req.session.user 
    });
  }
});

// Route for Complaints Report
app.get('/administration/complaints-report', checkAdministrativeAccess, async (req, res) => {
  try {
    // Extract the start and end dates from query parameters
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
      .populate('userId', 'first_name last_name');

    // Convert regDate to Date object for display and add complainant name
    complaints.forEach(complaint => {
      if (complaint.regDate && typeof complaint.regDate === 'string') {
        complaint.regDate = new Date(complaint.regDate);
      }
    });

    // Use absolute path rendering
    const viewPath = path.join(__dirname, 'administration/views/complaints-report.ejs');
    
    // Render the complaints-report view with the filtered complaints
    res.render(viewPath, { 
      complaints, 
      startDate, 
      endDate,
      user: req.session.user 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching complaints report');
  }
});

// Search user route
app.get('/administration/search-user', checkAdministrativeAccess, async (req, res) => {
  const searchQuery = req.query.searchQuery;

  try {
    const searchQuery = req.query.searchQuery || '';
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

    // Use absolute path rendering
    const viewPath = path.join(__dirname, 'administration/views/search-user.ejs');
    
    res.render(viewPath, { 
      users,
      user: req.session.user,
      searchQuery 
    });

  } catch (error) {
    console.error('Error searching users:', error);
    
    // Use absolute path for error rendering
    const viewPath = path.join(__dirname, 'administration/views/search-user.ejs');
    res.status(500).render(viewPath, { 
      users: [],
      user: req.session.user,
      searchQuery: '',
      error: 'Internal server error' 
    });
  }
});

// Search complaints route
app.get('/administration/search-complaints', checkAdministrativeAccess, async (req, res) => {
  const searchQuery = req.query.searchQuery?.trim();

  if (!searchQuery) {
    // Use absolute path rendering when no search query
    const viewPath = path.join(__dirname, 'administration/views/search-complaints.ejs');
    return res.render(viewPath, { 
      complaints: null,
      user: req.session.user,
      searchQuery: '' 
    });
  }

  try {
    // Search for complaints by complaintNumber, ComplainantName, category, or status
    const complaints = await Complaint.find({
      $or: [
        { complaintNumber: { $regex: searchQuery, $options: 'i' } },
        { ComplainantName: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
        { urgency: { $regex: searchQuery, $options: 'i' } },
        { status: { $regex: searchQuery, $options: 'i' } },

      ],
    });

    // Use absolute path rendering with .ejs extension
    const viewPath = path.join(__dirname, 'administration/views/search-complaints.ejs');

    // Render the page with the search results
    res.render(viewPath, { 
      complaints,
      user: req.session.user,
      searchQuery 
    });
  } catch (err) {
    console.error('Error during search:', err);
    
    // Use absolute path for error rendering
    const viewPath = path.join(__dirname, 'administration/views/search-complaints.ejs');
    res.status(500).render(viewPath, { 
      complaints: [],
      user: req.session.user,
      searchQuery: '',
      error: 'Internal Server Error' 
    });
  }
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

