# @qiwi/deep-proxy
Deep proxy implementation for TypeScript based on a single trapper.

## Install
```shell script
npm i @qiwi/deep-proxy
yarn add @qiwi/deep-proxy
```

## Usage
```typescript
import {DeepProxy} from '@qiwi/deep-proxy'

const target = {foo: 'bar', a: {b: 'c'}}
const proxy = new DeepProxy(target, ({trapName, value, key, DEFAULT, NEXT}: any = {}) => {
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

All the traps follows to the single handler, so you're able to build various complex conditions in one place. This approach might be useful if need some kind of "rich" model, but don't want to complicate DTO.  
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

const clientWithRetry = new DeepProxy(client, ({value, trapName}) => {
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

## Note
Proxies are [slow](https://github.com/justinjmoses/node-es6-proxy-benchmark). [Very slow](https://thecodebarbarian.com/thoughts-on-es6-proxies-performance). Use them wisely with care.

## Alternatives & refs
* [samvv/js-proxy-deep](https://github.com/samvv/js-proxy-deep)
* [tc39.es/proxy-object](https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots)

## License
[MIT](./LICENSE)
