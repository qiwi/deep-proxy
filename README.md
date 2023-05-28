# @qiwi/deep-proxy
Deep proxy implementation for TypeScript

[![Build Status](https://travis-ci.com/qiwi/deep-proxy.svg?branch=master)](https://travis-ci.com/qiwi/deep-proxy)
[![Maintainability](https://api.codeclimate.com/v1/badges/b8bb8d6c35bc74c123a5/maintainability)](https://codeclimate.com/github/qiwi/deep-proxy/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/b8bb8d6c35bc74c123a5/test_coverage)](https://codeclimate.com/github/qiwi/deep-proxy/test_coverage)
[![npm (scoped)](https://img.shields.io/npm/v/@qiwi/deep-proxy)](https://www.npmjs.com/package/@qiwi/deep-proxy)

## Install
```shell script
# npm
npm i @qiwi/deep-proxy

# yarn
yarn add @qiwi/deep-proxy
```

## Key features
* Single proxy handler with [rich context](#thandlercontext) instead of verbose traps mapping
* Proxy self-reference in handler context (meaningful for methods binding)
* JS, TS and Flow support
* Magic directives:
  * `PROXY` to build an infinite nested proxy chain
  * `DEFAULT` to switch to the object's default behavior
* Caching
* Trap params parsing

## Usage
```typescript
import {DeepProxy} from '@qiwi/deep-proxy'

const target = {foo: 'bar', a: {b: 'c'}}
const proxy = new DeepProxy(target, ({trapName, value, key, DEFAULT, PROXY}: THandlerContext) => {
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
FP adepts may use `createDeepProxy` factory instead of `DeepProxy` class and get some magic.
```ts
import {createDeepProxy} from '@qiwi/deep-proxy'

// Regular usage case
const handler = ({DEFAULT}) => DEFAULT
const proxy1 = createDeepProxy(target, handler)

// Passing defaults through this context
const customProxyFactory = createDeepProxy.bind({handler})
const proxy2 = customProxyFactory(target)
```

All the traps follow to the single handler, so you're able to build various complex conditions in one place. This approach might be useful if you need some kind of "rich" model, but you don't want to complicate DTO.  
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
Metrics, debugging, throttling — all becomes better with the deep proxy.

## Traps
https://262.ecma-international.org/12.0/#table-proxy-handler-methods
```js
'defineProperty',
'deleteProperty',
'apply',
'construct',
'get',
'getOwnPropertyDescriptor',
'getPrototypeOf',
'has',
'isExtensible',
'ownKeys',
'preventExtensions',
'set',
'setPrototypeOf'
```

## Directives
| Directive | Description                                                                                                      |
|-----------|------------------------------------------------------------------------------------------------------------------|
| `DEFAULT` | Returns standard flow control. The current operation (get, set, ownKeys, etc) will be performed as without proxy.| 
| `PROXY`   | Returns a proxy of nested object with parent's proxy handler.                                                    |

A bit more sugar on top: by default `PROXY` directive uses `value` from context, but you can pass your own.
```typescript
const proxy = new DeepProxy({foo: {bar: 'baz'}}, ({value, trapName}) => {
  if (trapName === 'get' && typeof value === 'object' && value !== null) {
    return PROXY({baz: 'qux'})
  }

  return DEFAULT
})
proxy.foo.baz // 'qux'
```

## THandlerContext
```ts
type THandlerContext<T extends TTarget> = {
  target: T               // proxy target object/function

  parameters: any[]       // trap arguments as is: [target, *, *, *]
  name: keyof T,          // property name
  val: any,               // property value
  receiver: any,          // receiver ('get' or 'set' traps)
  args: any[],            // arguments array ('apply' trap)
  descriptor: PropertyDescriptor,   // property descriptor ('defineProperty', 'deleteProperty' trap)
  thisValue: any,         // this context of 'apply' trap
  prototype: any,         // prototype of 'setPrototypeOf' trap
    
  trapName: TTrapName     // proxy handler trap: get, set, ownKeys and so on
  traps: TTraps           // proxy handler map reference
  root: TTarget           // root level proxy's target
  path: string[]          // path to current proxy from root
  key?: keyof T           // prop key if defined in trap args
  value: any              // current field value by key
  newValue?: any          // new assigned value (#set())
  handler: TProxyHandler  // handler reference
  PROXY: symbol           // directives
  DEFAULT: symbol
  proxy: TTarget          // proxy reference
}
```

## Caching
`createDeepProxy` factory returns the stored proxy reference if the arguments match to any previous call:
1) `target` refs are strictly equal
2) `root` refs equal too
3) `path` values match

Note, this is not a regular memoization, but a loosely coupled `WeakMap`, so unused proxies can be cleaned up by GC.
```typescript
export type TProxyCache = {
  // root object refers to some targets objects,
  // that refer to map, that binds nested paths with their traps
  traps: WeakMap<TTarget, WeakMap<TTarget, Map<string, TTraps>>>

  // And these traps refer to proxies
  proxies: WeakMap<TTraps, TProxy<TTarget>>
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
* [CharlesStover/deep-proxy-polyfill](https://github.com/CharlesStover/deep-proxy-polyfill)

## License
[MIT](./LICENSE)
