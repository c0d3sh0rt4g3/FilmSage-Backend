/**
 * Health check test to verify Jest configuration
 */

describe('Test Setup Health Check', () => {
  it('should confirm Jest is working properly', () => {
    expect(true).toBe(true);
  });

  it('should handle basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect([1, 2, 3]).toHaveLength(3);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    await expect(promise).resolves.toBe('test');
  });

  it('should handle object matching', () => {
    const user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    };

    expect(user).toMatchObject({
      id: 1,
      name: 'Test User'
    });

    expect(user).toHaveProperty('email');
  });
}); 