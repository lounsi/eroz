/**
 * Shared date/time formatting utilities used across the application.
 * Centralizes DashboardPage.formatTime, DashboardPage.formatSessionDate,
 * HistoryPage.formatTime, HistoryPage.formatHour, and medicalNews.formatRelativeDate.
 */

/**
 * Format duration in seconds as a short human-readable string.
 * E.g. 150 → "2m30", 45 → "45s"
 */
export function formatDuration(seconds) {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m${secs > 0 ? secs : ''}` : `${secs}s`;
}

/**
 * Format duration in seconds as clock format.
 * E.g. 150 → "2:30", 45 → "0:45"
 */
export function formatDurationClock(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a date string as a relative label with time.
 * E.g. "Aujourd'hui, 14:30" / "Hier, 09:15" / "12 janv. 14:30"
 */
export function formatSessionDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return `Aujourd'hui, ${time}`;
    if (diffDays === 1) return `Hier, ${time}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a date string as time only.
 * E.g. "14:30"
 */
export function formatHour(dateString) {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a date string as a relative label without time.
 * E.g. "Aujourd'hui" / "Hier" / "Il y a 3 jours"
 */
export function formatRelativeDate(dateString) {
    try {
        const diff = Math.floor(Math.abs(new Date() - new Date(dateString)) / 86400000);
        if (diff === 0) return "Aujourd'hui";
        if (diff === 1) return 'Hier';
        return `Il y a ${diff} jours`;
    } catch {
        return dateString;
    }
}
