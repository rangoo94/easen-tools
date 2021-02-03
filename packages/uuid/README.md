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

Tests were running on MacBook Pro, early 2015 (Intel(R) Core(TM) i5-5257U CPU @ 2.70GHz, 8GB RAM).
Tested on Node.js v11.9.0.

## Observations

* `@easen-tools/uuid` binary implementation, even cryptographically secure, is much faster than anything else
* `@easen-tools/uuid` string implementation, even cryptographically secure, is fastest
  * `uuid-random` tends to be faster for string results
    * it's using buffers under the hood, but in cost of memory issues (slicing buffers instead of creating new)
  * it's far faster than `uuid`
  * cryptographically secure algorithm has similar performance as not secure
  * Implementation [embedded in Moleculer](https://github.com/moleculerjs/moleculer/blob/aab42e5accd3dded86e1dc341ab819f952fec378/src/utils.js#L37) is similar to unsafe string representation,
    so it has similar performance.

## Results

| Implementation                                           | Representation | Secure | ops/sec                     |
|----------------------------------------------------------|----------------|:------:|-----------------------------|
| **@easen-tools/uuid**                                    | binary         | ✔      | 33,246,642 ops/sec *±0.76%* |
| **@easen-tools/uuid**                                    | binary         | ✖      | 25,036,181 ops/sec *±0.59%* |
| [uuid-random](https://www.npmjs.com/package/uuid-random) | binary         | ✔      | 15,019,871 ops/sec *±0.69%* |
| [uuid-random](https://www.npmjs.com/package/uuid-random) | string         | ✔      | 10,446,971 ops/sec *±0.64%* |
| **@easen-tools/uuid**                                    | string         | ✔      | 5,606,790 ops/sec *±0.79%*  |
| [Moleculer (embedded)](https://github.com/moleculerjs/moleculer/blob/aab42e5accd3dded86e1dc341ab819f952fec378/src/utils.js#L37) | string         | ✖      | 4,999,143 ops/sec *±0.91%* |
| **@easen-tools/uuid**                                    | string         | ✖      | 4,998,117 ops/sec *±0.67%*  |
| ['uuid' module](https://www.npmjs.com/package/uuid)      | string         | ✔      | 1,152,845 ops/sec *±0.61%*  |
| ['uuid' module](https://www.npmjs.com/package/uuid)      | binary         | ✔      | 1,071,768 ops/sec *±2.32%*  |
| [fast-uuid](https://www.npmjs.com/package/fast-uuid)     | string         | ✖      | 807,137 ops/sec *±0.82%*    |

### Raw results

Raw results from [benchmark](benchmark), I have only sorted them from fastest to slowest.

```
02-easen-binary x 33,246,642 ops/sec ±0.76% (91 runs sampled)
01-easen-unsafe-binary x 25,036,181 ops/sec ±0.59% (92 runs sampled)
03-uuid-random-binary x 15,019,871 ops/sec ±0.69% (89 runs sampled)
07-uuid-random x 10,446,971 ops/sec ±0.64% (93 runs sampled)
05-easen x 5,606,790 ops/sec ±0.79% (91 runs sampled)
04-moleculer x 4,999,143 ops/sec ±0.91% (90 runs sampled)
06-easen-unsafe x 4,998,117 ops/sec ±0.67% (92 runs sampled)
09-node-uuid x 1,152,845 ops/sec ±0.61% (91 runs sampled)
08-node-uuid-binary x 1,071,768 ops/sec ±2.32% (79 runs sampled)
10-fast-uuid x 807,137 ops/sec ±0.82% (87 runs sampled)
```
