/* ----------------------------------------------------- */
/* Plugin Name           : Twitter-Action-Api            */
/* Author Name           : rasoul707                     */
/* File Name             : helper.js                     */
/* ----------------------------------------------------- */

const puppeteer = require('puppeteer');


const chromeOptions = {
    headless: true,
    defaultViewport: null,
    // executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: [
        "--incognito",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
    ],
};

const blockedResourceTypes = [
    'image',
    'media',
    'font',
    'texttrack',
    'object',
    'beacon',
    'csp_report',
    'imageset',
];

const skippedResources = [
    'quantserve',
    'adzerk',
    'doubleclick',
    'adition',
    'exelator',
    'sharethrough',
    'cdn.api.twitter',
    'google-analytics',
    'googletagmanager',
    'google',
    'fontawesome',
    'facebook',
    'analytics',
    'optimizely',
    'clicktale',
    'mixpanel',
    'zedo',
    'clicksor',
    'tiqcdn',
];





const lunchBrowser = async () => {
    return await puppeteer.launch(chromeOptions);
}


const newPage = async (browser, useragent) => {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.setRequestInterception(true);
    await page.setUserAgent(useragent);
    await page.setViewport({
        width: 1920,
        height: 1080,
    });
    page.on('request', request => {
        const requestUrl = request._url.split('?')[0].split('#')[0];
        if (
            blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
            skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
        ) {
            request.abort();
        } else {
            request.continue();
        }
    });
    return page
}





const acceptCookie = async (page) => {
    const s = '.css-1dbjc4n.r-eqz5dr.r-1joea0r.r-1r5su4o [role="button"]';
    await page.waitForSelector(s, { visible: true, timeout: 5000 })
        .then(async () => {
            await page.click(s);
        })
        .catch((e) => { return; });
}



const login = async (page, account) => {

    const twitterLoginPageUrl = 'https://twitter.com/i/flow/login';
    let step = '';

    const id = account[0];
    const username = account[1];
    const password = account[2];
    const email = account[3];


    return new Promise(async (resolve, reject) => {

        try {
            await page.goto(twitterLoginPageUrl, { timeout: 25000, waitUntil: 'domcontentloaded' }).catch((e) => { throw "load_failed" });

            await page.waitForSelector('input[name="text"]', { visible: true, timeout: 10000 }).catch((e) => { throw "username_failed" });
            await page.type('input[name="text"]', username);

            await page.keyboard.press('Enter');

            await page.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 }).catch((e) => { throw "password_failed" });
            await page.type('input[name="password"]', password);

            await page.keyboard.press('Enter');

            const nav1 = await page.waitForNavigation({ timeout: 10000, waitUntil: 'domcontentloaded' }).catch((e) => { return 'error' });

            if (nav1 === 'error' && page.url() === twitterLoginPageUrl) {
                const sec1 = await page.waitForSelector('input[name="text"][type="email"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' });
                if (sec1 === 'error') {
                    throw "password_incorrect"
                }
                else {
                    await page.type('input[name="text"][type="email"]', email);
                    await page.keyboard.press('Enter');
                    const nav2 = await page.waitForNavigation({ timeout: 10000, waitUntil: 'domcontentloaded' }).catch((e) => { return 'error' });
                    if (nav2 === 'error' && page.url() === twitterLoginPageUrl) {
                        // *************************
                        throw "must_verify_email"
                        // *************************
                    }
                    else {
                        step = "email";
                    }
                }
            } else {
                step = "password";
            }

            await acceptCookie(page);


            resolve(step);

        } catch (error) {

            reject(error);
        }
    });
}




const chooseRandomTag = (list, count) => {

    if (typeof list !== 'object') {
        list = list.replaceAll("\n", "");
        list = list.replaceAll(",", "");
        list = list.replaceAll(" ", "");
        list = list.split("@");
        list.splice(0, 1);
        list = list.map((e) => '@' + e);
    }


    let result = []
    for (let i = 0; i < count; i++) {
        const random = Math.floor(Math.random() * list.length);
        if (!result.includes(list[random])) result.push(list[random]);
        else i--;
    }
    return result.join(" ")
}



const doTask = async (page, task, tags) => {

    const id = task[0];
    const url = task[1];
    const follow = task[2];
    const like = task[3];
    const retweet = task[4];
    const tag = task[5];
    const tagCount = task[6];

    return new Promise(async (resolve, reject) => {
        let fails = [];
        let actions = [];
        try {
            const task_username = url.split("/")[3]
            await page.goto(url, { timeout: 25000, waitUntil: 'domcontentloaded' }).catch((e) => { throw "load_failed" });
            await page.reload({ waitUntil: "domcontentloaded" });
            await page.waitForSelector('article', { visible: true, timeout: 10000 }).catch((e) => { throw "tweet_failed" });
            await page.waitForTimeout(2000);

            // follow
            if (follow) {
                actions.push('follow');

                if (await page.click('[aria-label="Follow @' + task_username + '"]').catch((e) => { return 'error' }) === 'error') {
                    if (await page.waitForSelector('[aria-label="Following @' + task_username + '"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' }) === 'error') {
                        fails.push('follow');
                    }
                } else {
                    await page.waitForTimeout(500);
                    if (await page.waitForSelector('[aria-label="Following @' + task_username + '"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' }) === 'error') {
                        fails.push('follow');
                    }
                }
                await page.waitForTimeout(1000);
            }
            // like
            if (like) {
                actions.push('like');

                if (await page.click('[aria-label="Like"]').catch((e) => { return 'error' }) === 'error') {
                    if (await page.waitForSelector('[aria-label="Liked"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' }) === 'error') {
                        fails.push('like');
                    }
                } else {
                    await page.waitForTimeout(500);
                    if (await page.waitForSelector('[aria-label="Liked"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' }) === 'error') {
                        fails.push('like');
                    }
                }
                await page.waitForTimeout(1000);
            }
            // retweet
            if (retweet) {
                actions.push('retweet')

                if (await page.click('[aria-label="Retweet"]').catch((e) => { return 'error' }) === 'error') {
                    if (await page.waitForSelector('[aria-label="Retweeted"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' }) === 'error') {
                        fails.push('retweet');
                    }
                } else {
                    await page.waitForTimeout(1000);
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(1000);
                    if (await page.waitForSelector('[aria-label="Retweeted"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' }) === 'error') {
                        fails.push('retweet');
                    }
                }
                await page.waitForTimeout(1000);
            }
            // tag
            if (tag) {
                const text = chooseRandomTag(tags, tagCount) + " ";
                actions.push('tag')

                if (await page.click('[aria-label="Reply"]').catch((e) => { return 'error' }) === 'error') {
                    fails.push('tag');
                } else {
                    if (await page.waitForSelector('[role="dialog"] [aria-label="Tweet text"]', { visible: true, timeout: 20000 }).catch((e) => { return 'error' }) === 'error') {
                        fails.push('tag');
                    } else {
                        await page.waitForTimeout(1000);
                        await page.keyboard.type(text, { delay: 100 });
                        await page.waitForTimeout(500);
                        await page.click('[role="dialog"] [data-testid="toolBar"] [data-testid="tweetButton"]');
                        await page.waitForTimeout(1000);
                    }
                }
                await page.waitForTimeout(1000);
            }
            resolve({ actions, fails })
        }
        catch (error) {
            reject(error);
        }
    });
}







module.exports = {
    lunchBrowser,
    newPage,
    login,
    doTask
};