const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
const session = require('express-session'); // Add session handling

const app = express();
const port = 3000;

// MySQL connection details
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'billssql',
});

// Connect to MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Enable CORS
app.use(cors());

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use express-session for session management
app.use(session({
  secret: 'your-secret-key', // Secret to sign the session ID cookie
  resave: false,  // Don't save session if it's not modified
  saveUninitialized: true, // Save uninitialized sessions
  cookie: { secure: false } // For development (set secure: true for production with HTTPS)
}));

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Serve the login page (GET route for login)
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// POST Route for login (backend validation without bcrypt)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query to check if the username exists
  const query = `SELECT * FROM users WHERE username = ?`;
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length > 0) {
      const storedPassword = results[0].password; // Get the password from the database (plain text)

      // Compare the entered password with the stored password (plain text)
      if (password === storedPassword) {
        // Password is correct, proceed to login
        req.session.loggedIn = true; // Set the session status to logged in
        req.session.username = username; // Optionally store the username
        res.redirect('/'); // Redirect to home page or dashboard on success
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  });
});

// Register new user (storing password as plain text)
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Insert the new user with the plain text password
  const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
  db.query(query, [username, password], (err) => {
    if (err) return res.status(500).json({ message: "Error registering user" });
    res.json({ message: "User registered successfully!" });
  });
});

// Middleware to check if the user is logged in
function checkLogin(req, res, next) {
  if (req.session.loggedIn) {
    next(); // If logged in, proceed to the next middleware or route handler
  } else {
    res.redirect('/login'); // If not logged in, redirect to login page
  }
}

// Protect the '/export' route with the login check
app.get("/export", checkLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "export.html"));
});

// Protect the '/data' route with the login check
app.get("/data", checkLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "data.html"));
});

// Serve the HTML files
app.get("/", (req, res) => {
  // Check if the user is logged in
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, "views", "index.html"));
  } else {
    res.redirect("/login"); // Redirect to the login page if not logged in
  }
});

// API Route: Fetch all models
app.get("/api/models", (req, res) => {
  db.query("SELECT * FROM models", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Format the 'created_at' date to MM-DD format before returning it
    rows.forEach(item => {
      const date = new Date(item.created_at);
      const formattedDate = (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
      item.created_at = formattedDate; // Format date to MM-DD
    });

    res.json(rows);
  });
});

// API Route: Add a new model
app.post("/api/models", (req, res) => {
  const { name, price } = req.body;
  const query = `INSERT INTO models (name, price) VALUES (?, ?)`;
  db.query(query, [name, price], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Model added successfully!" });
  });
});

// API Route: Update a model
app.put("/api/models/:id", (req, res) => {
  const { name, price } = req.body;
  const query = `UPDATE models SET name = ?, price = ? WHERE id = ?`;
  db.query(query, [name, price, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Model updated successfully!" });
  });
});

// API Route: Delete a model
app.delete("/api/models/:id", (req, res) => {
  const query = `DELETE FROM models WHERE id = ?`;
  db.query(query, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Model deleted successfully!" });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
