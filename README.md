# @qiwi/deep-proxy
Deep proxy implementation for TypeScript

[![Build Status](https://travis-ci.com/qiwi/deep-proxy.svg?branch=master)](https://travis-ci.com/qiwi/deep-proxy)
[![David](https://img.shields.io/david/qiwi/deep-proxy)](https://david-dm.org/qiwi/deep-proxy)
[![Maintainability](https://api.codeclimate.com/v1/badges/b8bb8d6c35bc74c123a5/maintainability)](https://codeclimate.com/github/qiwi/deep-proxy/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/b8bb8d6c35bc74c123a5/test_coverage)](https://codeclimate.com/github/qiwi/deep-proxy/test_coverage)
[![npm (scoped)](https://img.shields.io/npm/v/@qiwi/deep-proxy)](https://www.npmjs.com/package/@qiwi/deep-proxy)

## Install
```shell script
npm i @qiwi/deep-proxy
yarn add @qiwi/deep-proxy
```

## Key features
* Single proxy handler with rich context instead of trap map
* Proxy self-reference in handler context (meaningful for methods binding)
* JS, TS and Flow support
* Directive shortcuts
* Nested proxies caching

## Usage
```typescript
import {DeepProxy} from '@qiwi/deep-proxy'

const target = {foo: 'bar', a: {b: 'c'}}
const proxy = new DeepProxy(target, ({trapName, value, key, DEFAULT, NEXT}: THandlerContext) => {
  if (trapName === 'set') {
    throw new TypeError('target is immutable')
  }

  if (trapName === 'get') {
    if (typeof value === 'object' && value !== null) {
      return PROXY
    }

    if (key === 'd') {
      return 'baz'
    }

    return 'qux'
  }

  return DEFAULT
})

proxy.foo       // qux
proxy.a.b       // qux
proxy.bar       // qux
proxy.d         // baz
proxy.a = 'a'   // TypeError
```
FP adepts may use `createDeepProxy` factory instead of `DeepProxy` class. Note, the `handler` goes as the first argument.
```ts
import {createDeepProxy} from '@qiwi/deep-proxy'
const proxy = createDeepProxy(({DEFAULT}) => DEFAULT, target)
```

All the traps follow to the single handler, so you're able to build various complex conditions in one place. This approach might be useful if you need some kind of "rich" model, but don't want to complicate DTO.  
```typescript
if (path.length > 10) {
  if (prop === 'foo' || ['get', 'set', 'ownKeys'].includes(trapName)) {
    return DEFAULT
  }

  throw new Error('Bla-bla')
}

if (trapName === 'set' && typeof value !== 'number') {
  throw new TypeError('only `number` type is allowed')
}

// and so on

return DEFAULT
```

Another example. Imagine a client which uses an unstable channel with 10% of loss.
```typescript
const client = createClient({...opts})
await client.foo(...args) // 90% of success

const clientWithRetry = new DeepProxy(client, ({value, trapName}: THandlerContext) => {
  if (trapName === 'get') {
    if (typeof value === 'function') {
      return retryify(value, 2)
    }
  
    if (typeof value === 'object' && value !== null) {
      return PROXY
    }
  }

  return DEFAULT
})
await clientWithRetry.foo(...args) // 99% of success
```
Metrics, debugging, throttling — all becomes better with deep proxy.

## Directives
|Directive|Description
|---|---
|`DEFAULT`| Returns standard flow control. The current operation (get, set, ownKeys, etc) will be performed as without proxy.
|`PROXY`| Returns a proxy of nested object with parent's proxy handler.

## THandlerContext
```ts
type THandlerContext<T extends TTarget> = {
  target: T               // proxy target object/function
  trapName: TTrapName     // proxy handler trap: get, set, ownKeys and so on
  traps: TTraps           // proxy handler map reference
  root: TTarget           // root level proxy's target
  args: any[]             // trap method arguments as is
  path: string[]          // path to current proxy
  key?: keyof T           // prop key if defined in trap args
  value: any              // current field value by key
  newValue?: any          // new assinged value (#set())
  handler: TProxyHandler  // handler reference
  PROXY: symbol           // directives
  DEFAULT: symbol
  proxy: TTarget          // proxy reference
}
```

## Note
Proxies are [slow](https://github.com/justinjmoses/node-es6-proxy-benchmark). [Very slow](https://thecodebarbarian.com/thoughts-on-es6-proxies-performance). Use them wisely with care.

## Alternatives & Refs
* [tc39.es/proxy-object](https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots)
* [stackoverflow/how-to-create-a-deep-proxy](https://stackoverflow.com/questions/43177855/how-to-create-a-deep-proxy)
* [samvv/js-proxy-deep](https://github.com/samvv/js-proxy-deep)
* [lukigarazus/deep-proxy](https://github.com/lukigarazus/deep-proxy)
* [cronvel/nested-proxies](https://github.com/cronvel/nested-proxies)

## License
[MIT](./LICENSE)
