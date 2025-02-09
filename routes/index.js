const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const userController = require('../controllers/usercontroller');
const itemController = require('../controllers/itemcontroller');
const filterController = require('../controllers/filtercontroller');
const clientsController = require('../controllers/clientscontroller');
const { isAuthenticated, isAdmin } = require('../middlewares/authmiddleware');

// Root
router.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// Auth Routes
router.get('/auth/login', authController.getLoginPage);
router.post('/auth/login', authController.login);
router.get('/auth/register', authController.getRegisterPage);
router.post('/auth/register', authController.register);
router.get('/auth/logout', authController.logout);

// Admin role routes (admin only)
router.get('/clients', isAuthenticated, isAdmin, clientsController.listClients);
router.get('/clients/:id', isAuthenticated, isAdmin, clientsController.clientDetails);
router.get('/clients/switch/:id', isAuthenticated, isAdmin, clientsController.accessClientAccount);

// Filter Routes
router.post('/filters/save', isAuthenticated, filterController.saveFilter);
router.post('/filters/edit', isAuthenticated, filterController.editFilter);
router.post('/filters/apply', isAuthenticated, filterController.applyFilter);

// Items Routes
router.get('/items/dashboard', isAuthenticated, itemController.getDashboard);
router.get('/items/reserved', isAuthenticated, itemController.getReservedItems);
router.get('/items/details', isAuthenticated, itemController.getItemDetails);
router.post('/items/reserve', isAuthenticated, itemController.reserveItem);
router.post('/items/remove-reservation', isAuthenticated, itemController.removeReservation);

// User Routes
router.get('/users/settings', isAuthenticated, userController.getSettings);
router.post('/users/settings', isAuthenticated, userController.updateSettings);
router.post('/users/assign-admin', isAuthenticated, userController.assignAdminToUser);

module.exports = router;