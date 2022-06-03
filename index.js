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

    /*

    data = {
        accounts: [
            [id, username, password, email],
        ],
        tasks: [
            [
                id,
                url,
                .
                .
                .

            ],
        ],
        tags: [...]
    }



    result = {
        accounts: [
            {
                ok: ok,
                id: id,
                step: ,
                error,
            }
        ],
        accountTasks: [
            {
                ok: true,
                taskID: taskID,
                accountID: accountID,
                actions,
                fails,
            }
        ]

    }


    */


    let result = { accounts: [], accountTasks: [] };

    // accounts
    for (let a = 0; a < data.accounts.length; a++) {
        const account = data.accounts[a];

        const useragent = new UserAgent({ "deviceCategory": "desktop" }).toString();
        const browser = await lunchBrowser();
        const _page = await newPage(browser, useragent);

        result.accounts.push({ id: account[0] });

        try {
            // login
            const stepLogin = await login(_page, account);
            result.accounts[a].ok = true;
            result.accounts[a].step = stepLogin;

            // tasks
            for (let t = 0; t < data.tasks.length; t++) {
                const task = data.tasks[t];

                result.accountTasks.push({ accountID: account[0], taskID: task[0] })
                try {
                    // do task
                    const _result = await doTask(_page, task, data.tags);
                    result.accountTasks[result.accountTasks.length - 1].ok = true;
                    result.accountTasks[result.accountTasks.length - 1].actions = _result.actions.join(",");
                    result.accountTasks[result.accountTasks.length - 1].fails = _result.fails.join(",");
                } catch (err) {
                    result.accountTasks[result.accountTasks.length - 1].ok = false;
                }
            }


        } catch (err) {
            result.accounts[a].ok = false;
            result.accounts[a].error = err;
        }

        await browser.close();
    }

    // return res.json(result)


    fs.writeFileSync("reports/" + trpID + ".json", JSON.stringify(result));
    console.log("#" + trpID, ": Finished")

});




app.get('/report/:trpID', async (req, res) => {
    const { trpID } = req.params
    fs.readFile("reports/" + trpID + ".json", { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            res.status(200).json({ ok: true, data: JSON.parse(data) });
        } else {
            res.status(404).json({ ok: false, code: "report_not_found" });
        }
    });
})



app.listen(7007, () => console.log('Server is running on 7007'));