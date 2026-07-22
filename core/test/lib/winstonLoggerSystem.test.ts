import { describe, expect, it } from '@jest/globals';
import DailyRotateFile from 'winston-daily-rotate-file';
import { winstonLogger } from '../../winstonLoggerSystem.js';

describe('Winston logger', () => {
    it('handles filesystem errors from every rotating transport', () => {
        const rotatingTransports = winstonLogger.transports.filter(
            (transport): transport is DailyRotateFile => transport instanceof DailyRotateFile
        );

        expect(rotatingTransports).toHaveLength(3);
        expect(rotatingTransports.map(transport => transport.level)).toEqual(['info', 'error', 'warn']);
        for (const transport of rotatingTransports) {
            expect(transport.listenerCount('error')).toBeGreaterThan(0);
        }
    });
});
