describe('js builds', () => {
  it('DeepProxy is properly exported (es6)', async () => {
    expect(typeof (await import('../../../target/es6/proxy.js')).DeepProxy).toBe('function') // eslint-disable-line
  })

  it('DeepProxy is properly exported (bundle)', async () => {
    expect(typeof (await import('../../../target/bundle/deep-proxy.cjs')).DeepProxy).toBe('function') // eslint-disable-line
  })
})
