const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { keepAliveJob, resetDailyReportCountJob } = require("./src/config/cron.config") // ❌production 
const connectDB = require("./src/config/db.config");
const setupSocket = require("./src/config/socket.config");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// start jobs 
keepAliveJob.start()
resetDailyReportCountJob.start()

setupSocket(app);
const io = app.get("io");
const server = app.get("server");

app.get("/", (req, res) => res.send("welcome to the server"));

const adminRoute = require('./src/routes/admin.routes')(io);
app.use(`/${process.env.SERVER_STARTER_URL}/admin`, adminRoute);

const municipalityRoute = require('./src/routes/municipality.routes')(io);
app.use(`/${process.env.SERVER_STARTER_URL}/municipality/`, municipalityRoute);

const citizenRoute = require('./src/routes/citizen.routes')(io);
app.use(`/${process.env.SERVER_STARTER_URL}/citizen`, citizenRoute);

const garbageRoute = require('./src/routes/garbage.routes')(io);
app.use(`/${process.env.SERVER_STARTER_URL}/garbage`, garbageRoute);

const notificationRoute = require('./src/routes/notification.routes');
app.use(`/${process.env.SERVER_STARTER_URL}/notification`, notificationRoute);


// Start Server
connectDB().then(() => {
    server.listen(process.env.PORT, () => {
        console.log(`🚀 Server running at ${process.env.SERVER_URL}`);
    });
});
