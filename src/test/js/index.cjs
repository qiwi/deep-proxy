describe('js builds', () => {
  it('DeepProxy is properly exported (es5)', async () => {
    expect(typeof require('../../../target/es5/index.cjs').DeepProxy).toBe('function') // eslint-disable-line
  })
})
