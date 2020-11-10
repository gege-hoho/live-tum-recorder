const puppeteer = require('puppeteer');
const Xvfb      = require('xvfb');
const schedule = require('node-schedule');
const dotenv = require("dotenv");
const fs = require('fs');
const os = require('os');
const homedir = os.homedir();

var xvfb        = new Xvfb({
    silent: true,
    xvfb_args: ["-screen", "0", "1280x800x24", "-ac", "-nolisten", "tcp", "-dpi", "96", "+extension", "RANDR"]
});
const width       = 1280;
const height      = 720;
const overview_url = "https://live.rbg.tum.de/cgi-bin/streams"
const login_url = "https://live.rbg.tum.de/cgi-bin/login.pl"
var options     = {
    headless: false,
    executablePath : "/usr/bin/google-chrome",
    args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--auto-select-desktop-capture-source=bbbrecorder',
    '--load-extension=' + __dirname +'/extensions',
    '--disable-extensions-except=' + __dirname +'/extensions',
    '--disable-infobars',
    '--no-sandbox',
    '--shm-size=1gb',
    '--disable-dev-shm-usage',
    '--start-fullscreen',
    '--app=https://www.google.com/',
    `--window-size=${width},${height}`,
  ],
}

function main(){
    if(process.argv[2]==="--no_schedule"){
        const lec_name = process.argv[3];
        const export_name = process.argv[4];
        const duration = process.argv[5];
        record(lec_name,export_name,duration)
    }
    else {
        let jobs = JSON.parse(fs.readFileSync('jobs.json'));
        jobs.jobs.forEach((job)=>{
            console.log("Schedule Job: " + job.name)
            schedule.scheduleJob(job.start,function(job) {
                date = new Date().toISOString().slice(0, 10)
                console.log('Start recording:' +date+'_'+job.code+'.webm')
                record(job.code,date+'_'+job.code+'.webm', job.duration*60)
            }.bind(null,job))
        })
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function record(lec_name,exportname,duration) {
    let browser, page;
    const result = dotenv.config();

    if (result.error) {
        throw result.error;
    }

    if(process.env.TUM_USER===""){
        console.log("you have to specify a TUM_USER in the .env file")
        return
    }
    if(process.env.TUM_PW===""){
        console.log("you have to specify a TUM_PW in the .env file")
        return
    }

    try{
        xvfb.startSync()
        if(!lec_name){
            console.warn('Lecture name undefined!');
            return;
        }
        // If duration isn't defined, set it in 0
        if(!duration){
            duration = 0;
        // Check if duration is a natural number
        }else if(!Number.isInteger(Number(duration)) || duration < 0){
            console.warn('Duration must be a natural number!');
            return;
        }
        console.log("Search for: " + lec_name)
        browser = await puppeteer.launch(options)
        const pages = await browser.pages()

        page = pages[0]

        page.on('console', msg => {
            var m = msg.text();
            console.log('PAGE LOG:', m) // uncomment if you need
        });
        await page._client.send('Emulation.clearDeviceMetricsOverride')

        //login
        await page.goto(login_url)
        await page.$eval('input[name=login]', (el,user) => el.value = user, process.env.TUM_USER);
        await page.$eval('input[name=password]', (el,pw) => el.value = pw, process.env.TUM_PW);
        await page.$eval('input[name="cookies"]', check => check.checked = true);
        await page.click('input[type=submit]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' })
        let link;
        while(true){
            await page.goto(overview_url)
            await page.setBypassCSP(true)

            const links = await page.evaluate(()=>{
                let links = []
                let sel = document.querySelector('ul').getElementsByTagName('a')
                for(const curr of sel){
                    links.push({
                        link: curr.href,
                        text: curr.innerText
                    })
                }
                return links
            })
            for(const curr of links){
                if (curr.text.includes(lec_name)){
                    link =  curr.link;
                }
            }
            if (!link){
                console.log("cannot find: " + lec_name)
                console.log("wait 1 mintue and try again")
                await sleep(60*1000)
                continue
            }
            break
        }

        console.log("Found link: "+ link + "/COMB")
        await page.goto(link + "/COMB")


        await page.click('button[id=mute1]', {waitUntil: 'domcontentloaded'});
        await page.click('button[id=full-screen1]', {waitUntil: 'domcontentloaded'});

        await page.evaluate((x) => {
            console.log("REC_START");
            window.postMessage({type: 'REC_START'}, '*')
        })

        // Perform any actions that have to be captured in the exported video
        await page.waitFor((duration * 1000))

        await page.evaluate(filename=>{
            window.postMessage({type: 'SET_EXPORT_PATH', filename: filename}, '*')
            window.postMessage({type: 'REC_STOP'}, '*')
        }, exportname)

        // Wait for download of webm to complete
        await page.waitForSelector('html.downloadComplete', {timeout: 0})

        copyOnly(exportname)

    }catch(err) {
        console.log(err)
    } finally {
        page.close && await page.close()
        browser.close && await browser.close()
        xvfb.stopSync()
    }
}
function copyOnly(filename){

    var copyFrom = homedir + "/Downloads/" + filename;
    var copyTo = __dirname +'/out/' + filename;

    try {

        fs.copyFileSync(copyFrom, copyTo)
        console.log('successfully copied ' + copyTo);

        fs.unlinkSync(copyFrom);
        console.log('successfully delete ' + copyFrom);
    } catch (err) {
        console.log(err)
    }
}
main()