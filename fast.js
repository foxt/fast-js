#!/usr/bin/env node

/**
Copyright © 2022 theLMGN

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const https = require("https");
const FAST_TOKEN = "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm";

// variable to define if user prefers IPv4 or IPv6
let preferedFamily;

/**
 * Gets a JSON object from a URL
 * @param {string} url The URL to get the JSON from
 * @returns {Promise<object>} The JSON object
 */
function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url,{family:preferedFamily}, res => {
            let data = "";
            res.on("data", chunk => {
                data += chunk;
            });
            res.on("end", () => {
                if (res.statusCode > 299 || res.statusCode < 200)
                    return reject(new Error(`Status code: ${res.statusCode} ` + data));
                resolve(JSON.parse(data));
            });
        });
    });
}

/**
 * Tests how long it takes to download a file from a server.
 * @param {string} url The URL to download from
 * @returns {Promise<{bytes: number, duration: number}>} The length of the file (bytes) and the duration (milliseconds) of the download
 */
function testDownload(url) {
    return new Promise((resolve, reject) => {
        https.get(url,{family:preferedFamily}, res => {
            var bytes = 0;
            var startTime = Date.now();
            res.on("data", chunk => {
                bytes += chunk.length;
            })
            res.on("end", () => {
                resolve({
                    bytes,
                    duration: Date.now() - startTime
                });
            })
        })
    });
}

/**
 * Runs a speedtest thread on a server.
 * @param {string} url The URL to run the speedtest on
 * @param {number} duration The duration of the speedtest (milliseconds)
 * @param {string?} name The name of the server, if present verbose logging will be enabled
 */
async function runThread(url, duration, name) {
    var endTime = process.uptime() + (duration / 1000);
    var results = {
        url, name,
        bytes: 0,
        duration: 0
    };
    //if (name) console.log(`[${name}] Running for ${duration}ms`);
    while (process.uptime() < endTime) {
        var result = await testDownload(url);
        if (name) console.log(`[${name}] Downloaded ${result.bytes} bytes in ${result.duration}ms`);
        results.bytes += result.bytes;
        results.duration += result.duration;
    }
    return results;
}


/**
 * Requests a list of servers
 * @param {number} amnt The amount of servers to request (max. 5)
 * @returns {Promise<{
 *  client: {
 *     ip: string,
 *     asn: string,
 *     location: { city: string, country: string }
 * },
 * targets: {
 *     name: string,
 *     url: string,
 *     location: { city: string, country: string },
 * }[]  
 * }>}
 */
function getFastServers(amnt) {
    return getJson(`https://api.fast.com/netflix/speedtest/v2?https=true&token=${FAST_TOKEN}&urlCount=${amnt}`);
}

async function runSpeedTest(serverCount,threadPerServer, duration, verbose) {
    var servers = await getFastServers(serverCount);
    if (verbose) servers.targets.forEach(target => target.name = target.url.replace("https://", "").replace(/.oca.ntflxvideo.net.+/,""));
    if (verbose) console.log ("We are " + servers.client.ip + " (AS" + servers.client.asn + ") in " + servers.client.location.city + ", " + servers.client.location.country);
    if (verbose) console.log("Testing against " + servers.targets.length + " servers (" +  servers.targets.map(t => t.location.city + ", " + t.location.country).join(", ") + ")");
    var threads = [];
    for (var server of servers.targets) {
        if (verbose) console.log ("Starting " + server.name + " (" + server.location.city + ", " + server.location.country + ")");
        for (var i = 0; i < threadPerServer; i++) {
            threads.push(runThread(server.url, duration, verbose ? server.location.city + ", " + server.location.country : undefined));
        }
    }
    var threadResults = await Promise.all(threads);
    var results = {
        bytes: 0,
        duration: 0,
        threadResults
    }
    for (var result of threadResults) {
        results.bytes += result.bytes;
        results.duration += (result.duration / threadResults.length);
    }
    if (verbose) {
        console.log("\n\n\n\n\n------\nDownloaded " + (results.bytes / 1000 /1000).toFixed(2) + "MB in " + (results.duration / 1000).toFixed(2) + "s");
        console.log("Average speed: " + ((results.bytes / (results.duration/1000)) * 8 / 1000 / 1000).toFixed(2) + " mbps");
        console.table(
            threadResults.sort((a,b) => (b.bytes / b.duration) - (a.bytes / a.duration))
            .map(r => {
                return {
                    location: r.name,
                    mb: (r.bytes / 1000 /1000).toFixed(2) + "MB",
                    duration: r.duration + "ms",
                    mbps: ((r.bytes / (r.duration/1000)) * 8 / 1000 / 1000).toFixed(2) + " mbps"
                }
            })
        )
    }
    return results;
}

if (require.main === module) {
    var arg = process.argv.shift();
    var opts = {
        serverCount: 5,
        threadPerServer: 1,
        duration: 5000,
        json: false,
        family: undefined,
    }
    while (arg) {
        if (arg === "-s") {
            opts.serverCount = parseInt(process.argv.shift());
        } else if (arg === "-t") {
            opts.threadPerServer = parseInt(process.argv.shift());
        } else if (arg === "-d") {
            opts.duration = parseInt(process.argv.shift()) * 1000;
        } else if (arg === "-f") {
            opts.family = parseInt(process.argv.shift());
        } else if (arg === "-j") {
            opts.json = true;
        } else if (arg === "--help") {
            console.log("Options:");
            console.log("  -s <number>  The amount of servers to test (default: 5)");
            console.log("  -t <number>  The amount of threads per server (default: 1)");
            console.log("  -d <number>  The duration of the test (default: 5)");
            console.log("  -f [4|6]     IP address family (IPv4/6) to use. If not specified, both will be used.");
            console.log("  -j           Output in JSON format");
            process.exit(0);
        }
        arg = process.argv.shift();
    }
    preferedFamily = opts.family;
    runSpeedTest(opts.serverCount, opts.threadPerServer, opts.duration, !opts.json).then(results => {
        if (opts.json) console.log(JSON.stringify(results));
    })
}

module.exports = {runSpeedTest, getFastServers};
