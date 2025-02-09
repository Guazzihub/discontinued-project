const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');
const routes = require('./routes/index');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Settings
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body-parser Settings
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session Settings
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'strict'
  },
  name: 'sessionId', // Cookies
  rolling: true, // Reset maxAge for every request
}));

// Middleware for session
app.use((req, res, next) => {
  res.locals.user = req.session || null;
  next();
});

// Views Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Default Route
app.use('/', routes);

// Global handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', {
    message: 'Server Error',
    user: req.session
  });
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});