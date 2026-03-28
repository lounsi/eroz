import { describe, it, expect } from 'vitest';
import {
    formatDuration,
    formatDurationClock,
    formatHour,
    formatRelativeDate,
} from '../utils/dateUtils';

describe('formatDuration', () => {
    it('returns 0m for falsy input', () => {
        expect(formatDuration(0)).toBe('0m');
        expect(formatDuration(null)).toBe('0m');
    });
    it('formats minutes and remaining seconds', () => {
        expect(formatDuration(150)).toBe('2m30');
    });
    it('formats minutes only when no leftover seconds', () => {
        expect(formatDuration(120)).toBe('2m');
    });
    it('formats seconds only when under one minute', () => {
        expect(formatDuration(45)).toBe('45s');
    });
});

describe('formatDurationClock', () => {
    it('formats as M:SS', () => {
        expect(formatDurationClock(150)).toBe('2:30');
    });
    it('pads single-digit seconds', () => {
        expect(formatDurationClock(62)).toBe('1:02');
    });
    it('handles zero', () => {
        expect(formatDurationClock(0)).toBe('0:00');
    });
});

describe('formatHour', () => {
    it('returns HH:MM pattern', () => {
        const date = new Date(2024, 0, 15, 9, 5, 0);
        expect(formatHour(date.toISOString())).toMatch(/^\d{2}:\d{2}$/);
    });
});

describe('formatRelativeDate', () => {
    it("returns Aujourd'hui for today", () => {
        expect(formatRelativeDate(new Date().toISOString())).toBe("Aujourd'hui");
    });
    it('returns Hier for yesterday', () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        expect(formatRelativeDate(yesterday)).toBe('Hier');
    });
    it('returns relative day count for older dates', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
        expect(formatRelativeDate(threeDaysAgo)).toBe('Il y a 3 jours');
    });
    it('returns the input on invalid date', () => {
        const result = formatRelativeDate('not-a-date');
        expect(typeof result).toBe('string');
    });
});
