// pages/profile.tsx
"use client"

import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
// import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import cookies from 'js-cookie';
import { signOut } from 'next-auth/react';
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  isVerified: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
  image: string | null;
}

const Profile: NextPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
//   const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/actions/getuser');
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
 const handleLogout = async () => {
    try {
      // Remove all cookies related to authentication
      cookies.remove('token');
      cookies.remove('next-auth.session-token');
      cookies.remove('next-auth.csrf-token');
      cookies.remove('next-auth.callback-url');
      
      // Also remove cookies in case they were set with different domains/paths
      cookies.remove('token', { path: '/' });
      cookies.remove('next-auth.session-token', { path: '/' });
      cookies.remove('next-auth.csrf-token', { path: '/' });
      cookies.remove('next-auth.callback-url', { path: '/' });

      // Sign out from NextAuth
      await signOut({ 
        callbackUrl: '/pages/login',
        redirect: false 
      });

      // Clear any local storage items if you're using them
      localStorage.clear();
      
      // Force a hard redirect to ensure complete session cleanup
      window.location.href = '/pages/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback redirect in case of error
      window.location.href = '/pages/login';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 mt-16">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            {user.image ? (
              <Image
                src={user.image}
                alt={`${user.firstName} ${user.lastName}`}
                width={96}
                height={96}
                className="rounded-full"
                priority
              />
            ) : (
              <span className="text-2xl text-gray-500">
                {user.firstName.charAt(0).toUpperCase()}
                {user.lastName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700">Account Details</h2>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Account Verified</span>
              <span className={`font-semibold ${user.isVerified ? 'text-green-500' : 'text-red-500'}`}>
                {user.isVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Balance</span>
              <span className="font-semibold text-gray-800">₹{user.balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Member Since</span>
              <span className="font-semibold text-gray-800">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;