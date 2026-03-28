import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock the axios client module
vi.mock('../api/client', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

import client from '../api/client';

const TestConsumer = () => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return <div>{user ? `User: ${user.email}` : 'No user'}</div>;
};

const renderWithAuth = () =>
    render(
        <MemoryRouter>
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        </MemoryRouter>
    );

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('starts with no user when localStorage is empty', async () => {
        renderWithAuth();
        await waitFor(() => {
            expect(screen.getByText('No user')).toBeInTheDocument();
        });
    });

    it('loads and refreshes user from localStorage on init', async () => {
        const storedUser = { email: 'test@example.com', token: 'tok', role: 'STUDENT' };
        localStorage.setItem('user', JSON.stringify(storedUser));
        client.get.mockResolvedValue({ data: { email: 'test@example.com', role: 'STUDENT' } });

        renderWithAuth();
        await waitFor(() => {
            expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
        });
    });

    it('clears user when /auth/me returns 401', async () => {
        const storedUser = { email: 'test@example.com', token: 'expired', role: 'STUDENT' };
        localStorage.setItem('user', JSON.stringify(storedUser));
        client.get.mockRejectedValue({ response: { status: 401 } });

        renderWithAuth();
        await waitFor(() => {
            expect(screen.getByText('No user')).toBeInTheDocument();
        });
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('updateUser merges and persists changes', async () => {
        const storedUser = { email: 'test@example.com', token: 'tok', role: 'STUDENT', avatar: null };
        localStorage.setItem('user', JSON.stringify(storedUser));
        client.get.mockResolvedValue({ data: { email: 'test@example.com', role: 'STUDENT' } });

        const UpdateTrigger = () => {
            const { updateUser, user } = useAuth();
            return (
                <button onClick={() => updateUser({ avatar: '/new.png' })}>
                    {user?.avatar ?? 'no-avatar'}
                </button>
            );
        };

        render(
            <MemoryRouter>
                <AuthProvider>
                    <UpdateTrigger />
                </AuthProvider>
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
        await act(async () => {
            screen.getByRole('button').click();
        });
        expect(JSON.parse(localStorage.getItem('user')).avatar).toBe('/new.png');
    });
});
