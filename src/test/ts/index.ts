import {DeepProxy, DEFAULT,PROXY} from '../../main/ts'

describe('DeepProxy', () => {
  it('works exactly like in usage example', () => {
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

    expect(proxy.foo).toBe('qux')
    expect(proxy.a.b).toBe('qux')
    expect(() => { proxy.foo = 'a' }).toThrowError('target is immutable')
    expect(Object.keys(proxy)).toEqual(['foo', 'a'])
    // @ts-ignore
    expect(proxy.a.d).toBe('baz')
  })
})
