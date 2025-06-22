const cron = require('cron')
const https = require('http')

const job = new cron.CronJob("*/14 * * * * ", function () {
    https
        .get(`${process.env.SERVER_URL}/${process.env.SERVER_STARTER_URL}`, (res) => {
            if (res.statusCode === 200) console.log('API is working');
            else console.log('API is not working', res.statusCode);
        })
        .on('error', (err) => { console.error('Error while sending request:', err); })
})

module.exports = job