# tum-live-recorder

Records videos from https://live.rbg.tum.de/cgi-bin/streams

## Dependencies

1. Running Linux (If you're on Windows, WSL2 could work)
2. xvfb `apt install xvfb`
3. Google Chrome stable
4. npm modules listed in package.json `npm install --ignore-scripts`

## Usage
Here the two ways to use the program. 
Either you schedule the time, a recording will be started 
or you start directly a recording. 
If you schedule a recording, the program needs to keep running in order to record on the given time 
### General
The program logs in with your TUM account because some videos are only available to logged in Users.
For this copy the content of `example.env` into the `.env` file and fill in your TUM user and password.  
### Recording without Scheduling
```sh
node export.js --no_schedule <Lecture ID> <filenamename> <recording length in minutes>
```
Outputfile has to end with .webm and lands in `./out/<filename>`

Use  VLC Player for displaying Video other Players might not show the image

### Recording with Scheduling
Remove all existing example jobs from `jobs.json` and write your own accordingly:

Here is an example job:
```
    "name":"Test",
    "code": "IN567",
    "duration": 60,
    "start": "0 * * * * 2"
```
The `name` parameter can be freely chosen its only for logging. \
The `code` parameter resembles the Lecture code by which the Lecture is found on the Page\
The `duration` parameter defines the length of the recording in minutes. To account for too long lectures maybe add some minutes\
The `start` parameter defines the time the lecture recording should run and uses cron format:
```
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
```

Start now the script or put it in your autostart, whatever you want
```sh
node export.js
```
Outputfile has to end with .webm and lands in `./out/<filename>`

Use  VLC Player for displaying Video other Players might not show the image


### How does it work?
-Starts a xvfb (Virtual Framebuffer) \
-Launches Google Chrome in there, which gets controlled by Pupeteer\
-Records the Screen and saves it to a webm

### Thanks to

[bbb-recorder](https://github.com/jibon57/bbb-recorder). Gave me the inspiration and was used as a basis\
[puppetcam](https://github.com/muralikg/puppetcam). Most of the parts were copied from there.\
[Canvas-Streaming-Example](https://github.com/fbsamples/Canvas-Streaming-Example)
