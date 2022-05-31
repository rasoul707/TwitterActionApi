/* ----------------------------------------------------- */
/* Plugin Name           : Twitter-Action-Api            */
/* Author Name           : rasoul707                     */
/* File Name             : helper.js                     */
/* ----------------------------------------------------- */

const puppeteer = require('puppeteer');


const chromeOptions = {
    headless: true,
    defaultViewport: null,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
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

    return new Promise(async (resolve, reject) => {

        try {
            await page.goto(twitterLoginPageUrl, { timeout: 25000, waitUntil: 'domcontentloaded' }).catch((e) => { throw "load_failed" });

            await page.waitForSelector('input[name="text"]', { visible: true, timeout: 10000 }).catch((e) => { throw "username_failed" });
            await page.type('input[name="text"]', account[0]);

            await page.keyboard.press('Enter');

            await page.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 }).catch((e) => { throw "password_failed" });
            await page.type('input[name="password"]', account[1]);

            await page.keyboard.press('Enter');

            const nav1 = await page.waitForNavigation({ timeout: 10000, waitUntil: 'domcontentloaded' }).catch((e) => { return 'error' });

            if (nav1 === 'error' && page.url() === twitterLoginPageUrl) {
                const sec1 = await page.waitForSelector('input[name="text"][type="email"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error' });
                if (sec1 === 'error') {
                    throw "password_incorrect"
                }
                else {
                    await page.type('input[name="text"][type="email"]', account[2]);
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
    let result = []
    for (let i = 0; i < count; i++) {
        const random = Math.floor(Math.random() * list.length);
        if (!result.includes(list[random])) result.push(list[random]);
        else i--;
    }
    return result.join(" ")
}



const doTask = async (page, task, tags) => {

    return new Promise(async (resolve, reject) => {
        let fail = [];
        let actions = [];
        try {
            const task_username = task[0].split("/")[3]
            await page.goto(task[0], { timeout: 25000, waitUntil: 'domcontentloaded' }).catch((e) => { throw "load_failed" });
            await page.waitForSelector('article', { visible: true, timeout: 10000 }).catch((e) => { throw "tweet_failed" });

            // follow
            if (task[1]) {
                actions.push('follow')
                await page.click('[aria-label="Follow @' + task_username + '"]').catch((e) => { fail.push('follow') });
            }
            // like
            if (task[2]) {
                actions.push('like')
                await page.click('[aria-label="Like"]').catch((e) => { fail.push('like') });
            }
            // retweet
            if (task[3]) {
                actions.push('retweet')
                const ret = await page.click('[aria-label="Retweet"]').catch((e) => { return 'error'; });
                if (ret === 'error') {
                    fail.push('retweet');
                } else {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                }
            }
            // tag
            if (task[4]) {
                const text = chooseRandomTag(tags, task[5]) + " ";
                actions.push('tag')
                actions.push(task[5])
                const rep = await page.click('[aria-label="Reply"]').catch((e) => { return 'error'; });

                if (rep === 'error') {
                    fail.push('tag');
                } else {
                    const nav = await page.waitForSelector('[role="dialog"] [aria-label="Tweet text"]', { visible: true, timeout: 10000 }).catch((e) => { return 'error'; });
                    if (nav === 'error') {
                        fail.push('tag')
                    } else {
                        await page.keyboard.type(text, { delay: 100 });
                        await page.waitForTimeout(500);
                        await page.click('[role="dialog"] [data-testid="toolBar"] [role="button"]:not([aria-label])');
                        await page.waitForTimeout(1000);
                    }
                }
            }
            resolve({ actions, fail })
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