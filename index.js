/* ----------------------------------------------------- */
/* Plugin Name           : Twitter-Action-Api            */
/* Author Name           : rasoul707                     */
/* File Name             : index.js                      */
/* ----------------------------------------------------- */

const express = require('express');
const UserAgent = require('user-agents');
const { newPage, lunchBrowser, login, doTask } = require('./helper');
const fs = require('fs');
const { record } = require('puppeteer-recorder');
const app = express();
app.use(express.json())


app.get('/', async (req, res) => {
    res.send('<body style="display: flex;align-items: center;justify-content: center;">if you want to be&nbsp;<b>Happy</b>, be&nbsp;<b>Happy</b></body>');
});


// ==> post
app.post('/run', async (req, res) => {
    const trpID = 'TRP_' + new Date().getTime();
    console.log(new Date(), '#' + trpID, 'New Tasks Received');
    const data = req.body;

    res.status(200).json({ ok: true, trpID });

    console.log(data);


    let result = { accounts: [], accountTasks: [] };

    // accounts
    for (let a = 0; a < data.accounts.length; a++) {
        const account = data.accounts[a];

        const useragent = new UserAgent({ "deviceCategory": "desktop" }).toString();
        const browser = await lunchBrowser();

        result.accounts.push({ id: account[0] });

        try {
            // login
            const _page0 = await newPage(browser, useragent);

            /****/
            const _v0 = trpID + '-' + account[0] + '-' + 'login';
            await record({
                browser: browser,
                page: _page0,
                output: _v0 + '.webm',
                fps: 30,
                frames: 30 * 30,
                prepare: function () { },
                render: function () { }
            });
            console.log(_v0);
            /****/

            const stepLogin = await login(_page0, account);
            await _page0.close();
            result.accounts[a].ok = true;
            result.accounts[a].step = stepLogin;



            // tasks
            for (let t = 0; t < data.tasks.length; t++) {
                const task = data.tasks[t];

                result.accountTasks.push({ accountID: account[0], taskID: task[0] })

                try {
                    // do task
                    const _page1 = await newPage(browser, useragent);

                    // /****/
                    // const _v1 = trpID + '-' + account[0] + '-' + task[0];
                    // await record({
                    //     browser: browser,
                    //     page: _page1,
                    //     output: _v1 + '.webm',
                    //     fps: 30,
                    //     frames: 30 * 5,
                    //     prepare: function () { },
                    //     render: function () { }
                    // });
                    // console.log(_v1);
                    // /****/

                    const _result = await doTask(_page1, task, data.tags);
                    await _page1.close();
                    result.accountTasks[result.accountTasks.length - 1].ok = true;
                    result.accountTasks[result.accountTasks.length - 1].actions = _result.actions.join(",");
                    result.accountTasks[result.accountTasks.length - 1].fails = _result.fails.join(",");
                } catch (err) {
                    result.accountTasks[result.accountTasks.length - 1].ok = false;
                    let allactions = []
                    if (task[2]) allactions.push('follow');
                    if (task[3]) allactions.push('like');
                    if (task[4]) allactions.push('retweet');
                    if (task[5]) allactions.push('tag');
                    result.accountTasks[result.accountTasks.length - 1].actions = allactions.join(",");
                    result.accountTasks[result.accountTasks.length - 1].fails = allactions.join(",");
                }
            }


        } catch (err) {
            result.accounts[a].ok = false;
            result.accounts[a].error = err;
        }

        await browser.close();
    }

    fs.writeFileSync("reports/" + trpID + ".json", JSON.stringify(result));

    console.log(new Date(), "#" + trpID, ": Finished")
    console.log(result);

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



/******************************/

app.get('/video/:vid', async (req, res) => {
    const { vid } = req.params
    fs.readFile(vid + ".webm", { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            res.send(data);
        } else {
            res.status(404).json({ ok: false, code: "video_not_found" });
        }
    });
});

/*******************************/


app.listen(7007, () => console.log('Server is running on 7007'));