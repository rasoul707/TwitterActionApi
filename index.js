/* ----------------------------------------------------- */
/* Plugin Name           : Twitter-Action-Api            */
/* Author Name           : rasoul707                     */
/* File Name             : index.js                      */
/* ----------------------------------------------------- */

const express = require('express');
const UserAgent = require('user-agents');
const { newPage, lunchBrowser, login, doTask } = require('./helper');
const fs = require('fs');

const app = express();
app.use(express.json())


app.get('/', async (req, res) => {
    res.send('<body style="display: flex;align-items: center;justify-content: center;">if you want to be&nbsp;<b>Happy</b>, be&nbsp;<b>Happy</b></body>');
});


// ==> post
app.post('/run', async (req, res) => {
    const trpID = 'TRP_' + new Date().getTime();
    console.log('#' + trpID, 'New Tasks Received');
    const data = req.body;

    res.status(200).json({ ok: true, trpID });


    let result = [];

    // accounts
    for (let a = 0; a < data.accounts.length; a++) {
        const account = data.accounts[a];

        const useragent = new UserAgent({ "deviceCategory": "desktop" }).toString();
        const browser = await lunchBrowser();
        const _page = await newPage(browser, useragent);

        result.push({ account: account[0] });
        try {
            // login
            const stepLogin = await login(_page, account);
            result[a].ok = true;
            result[a].step = stepLogin;
            result[a].todo = [];

            // tasks
            for (let t = 0; t < data.tasks.length; t++) {
                result[a].todo.push({});
                try {
                    // do task
                    const task = data.tasks[t];
                    const _result = await doTask(_page, task, data.tags);
                    result[a].todo[t].ok = true;
                    result[a].todo[t].actions = _result.actions;
                    result[a].todo[t].fails = _result.fail;
                } catch (err) {
                    result[a].todo[t].ok = false;
                }
            }


        } catch (err) {
            result[a].ok = false;
            result[a].error = err;
        }

        await browser.close();
    }


    fs.writeFileSync("reports/" + trpID + ".json", JSON.stringify(result));
    console.log("#" + trpID, ": Finished")

});




app.get('/report/:trpID', async (req, res) => {
    const { trpID } = req.params
    fs.readFile("reports/" + trpID + ".json", { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            res.status(200).json({ ok: true, data: JSON.parse(data) });
        } else {
            res.status(404).json({ ok: false });
        }
    });
})



app.listen(7007, () => console.log('Server is running on 7007'));