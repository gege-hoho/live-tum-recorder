# bbb-recorder

Bigbluebutton recordings export to `webm` or `mp4` & live broadcasting. This is an example how I have implemented BBB recordings to distibutable file.

1. Videos will be copy to `/var/www/bigbluebutton-default/record`. You can change value of `copyToPath` from `.env`.
3. Can be converted to `mp4`. Default `webm`
2. Specify bitrate to control quality of the exported video by adjusting `videoBitsPerSecond` property in `background.js`


### Dependencies

1. xvfb (`apt install xvfb`)
2. Google Chrome stable
3. npm modules listed in package.json
4. Everything inside `dependencies_check.sh` (run `./dependencies_check.sh` to install all)

The latest Google Chrome stable build should be use.

```sh
curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get -y update
apt-get -y install google-chrome-stable
```

### Usage

Clone the project first:

```javascript
git clone https://github.com/gege-hoho/live-tum-recorder
cd live-tum-recorder
npm install --ignore-scripts
```

### Recording

```sh
node export.js <Lecture ID> <Outputfile> <recording length in seconds>
```
Outputfile has to end with .webm
Use  VLC Player for displaying Video

### How it will work?
When you will run the command that time `Chrome` browser will be open in background & visit the link to perform screen recording. Later it will give you file as webm

### Thanks to

[bbb-recorder](https://github.com/jibon57/bbb-recorder).
[puppetcam](https://github.com/muralikg/puppetcam). Most of the parts were copied from there.
[Canvas-Streaming-Example](https://github.com/fbsamples/Canvas-Streaming-Example)
