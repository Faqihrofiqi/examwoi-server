// src/routes/index.js
const express = require("express");
const router = express.Router();

const authRouter = require("./auth/auth.controller");
const facultyRouter = require("./faculties/faculties.controller");
const questionRouter = require("./questions/questions.controller");
const examProgressRouter = require("./examProgress/examProgress.controller");
const appConfigRouter = require("./appConfig/appConfig.controller");
const userRouter = require("./users/user.controller");
const examPackageRouter = require("./examPackages/examPackage.controller");

// Daftarkan semua router slice
router.use("/auth", authRouter);
router.use("/faculties", facultyRouter);
router.use("/questions", questionRouter);
router.use("/exam-progress", examProgressRouter);
router.use("/app-configs", appConfigRouter); 
router.use("/users", userRouter);
router.use("/exam-packages", examPackageRouter);

module.exports = router;
