import { DeepProxy, OTHERWISE } from '../../main/ts'

describe('DeepProxy', () => {
  it('works exactly like in usage example', () => {

    const target = {foo: 'bar'}
    const proxy = new DeepProxy(target, ({trap}: any = {}) => {
      if (trap === 'set') {
        throw new TypeError('target is immutable')
      }

      if (trap === 'get') {
        return 'qux'
      }

      return OTHERWISE
    })

    expect(proxy.foo).toBe('qux')
    expect(() => { proxy.foo = 'a' }).toThrowError('target is immutable')
  })
})
