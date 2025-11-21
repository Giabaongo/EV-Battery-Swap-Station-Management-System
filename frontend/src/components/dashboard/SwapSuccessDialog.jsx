import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SwapSuccessDialog({ open, onOpenChange, summary }) {
  const data = summary || {
    user: 'John Doe',
    station: 'Central Charging Hub',
    vehicle: 'Tesla Model 3',
    plan: 'Premium Subscription',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="bg-white dark:bg-background rounded-xl">
          <div className="flex flex-col items-center px-6 pt-6">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold">Swapped Successfully!</DialogTitle>
              <DialogDescription>Battery swap completed. Here are the details.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-4">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex justify-between gap-x-6 py-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm">User</p>
                <p className="text-slate-900 dark:text-slate-200 text-sm font-medium text-right">{data.user}</p>
              </div>
              <div className="flex justify-between gap-x-6 py-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Station</p>
                <p className="text-slate-900 dark:text-slate-200 text-sm font-medium text-right">{data.station}</p>
              </div>
              <div className="flex justify-between gap-x-6 py-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Vehicle</p>
                <p className="text-slate-900 dark:text-slate-200 text-sm font-medium text-right">{data.vehicle}</p>
              </div>
              <div className="flex justify-between gap-x-6 py-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Plan</p>
                <p className="text-slate-900 dark:text-slate-200 text-sm font-medium text-right">{data.plan}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button className="w-full" onClick={() => onOpenChange?.(false)}>Back to Dashboard</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
