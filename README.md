# @qiwi/deep-proxy
Deep proxy implementation for TypeScript

```shell script
npm i @qiwi/deep-proxy
```

```typescript
import {DeepProxy, OTHERWISE} from '@qiwi/deep-proxy'

const target = {foo: 'bar'}
const proxy = new DeepProxy(target, ({trap, path}) => {
    if (trap === 'set') {
        throw new TypeError('target is immutable')
    }

    if (trap === 'get' && path === 'baz') {
        return 'qux'
    }

    return OTHERWISE // NOTE this magic value helps to set proxy traps correctly
})

proxy.baz       // qux
proxy.a = 'a'   // TypeError
```
