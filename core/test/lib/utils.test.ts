import { generateRandomString } from '../../lib/utils';

describe('Utils', () => {
  describe('generateRandomString', () => {
    it('should generate a string of specified length', () => {
      const length = 10;
      const result = generateRandomString(length);
      
      expect(result).toHaveLength(length);
    });

    it('should generate alphanumeric strings', () => {
      const result = generateRandomString(20);
      
      // Should only contain alphanumeric characters
      expect(result).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate different strings on each call', () => {
      const result1 = generateRandomString(20);
      const result2 = generateRandomString(20);
      
      expect(result1).not.toBe(result2);
    });

    it('should handle length of 0', () => {
      const result = generateRandomString(0);
      
      expect(result).toBe('');
    });
  });
});
