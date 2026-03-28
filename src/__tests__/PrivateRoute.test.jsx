import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';

// Mock AuthContext so we control the user state
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

const Protected = () => <div>Protected Content</div>;
const Login = () => <div>Login Page</div>;
const Home = () => <div>Home</div>;

function renderRoutes(initialPath = '/protected', allowedRoles = undefined) {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route element={<PrivateRoute allowedRoles={allowedRoles} />}>
                    <Route path="/protected" element={<Protected />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe('PrivateRoute', () => {
    it('redirects to /login when user is not authenticated', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: false });
        renderRoutes();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders spinner while auth is loading (no content shown)', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: true });
        renderRoutes();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('renders outlet for authenticated user with no role restriction', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'STUDENT' }, loading: false });
        renderRoutes();
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('allows access when user has a matching allowed role', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'ADMIN' }, loading: false });
        renderRoutes('/protected', ['ADMIN', 'PROF']);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to / when user role is not in allowedRoles', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'STUDENT' }, loading: false });
        renderRoutes('/protected', ['ADMIN']);
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
    });
});
