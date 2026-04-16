import { useState } from 'react';
import { Package, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error } = await signIn(email, password);
        if (error) setError(error);
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--background)',
            padding: '1rem',
        }}>
            <div style={{
                backgroundColor: 'var(--sidebar-bg)',
                borderRadius: '16px',
                padding: '2.5rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4f6ef7, #3b5bdb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Package size={22} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-main)' }}>COG Inventory</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ministry Inventory Management</div>
                    </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    Sign in
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Use your COG App credentials
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="form-label">Email</label>
                        <input
                            className="form-control"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="form-label">Password</label>
                        <input
                            className="form-control"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.625rem 0.875rem',
                            backgroundColor: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            borderRadius: '8px',
                            fontSize: '0.8125rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '0.5rem', height: '42px', fontSize: '0.9375rem' }}
                    >
                        {loading ? 'Signing in…' : <><LogIn size={16} style={{ marginRight: '0.5rem' }} /> Sign In</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
