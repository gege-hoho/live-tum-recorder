const puppeteer = require('puppeteer');
const Xvfb      = require('xvfb');
const fs = require('fs');
const os = require('os');
const homedir = os.homedir();
const platform = os.platform();

var xvfb        = new Xvfb({
    silent: true,
    xvfb_args: ["-screen", "0", "1280x800x24", "-ac", "-nolisten", "tcp", "-dpi", "96", "+extension", "RANDR"]
});
const width       = 1280;
const height      = 720;
const overview_url = "https://live.rbg.tum.de/cgi-bin/streams"
var options     = {
  headless: false,
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

if(platform === "linux"){
    options.executablePath = "/usr/bin/google-chrome"
}else{
    process.exit(1);
}

async function main() {
    let browser, page;

    try{
        //xvfb.startSync()

        var lec_name = process.argv[2];
        if(!lec_name){
            console.warn('Lecture name undefined!');
            process.exit(1);
        }

        var exportname = process.argv[3];

        var duration = process.argv[4];
        // If duration isn't defined, set it in 0
        if(!duration){
            duration = 0;
        // Check if duration is a natural number
        }else if(!Number.isInteger(Number(duration)) || duration < 0){
            console.warn('Duration must be a natural number!');
            process.exit(1);
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
        // Catch URL unreachable error
        /*await page.goto(overview_url, {waitUntil: 'networkidle2'}).catch(e => {
            console.error('Recording URL unreachable!');
            process.exit(2);
        })*/
        await page.goto(overview_url)
        await page.setBypassCSP(true)


        //Check if there are livestreams
        const found = await page.evaluate(() => window.find("Aktive Livestreams"));
        if(!found){
            console.error("no live streams")
            process.exit(2);
        }
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
        let link = undefined;
        for(const curr of links){
            if (curr.text.includes(lec_name)){
                link =  curr.link;
            }
        }
        if (!link){
            console.error("cannot find: " + lec_name)
            process.exit(2);
        }
        console.log(link)
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
        //xvfb.stopSync()
    }
}

main()

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
