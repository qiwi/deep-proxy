# @qiwi/deep-proxy
Deep proxy implementation for TypeScript

```shell script
npm i @qiwi/deep-proxy
```

```typescript
import {DeepProxy, OTHERWISE, NEXT} from '@qiwi/deep-proxy'

const target = {foo: 'bar', a: {b: 'c'}}
const proxy = new DeepProxy(target, ({trapName, value, key}: any = {}) => {
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
proxy.a = 'a'   // TypeError
```
