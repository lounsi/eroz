import { useState, useEffect } from 'react';
import client from '../api/client';

/**
 * Simple data-fetching hook for GET requests.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi('/progress/sessions?limit=100', [user]);
 */
export function useApi(endpoint, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: result } = await client.get(endpoint);
            setData(result);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, error, refetch: fetch };
}
