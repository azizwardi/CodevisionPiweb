import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Unauthorized Access</h1>
          <div className="mb-6">
            <svg 
              className="w-24 h-24 mx-auto text-red-500" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-6 dark:text-gray-300">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex flex-col space-y-3">
            <Link 
              to="/" 
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center transition duration-200"
            >
              Go to Home
            </Link>
            <Link 
              to="/signin" 
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg text-center transition duration-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
