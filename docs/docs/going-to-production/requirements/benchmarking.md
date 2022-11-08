---
id: benchmarking
title: Benchmarking
---

--------------------

## Hardware Requirements

- Hard Drive: 64 GB of free space or above.
- Memory (RAM): 4 GB or above.

## Benchmark Tool

Run Botpress with the `bench` command from the command line. You can run this on the Pro binary downloaded from the website. Make sure to adjust the `--url` and `--botId` to match your botpress server URL and your bot's ID. For more information on options, you can set for your test, run `./bp bench --help`.
![Performances Benchmark Tool](/assets/performances-benchmark.png)

### Example

Below is an example of the output from a benchmark test run on a new install of Botpress on localhost.

```bash
$ ./bp bench --url http://0.0.0.0:3000/ --botId test -u 1000
  Scenario: 1000 users sending 5 messages each
  Configured SLA: 100% of requests must be under 1500ms

[18:09:50] Messages Sent: 11, Avg: 7456ms
...
[18:10:53] Messages Sent: 4843, Avg: 12410ms

  Messages Sent: 5000 in 70.82s
  Average MPS: 70.6
  SLA Breached: true. 4767 messages were over configured SLA (95.34%)

  Request Latency:
    min: 53 ms
    avg: 12085 ms
    max: 62517 ms

  Codes:
    Timeout: 2172
    undefined: 429
    ECONNRESET: 411
    ECONNREFUSED: 1988
```

From the results:
- It took 70.82 seconds to send 5000 messages to the chatbot.
- 4767 messages took longer than 1500 ms to send to the chatbot.
- The minimum time it took for a request to be processed was 53 ms (average was 12085 ms, and the maximum was 62517 ms)
- Of the messages sent, the benchmark test received the following error codes
    - Timeout: 2172
    - undefined: 429
    - ECONNRESET: 411
    - ECONNREFUSED: 1988
    
You can also use [k6](https://k6.io/), a popular open-source load testing tool and SaaS for engineering teams.