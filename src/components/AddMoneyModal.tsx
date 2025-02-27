"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

type AddMoneyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (amount: number) => Promise<void>;
};

const AddMoneyModal = ({ isOpen, onClose, onProceed }: AddMoneyModalProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    if (!amount) return;
    setLoading(true);
    await onProceed(parseFloat(amount));
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Add Money</h2>
        <Input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleProceed} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Proceed to Pay'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddMoneyModal;