const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const os = require('os');

// Importing routes
const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post');
const commentRoutes = require('./routes/comment');
const likeRoutes = require('./routes/like');
const searchRoutes = require('./routes/search');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define the uploads directory and serve static files
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Routes
app.use(userRoutes);
app.use(postRoutes);
app.use(commentRoutes);
app.use(likeRoutes);
app.use(searchRoutes);

// Function to get the local IP address
function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const iface in ifaces) {
    for (const alias of ifaces[iface]) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '0.0.0.0';
}

// Start the server
app.listen(port, () => {
  const localIp = getLocalIp();
  console.log(`Server running at http://${localIp}:${port}/`);
});
