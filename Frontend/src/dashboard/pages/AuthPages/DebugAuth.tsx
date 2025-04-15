import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';

interface DecodedToken {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  exp?: number;
  iat?: number;
  [key: string]: any; // Allow any other properties
}

export default function DebugAuth() {
  const [tokenInfo, setTokenInfo] = useState<{
    token: string | null;
    userRole: string | null;
    decoded: DecodedToken | null;
    isExpired: boolean;
  }>({
    token: null,
    userRole: null,
    decoded: null,
    isExpired: false
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    let decoded: DecodedToken | null = null;
    let isExpired = false;
    
    if (token) {
      try {
        decoded = jwtDecode<DecodedToken>(token);
        
        // Check if token is expired
        if (decoded.exp) {
          isExpired = decoded.exp * 1000 < Date.now();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    setTokenInfo({
      token,
      userRole,
      decoded,
      isExpired
    });
  }, []);

  const handleClearStorage = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Authentication Debug</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Local Storage</h2>
          <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-700 mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">authToken:</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 break-all">
              {tokenInfo.token ? tokenInfo.token.substring(0, 20) + '...' : 'Not found'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">userRole:</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {tokenInfo.userRole || 'Not found'}
            </p>
          </div>
        </div>
        
        {tokenInfo.decoded && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Decoded Token</h2>
            <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">User ID:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{tokenInfo.decoded.id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{tokenInfo.decoded.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Role:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{tokenInfo.decoded.role || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Verified:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {tokenInfo.decoded.isVerified !== undefined ? String(tokenInfo.decoded.isVerified) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Issued At:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {tokenInfo.decoded.iat ? new Date(tokenInfo.decoded.iat * 1000).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Expires At:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {tokenInfo.decoded.exp ? new Date(tokenInfo.decoded.exp * 1000).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Token Status:</p>
                <p className={`text-sm font-medium ${tokenInfo.isExpired ? 'text-red-500' : 'text-green-500'}`}>
                  {tokenInfo.isExpired ? 'EXPIRED' : 'VALID'}
                </p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">All Token Data:</p>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60 dark:bg-gray-600 dark:text-gray-200">
                  {JSON.stringify(tokenInfo.decoded, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <button
            onClick={handleClearStorage}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear Auth Storage
          </button>
          <Link
            to="/signin"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
          >
            Go to Sign In
          </Link>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
