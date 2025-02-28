"use client"

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast, Toaster } from 'sonner'; // Import Sonner

type ReferralModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ReferralModal = ({ isOpen, onClose }: ReferralModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address.'); // Show error toast
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/actions/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Invitation sent successfully!'); // Show success toast
        setEmail('');
        onClose();
      } else {
        throw new Error(data.message || 'Failed to send invitation');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to send invitation. Please try again.'); // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Add Toaster component for displaying toasts
    <Toaster position="top-center" richColors /> */}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Refer to a friend</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-800 mb-2">
                Invite your friends to start investing
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Friend&apos;s Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReferralModal;