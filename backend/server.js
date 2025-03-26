const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors());

// Initialize Supabase client
const supabaseUrl = 'https://knesrbcxvilzfcgxpshp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZXNyYmN4dmlsemZjZ3hwc2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNjc3MTksImV4cCI6MjA1Njc0MzcxOX0.PyPFZgP4wIYvYmDyaC_XV1UjvcHZ8CaS3YISxJ7Azm4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
app.get('/test-supabase', async (req, res) => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('builders').select('*').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return res.status(500).json({ error: 'Supabase connection failed', details: error });
    }
    console.log('Supabase connection test successful:', data);
    res.status(200).json({ message: 'Supabase connection successful', data });
  } catch (err) {
    console.error('Server error during Supabase test:', err);
    res.status(500).json({ error: 'Server error', details: err });
  }
});

// Registration endpoint
app.post('/register', async (req, res) => {
  console.log('Received registration request:', req.body);

  const { username, email, password, country } = req.body;

  // Validate input
  if (!username || !email || !password || !country) {
    console.log('Validation failed: Missing fields');
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully:', hashedPassword);

    // Insert user into the builders table
    console.log('Inserting user into Supabase...');
    const { data, error } = await supabase
      .from('builders')
      .insert([{ username, email, password: hashedPassword, country }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Error registering user', details: error });
    }

    console.log('User registered successfully:', data);
    res.status(201).json({ message: 'Registration successful', user: data[0] });
  } catch (err) {
    console.error('Server error during registration:', err);
    res.status(500).json({ error: 'Error registering user', details: err.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase
      .from('builders')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Login successful', user: { id: data.id, username: data.username, email: data.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Register a new project
app.post("/register-project", async (req, res) => {
  try {
    const { builder_id, project_name, total_square_feet, estimated_cost, estimated_time_months, start_date, end_date, type_of_construction, address } = req.body;

    console.log("Received Data:", req.body);

    // Validate all required fields
    if (!builder_id || !project_name || !total_square_feet || !estimated_cost || !estimated_time_months || !start_date || !end_date || !type_of_construction || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("projects_users")
      .insert([{
        builder_id,
        project_name,
        total_square_feet,
        estimated_cost,
        estimated_time_months,
        start_date,
        end_date,
        type_of_construction,
        address
      }])
      .select();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Error registering project", details: error.message });
    }

    res.status(200).json({ message: "Project registered successfully", data });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Fetch all projects for a specific builder
app.get('/projects_users/:builder_id', async (req, res) => {
  try {
    const { builder_id } = req.params;

    if (!builder_id) {
      return res.status(400).json({ error: 'Builder ID is required' });
    }

    const { data, error } = await supabase
      .from('projects_users')
      .select('*')
      .eq('builder_id', builder_id);

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Error fetching projects', details: error });
    }

    // Always return a 200 status with an empty array if no projects are found
    res.status(200).json({ message: 'Projects fetched successfully', projects: data || [] });
  } catch (err) {
    console.error('Server error during project fetch:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update a project
app.put('/projects_users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, total_square_feet, estimated_cost, estimated_time_months, start_date, end_date, type_of_construction, address } = req.body;

    if (!id || !project_name || !total_square_feet || !estimated_cost || !estimated_time_months || !start_date || !end_date || !type_of_construction || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { data, error } = await supabase
      .from('projects_users')
      .update({
        project_name,
        total_square_feet,
        estimated_cost,
        estimated_time_months,
        start_date,
        end_date,
        type_of_construction,
        address
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Error updating project', details: error });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ message: 'Project updated successfully', data });
  } catch (err) {
    console.error('Server error during project update:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Delete a project (optional, for future use)
app.delete('/projects_users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const { data, error } = await supabase
      .from('projects_users')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: 'Error deleting project', details: error });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted successfully', data });
  } catch (err) {
    console.error('Server error during project delete:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});