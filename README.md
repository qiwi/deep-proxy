# @qiwi/deep-proxy
Deep proxy implementation for TypeScript

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
proxy.bar       // qux
proxy.d         // baz
proxy.a = 'a'   // TypeError
```
