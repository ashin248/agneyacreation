const express = require('express');
const { getSystemAlerts, getCustomDesignStats, getGlobalStats, getTopSellingProducts } = require('../../controllers/dashboardController');

const router = express.Router();

// GET global system-wide KPIs
router.get('/stats/global', getGlobalStats);

// GET global system alert aggregations natively
router.get('/alerts', getSystemAlerts);

// GET aggregated custom design status statistics for charts
router.get('/stats/custom-designs', getCustomDesignStats);

// GET top selling products
router.get('/stats/top-products', getTopSellingProducts);

module.exports = router;
