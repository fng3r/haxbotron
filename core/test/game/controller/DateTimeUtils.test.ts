import { getUnixTimestamp, getRemainingTimeString } from '../../../game/shared/DateTime';

describe('DateTimeUtils', () => {
  describe('getUnixTimestamp', () => {
    it('should return current Unix timestamp in milliseconds', () => {
      const before = Date.now();
      const timestamp = getUnixTimestamp();
      const after = Date.now();
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getRemainingTimeString', () => {
    it('should return remaining time string for future timestamp (minutes only)', () => {
      const futureTimestamp = Date.now() + 60000; // 1 minute in future
      const result = getRemainingTimeString(futureTimestamp);
      
      expect(result).toMatch(/^\d+m$/); // Format: "1m" or "2m"
    });

    it('should return time string for past timestamp (shows as large time)', () => {
      const pastTimestamp = Date.now() - 5000; // 5 seconds in past
      const result = getRemainingTimeString(pastTimestamp);
      
      // Past timestamps show as large hours/minutes (23h 60m for -5 seconds)
      expect(result).toMatch(/^\d+h \d+m$/);
    });

    it('should handle timestamps in minutes', () => {
      const futureTimestamp = Date.now() + 120000; // 2 minutes
      const result = getRemainingTimeString(futureTimestamp);
      
      expect(result).toMatch(/^\d+m$/); // Format: "3m"
      expect(result).toContain('m');
    });

    it('should handle timestamps in hours', () => {
      const futureTimestamp = Date.now() + 7200000; // 2 hours
      const result = getRemainingTimeString(futureTimestamp);
      
      expect(result).toMatch(/^\d+h \d+m$/); // Format: "2h 1m"
      expect(result).toContain('h');
    });

    it('should return infinity symbol for -1 timestamp', () => {
      const result = getRemainingTimeString(-1);
      
      expect(result).toBe('∞');
    });
  });
});
