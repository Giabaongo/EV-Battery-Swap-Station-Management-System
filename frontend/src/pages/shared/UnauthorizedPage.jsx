import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                width: '90%'
            }}>
                <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🚫</div>
                <h1 style={{
                    fontSize: '3rem',
                    color: '#dc3545',
                    margin: '0 0 1rem 0',
                    fontWeight: 'bold'
                }}>403</h1>
                <h2 style={{
                    color: '#333',
                    marginBottom: '1rem',
                    fontSize: '1.5rem'
                }}>Access Denied</h2>
                <p style={{
                    color: '#666',
                    marginBottom: '2rem',
                    fontSize: '1.1rem',
                    lineHeight: '1.6'
                }}>
                    Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        Go Home
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}