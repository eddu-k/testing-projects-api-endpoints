const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// This lets your server understand JSON data
app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Helper function to read projects from your file
function getProjectsFromFile() {
  try {
  console.log('Trying to read projects.json...');
  const data = fs.readFileSync('projects.json', 'utf8');
  console.log('Successfully read projects.json');
  return JSON.parse(data);
} catch (error) {
  console.error('Error reading projects.json:', error);
  throw error;
}

}
// GET /projects - Get all projects
app.get('/projects', (req, res) => {
  try {
    const projects = getProjectsFromFile();
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reading projects'
    });
  }
});

// GET /projects/:id - Get specific project by ID
app.get('/projects/:id', (req, res) => {
  try {
    const projects = getProjectsFromFile();
    const projectId = parseInt(req.params.id);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reading project'
    });
  }
});

// Helper function to save projects back to file
function saveProjectsToFile(projects) {
  fs.writeFileSync('projects.json', JSON.stringify(projects, null, 4));
}

// POST /projects - Create a new project
app.post('/projects', (req, res) => {
  try {
    const { name, description, status, startDate } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    const projects = getProjectsFromFile();
    
    // Generate new ID (highest current ID + 1)
    const newId = Math.max(...projects.map(p => p.id)) + 1;
    
    // Create new project
    const newProject = {
      id: newId,
      name: name,
      description: description,
      status: status || 'inactive',
      startDate: startDate || new Date().toISOString().split('T')[0]
    };
    
    // Add to array and save
    projects.push(newProject);
    saveProjectsToFile(projects);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
});

// PUT /projects/:id - Update existing project
app.put('/projects/:id', (req, res) => {
  try {
    const projects = getProjectsFromFile();
    const projectId = parseInt(req.params.id);
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Update project with new data (keep existing data if not provided)
    const { name, description, status, startDate } = req.body;
    
    projects[projectIndex] = {
      ...projects[projectIndex], // Keep existing data
      ...(name && { name }),
      ...(description && { description }),
      ...(status && { status }),
      ...(startDate && { startDate })
    };
    
    saveProjectsToFile(projects);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: projects[projectIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
});

// DELETE /projects/:id - Delete project
app.delete('/projects/:id', (req, res) => {
  try {
    const projects = getProjectsFromFile();
    const projectId = parseInt(req.params.id);
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const deletedProject = projects[projectIndex];
    projects.splice(projectIndex, 1); // Remove from array
    saveProjectsToFile(projects);
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: deletedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
});

// Simple test route for deleting projects
app.get('/test-delete/:id', (req, res) => {
  const projectId = req.params.id;
  res.send(`
    <html>
      <body>
        <h2>Delete Project ${projectId}</h2>
        <p>Are you sure you want to delete this project?</p>
        <button onclick="deleteProject()">Yes, Delete It</button>
        <a href="/projects">Cancel</a>
        
        <script>
          async function deleteProject() {
            try {
              const response = await fetch('/projects/${projectId}', {
                method: 'DELETE'
              });
              const result = await response.json();
              alert(JSON.stringify(result, null, 2));
              if (result.success) {
                window.location.href = '/projects';
              }
            } catch (error) {
              alert('Error: ' + error.message);
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Project API running on http://localhost:${PORT}`);
});