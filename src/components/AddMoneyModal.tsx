"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';

type AddMoneyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (amount: number) => Promise<void>;
};

const AddMoneyModal = ({ isOpen, onClose, onProceed }: AddMoneyModalProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleProceed = async () => {
    if (!amount) return;
    setLoading(true);
    
    try {
      setVerifying(true);
      await onProceed(parseFloat(amount));
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
      // Keep verifying true until verification is complete - this will be handled by parent component
    }
  };

  // Show full-screen loader while payment is being verified
  if (verifying) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Add Money</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Enter the amount you want to add</h3>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleProceed(); }}>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Proceed to Pay'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMoneyModal;