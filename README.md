# fast-js
CLI & Node.js library for Netflix' fast.com speedtesting service

## Usage

### CLI

#### Simple usage
```sh
$ ./fast.js

Downloaded 550.50MB in 5.28s
Average speed: 834.09 mbps
┌─────────┬─────────────────┬────────────┬──────────┬───────────────┐
│ (index) │    location     │     mb     │ duration │     mbps      │
├─────────┼─────────────────┼────────────┼──────────┼───────────────┤
│    0    │ 'Kirk Ella, GB' │ '157.29MB' │ '5275ms' │ '238.54 mbps' │
│    1    │   'Hull, GB'    │ '157.29MB' │ '5689ms' │ '221.18 mbps' │
│    2    │   'hull, GB'    │ '131.07MB' │ '5717ms' │ '183.41 mbps' │
│    3    │   'HULL, GB'    │ '78.64MB'  │ '4693ms' │ '134.06 mbps' │
│    4    │  'London, GB'   │ '26.21MB'  │ '5026ms' │ '41.73 mbps'  │
└─────────┴─────────────────┴────────────┴──────────┴───────────────┘
```
#### Advanced options
```
$ /fast.js --help
Options:
  -s <number>  The amount of servers to test (default: 5)
  -t <number>  The amount of threads per server (default: 1)
  -d <number>  The duration of the test (default: 5)
  -f [4|6]     IP address family (IPv4/6) to use. If not specified, both will be used.
  -j           Output in JSON format
```
```sh 
$ ./fast.js -s 2 -t 3 -d 10
Downloaded 1048.58MB in 10.73s
Average speed: 781.73 mbps
┌─────────┬─────────────────┬────────────┬───────────┬───────────────┐
│ (index) │    location     │     mb     │ duration  │     mbps      │
├─────────┼─────────────────┼────────────┼───────────┼───────────────┤
│    0    │ 'Kirk Ella, GB' │ '183.50MB' │ '10375ms' │ '141.49 mbps' │
│    1    │ 'Kirk Ella, GB' │ '183.50MB' │ '10592ms' │ '138.60 mbps' │
│    2    │   'Hull, GB'    │ '183.50MB' │ '11004ms' │ '133.41 mbps' │
│    3    │   'Hull, GB'    │ '183.50MB' │ '11306ms' │ '129.84 mbps' │
│    4    │ 'Kirk Ella, GB' │ '157.29MB' │ '10270ms' │ '122.52 mbps' │
│    5    │   'Hull, GB'    │ '157.29MB' │ '10838ms' │ '116.10 mbps' │
└─────────┴─────────────────┴────────────┴───────────┴───────────────┘
```

#### JSON output
```
$ ./fast.js -j
{"bytes":524288000,"duration":5416.2,"threadResults":[{"url":"shortened","bytes":78643200,"duration":5093},{"url":"shortened","bytes":131072000,"duration":5604},{"url":"shortened","bytes":131072000,"duration":5449},{"url":"shortened","bytes":157286400,"duration":5582},{"url":"shortened","bytes":26214400,"duration":5353}]}
```

### Programatically
```
> require("./fast.js")
{
  runSpeedTest: [AsyncFunction: runSpeedTest],
  getFastServers: [Function: getFastServers]
}
> await require("./fast.js").getFastServers(amountOfServers)
{
  client: {
    ip: '123.456.789.123',
    asn: '12345',
    location: { city: 'Hull', country: 'GB' }
  },
  targets: [
    {
      name: 'https://...',
      url: 'https://...',
      location: { city: 'Hull', country: 'GB' }
    }
  ]
}
> await require("./fast.js").runSpeedTest(serverCount,threadPerServer, duration, verbose)
{
  bytes: 471859200,
  duration: 4610.2,
  threadResults: [
    {
      url: 'https://...',
      bytes: 78643200,
      duration: 4351
    },
    ...
  ]
}
```
