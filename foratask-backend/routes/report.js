const express = require("express");
const router = express.Router();
const {adminReportSummaryPills, selfReportSummaryPills}= require("../controllers/reportController");

router.get("/admin-report-summary",adminReportSummaryPills);
router.get('/self-report-summary',selfReportSummaryPills);

module.exports=router;