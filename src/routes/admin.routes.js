const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const adminController = require("../controllers/admin.controller");
const { authAdminuser } = require("../middleware/admin.auth");
const router = Router();

// login admin api
router.post("/login", asyncHandler(adminController.loginAdmin));

// Admin change-passowrd API
router.post(
  "/changePassword",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.changeAdminPassword)
);

//get All User API
router.get(
  "/getAllUser/:page/:limit",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.getAllUser)
);

//get All Transaction API
router.get(
  "/getAllTransaction/:page/:limit",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.getAllTransaction)
);

//get All Fees API
router.get(
  "/getAllFees/:page/:limit",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.getAllFees)
);

//get  User API
router.get(
  "/getUser/:userId",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.getUser)
);

//user Search API
router.get(
  "/userSearch/:email",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.searchUserByEmail)
);

//Search Transactions by tx or wallet
router.get(
  "/searchTransaction/:keyword",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.searchTransaction)
);

//Active & inactive user
router.put(
  "/userStatus/:userId/:status",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.toggleUserStatus)
);

router.delete(
  "/deleteuser/:userId",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.deleteUser)
);

// get all deshbord state
router.get(
  "/getDashboardStats",
  asyncHandler(authAdminuser),
  asyncHandler(adminController.getDashboardUserStats)
);

module.exports = router;
