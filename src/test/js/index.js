describe('js builds', () => {
  it('DeepProxy is properly exported (es5)', () => {
    expect(typeof require('../../../target/es5').DeepProxy).toBe('function') // eslint-disable-line
  })

  it('DeepProxy is properly exported (es6)', () => {
    expect(typeof require('../../../target/es6/proxy').DeepProxy).toBe('function') // eslint-disable-line
  })

  it('DeepProxy is properly exported (bundle)', () => {
    expect(typeof require('../../../target/bundle/deep-proxy').DeepProxy).toBe('function') // eslint-disable-line
  })
})
