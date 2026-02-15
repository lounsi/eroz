import client from './client';

// ── Classes ─────────────────────────────────────────────────

export const getMyClasses = () => client.get('/classes');

export const createClass = (data) => client.post('/classes', data);

export const getClassDetail = (id) => client.get(`/classes/${id}`);

export const updateClass = (id, data) => client.put(`/classes/${id}`, data);

export const deleteClass = (id) => client.delete(`/classes/${id}`);

export const joinClassByCode = (code) => client.post('/classes/join', { code });

export const getStudentClasses = () => client.get('/classes/my');

// ── Series ──────────────────────────────────────────────────

export const createSeries = (data) => client.post('/series', data);

export const getSeriesDetail = (id) => client.get(`/series/${id}`);

export const deleteSeries = (id) => client.delete(`/series/${id}`);

export const getSeriesProgress = (id) => client.get(`/series/${id}/progress`);

export const joinSeriesByCode = (code) => client.post('/series/join', { code });

export const submitSeriesResult = (id, data) => client.post(`/series/${id}/submit`, data);

export const getSeriesByClass = (classId) => client.get(`/series/by-class/${classId}`);

export const getRandomTrainingSeries = (difficulty) => client.get('/series/training/random', { params: { difficulty } });

