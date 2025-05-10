const express = require("express");
const {
  getRecommendationsForAttempt,
  getUserRecommendations
} = require("../controllers/courseRecommendationController");

const router = express.Router();

// Course recommendation routes
router.get("/attempt/:attemptId", getRecommendationsForAttempt);
router.get("/user/:userId", getUserRecommendations);

module.exports = router;
