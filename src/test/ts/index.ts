import { ICallable } from '@qiwi/substrate'
import util from 'util'

import { DeepProxy, DEFAULT, PROXY } from '../../main/ts'

describe('DeepProxy', () => {
  it('works exactly like in usage example', () => {
    const target = { foo: 'bar', a: { b: 'c' } }
    const proxy = new DeepProxy(
      target,
      ({ trapName, value, key }: any = {}) => {
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
      },
    )

    expect(proxy.foo).toBe('qux')
    expect(proxy.a.b).toBe('qux')
    expect(() => {
      proxy.foo = 'a'
    }).toThrowError('target is immutable')
    expect(Object.keys(proxy)).toEqual(['foo', 'a'])
    // @ts-ignore
    expect(proxy.a.d).toBe('baz')
  })

  it('proxy handler gets proper context', (done) => {
    const target = { foo: 'bar' }
    const proxy = new DeepProxy(
      target,
      ({
        trapName,
        value,
        newValue,
        key,
        DEFAULT,
        PROXY,
        root,
        path,
        proxy: _proxy,
      }: any = {}) => {
        if (trapName === 'set') {
          expect(value).toBe('bar')
          expect(newValue).toBe('baz')
          expect(key).toBe('foo')
          expect(root).toBe(target)
          expect(path).toEqual([])
          expect(typeof DEFAULT).toBe('symbol')
          expect(typeof PROXY).toBe('symbol')
        }

        if (trapName === 'get') {
          expect(value).toBe('baz')
          expect(newValue).toBeUndefined()
          expect(key).toBe('foo')
          expect(root).toBe(target)
          expect(path).toEqual([])
          expect(util.types.isProxy(_proxy)).toBeTruthy()
          expect(proxy).toBe(_proxy)
          done()
        }

        return DEFAULT
      },
    )

    expect((proxy.foo = 'baz')).toBe('baz')
    expect(proxy.foo).toBe('baz')
  })

  it('proxy could be applied to complex function-with-props targets', () => {
    // eslint-disable-next-line
    const wrapper = <T extends ICallable>(fn: T) =>
      function (this: any, ...args: Parameters<T>) {
        return (fn.call(this, ...args) + '').toUpperCase()
      }
    const fn = function () {
      // @ts-ignore
      return this.foo
    }
    const target = {
      fn,
      foo: 'foo',
    }
    const inner = function () {
      return 'inner'
    }
    inner.baz = 'baz'
    fn.bar = { baz: 'qux' }
    fn.inner = inner

    const proxy = new DeepProxy(
      target,
      ({
        trapName,
        value,
        handler,
        DEFAULT,
        PROXY,
        root,
        path,
        proxy,
      }: any = {}) => {
        if (trapName === 'get') {
          if (typeof value === 'object' && value !== null) {
            return PROXY
          }

          if (typeof value === 'function') {
            return new DeepProxy(
              Object.assign(wrapper(value).bind(proxy), value),
              handler,
              path,
              root,
            )
          }
        }

        return DEFAULT
      },
    )

    expect(proxy.fn()).toBe('FOO')
    expect(proxy.fn.bar.baz).toBe('qux')
    expect(proxy.fn.inner()).toBe('INNER')
    expect(proxy.fn.inner.baz).toBe('baz')
  })
})
