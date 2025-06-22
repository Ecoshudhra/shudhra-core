const cron = require('cron');
const http = require('http');
const Citizen = require("../models/Citizen.model");

const keepAliveJob = new cron.CronJob("*/14 * * * *", function () {
    http
        .get(`${process.env.SERVER_URL}`, (res) => {
            if (res.statusCode === 200) {
                console.log('[CRON] ✅ Server ping successful');
            } else {
                console.log('[CRON] ⚠️ Server responded with status:', res.statusCode);
            }
        })
        .on('error', (err) => {
            console.error('[CRON ERROR] ❌ Error while pinging server:', err.message);
        });
});

const resetDailyReportCountJob = new cron.CronJob("0 0 * * *", async function () {
    try {
        const result = await Citizen.updateMany({}, { todaysReportCount: 0 });
        console.log(`[CRON] ✅ Reset todaysReportCount at midnight. Updated: ${result.modifiedCount}`);
    } catch (err) {
        console.error('[CRON ERROR] ❌ Failed to reset todaysReportCount:', err.message);
    }
}, null, false, 'Asia/Kolkata');

module.exports = {
    keepAliveJob,
    resetDailyReportCountJob,
};
