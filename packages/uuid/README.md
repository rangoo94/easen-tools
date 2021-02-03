# @easen-tools: UUID v4 generator

Generate fast and cryptographically secure [UUID v4](https://en.wikipedia.org/wiki/Universally_unique_identifier) (RFC-4122 compliant).

This implementation combines multiple ways of UUID generation,
to achieve **best performance and security**.

Works in both browser and in Node.js environment (with zero dependencies).

## What is UUID v4?

[UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) is **u**niversally **u**nique **id**entifier, what describes itself.

UUID is a 128-bit number (with string representation), which should ([in practice](https://en.wikipedia.org/wiki/Universally_unique_identifier#Collisions)) be unique.

There are multiple UUID versions, which differ by ID generation input data:

* Version 1: uses date-time (clock time) and MAC address for generation
* Version 2: same as version 1 + 4 bytes of local domain
* Version 3: namespace and input hashed with MD5
* **Version 4: random value**
* Version 5: similar to version 3 but with SHA1

It's a nice way of generating identifiers (especially in distributed systems),
which has pretty low chance to [not be really unique](https://en.wikipedia.org/wiki/Universally_unique_identifier#Collisions). 

You probably would not like to use it in nuclear bomb software,
but it's reasonable to use it in regular applications.

### Random bytes generation

`Math.random` is not generating cryptographically secure random numbers [(link)](https://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure),
so when you want to have more likely random numbers, you should use Crypto API for that purpose.

For generating random bytes it use either:

* [Web Crypto API](https://caniuse.com/#feat=getrandomvalues)
* [Node.js Crypto API](https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback)
* Math.random (when Crypto is not available, or unsafe is used directly)

## How to install

Package is available on [NPM](https://www.npmjs.com/package/@easen-tools/uuid):

`npm install @easen-tools/uuid`

## How to use it

There are 5 methods exposed:

```js
const uuid = require('@easen-tools/uuid')

// Generate cryptographically secure UUID v4
uuid.generate() // "52c8c225-435c-4a6f-a2f6-059cb1b0a5d3"

// Generate cryptographically secure binary UUID v4
uuid.generate.bin() // [ 122, 178, 72, 225, 142, 146, 70, 162, 169, 19, 108, 24, 83, 126, 16, 14 ]

// Generate not safe UUID v4
uuid.generateUnsafe() // "86d46c37-66a7-43c4-9191-7704ace0fceb"

// Generate not safe binary UUID v4
uuid.generateUnsafe.bin() // [ 226, 66, 103, 150, 199, 203, 70, 142, 180, 12, 7, 191, 251, 222, 101, 174 ]

// Test if it's valid UUID v4
const a = '7300adec-f3b7-47b6-b958-0f91b781ee73'
const b = '7300adec-f3b7-37b6-b958-0f91b781ee73'
const c = 'blah blah blah'
uuid.test(a) // true
uuid.test(b) // false
uuid.test(c) // false
```

## Benchmark

Benchmark code is available in [benchmark](benchmark) directory.

Tests were running on MacBook Pro, 2018 (Intel(R) Core(TM) i5-8259U CPU @ 2.30GHz, 16GB RAM).
Tested on Node.js v15.8.0.

## Observations

* It's far faster than any other library
  * 2-3 times faster than `uuid-random`
  * over 6 times faster than native `Crypto.randomUUID`
  * 20-30 times faster than `uuid` module
* In newer Node.js, cryptographically secure algorithm is even faster than unsafe

## Results

| Implementation                                           | Representation | Secure | ops/sec                     |
|----------------------------------------------------------|----------------|:------:|-----------------------------|
| **@easen-tools/uuid**                                    | binary         | ✔      | 38,770,508 ops/sec *±0.90%* |
| **@easen-tools/uuid**                                    | binary         | ✖      | 26,632,001 ops/sec *±0.75%* |
| **@easen-tools/uuid**                                    | string         | ✔      | 20,020,123 ops/sec *±0.58%* |
| [uuid-random](https://www.npmjs.com/package/uuid-random) | binary         | ✔      | 16,171,541 ops/sec *±0.80%* |
| **@easen-tools/uuid**                                    | string         | ✖      | 13,117,311 ops/sec *±0.65%* |
| [uuid-random](https://www.npmjs.com/package/uuid-random) | string         | ✔      | 10,966,767 ops/sec *±0.82%* |
| [Moleculer (embedded)](https://github.com/moleculerjs/moleculer/blob/aab42e5accd3dded86e1dc341ab819f952fec378/src/utils.js#L37) | string         | ✖      | 5,894,184 ops/sec *±0.60%* |
| [Crypto.randomUUID](https://nodejs.org/api/crypto.html#crypto_crypto_randomuuid_options) | string         | ✔      | 3,901,747 ops/sec *±1.00%* |
| ['uuid' module](https://www.npmjs.com/package/uuid)      | string         | ✔      | 1,157,118 ops/sec *±2.35%*  |
| ['uuid' module](https://www.npmjs.com/package/uuid)      | binary         | ✔      | 878,645 ops/sec *±3.40%*    |
| [fast-uuid](https://www.npmjs.com/package/fast-uuid)     | string         | ✖      | 843,504 ops/sec *±0.55%*    |
| [Crypto.randomUUID](https://nodejs.org/api/crypto.html#crypto_crypto_randomuuid_options) (without cache) | string         | ✔      | 349,835 ops/sec *±6.38%* |

### Raw results

Raw results from [benchmark](benchmark), I have only sorted them from fastest to slowest.

```
02-easen-binary x 38,770,508 ops/sec ±0.90% (88 runs sampled)
01-easen-unsafe-binary x 26,632,001 ops/sec ±0.75% (91 runs sampled)
05-easen x 20,020,123 ops/sec ±0.58% (92 runs sampled)
03-uuid-random-binary x 16,171,541 ops/sec ±0.80% (90 runs sampled)
06-easen-unsafe x 13,117,311 ops/sec ±0.65% (92 runs sampled)
07-uuid-random x 10,966,767 ops/sec ±0.82% (93 runs sampled)
04-moleculer x 5,894,184 ops/sec ±0.60% (93 runs sampled)
11-crypto-random-uuid x 3,901,747 ops/sec ±1.00% (91 runs sampled)
09-node-uuid x 1,157,118 ops/sec ±2.35% (93 runs sampled)
08-node-uuid-binary x 878,645 ops/sec ±3.40% (77 runs sampled)
10-fast-uuid x 843,504 ops/sec ±0.55% (96 runs sampled)
12-crypto-random-uuid-no-cache x 349,835 ops/sec ±6.38% (77 runs sampled)
```
