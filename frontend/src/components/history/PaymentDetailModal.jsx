import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { paymentService } from '../../services/paymentService';
import { toast } from 'sonner';

// Helper function để format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
  }).format(amount) + ' VND';
};

// Helper function để format date
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date: dateStr, time: timeStr };
};

// Component modal hiển thị chi tiết thanh toán
export default function PaymentDetailModal({ open, onClose, paymentId }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch payment detail khi modal mở
  useEffect(() => {
    const fetchPaymentDetail = async () => {
      if (!open || !paymentId) return;

      setLoading(true);
      try {
        const data = await paymentService.getPaymentById(paymentId);
        setPayment(data);
      } catch (error) {
        console.error('Error fetching payment detail:', error);
        toast.error('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetail();
  }, [open, paymentId]);

  if (!payment && !loading) return null;

  const dateTime = payment ? formatDateTime(payment.payment_time) : { date: 'N/A', time: 'N/A' };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" max-h-[100vh] overflow-y-auto">
        {loading ? (
          // Loading state
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : payment ? (
          <>
            {/* Header */}
            <DialogHeader className="border-b border-gray-200 pb-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Payment Details
                  </DialogTitle>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-medium text-gray-900">{dateTime.date}</p>
                  <p className="text-sm text-gray-500">{dateTime.time}</p>
                </div>
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="py-4 space-y-4">
              {/* Grid thông tin chính - 3 cột */}
              <div className="grid grid-cols-4 md:grid-cols-3 gap-x-6 gap-y-3">
                <div>
                  <p className="text-sm text-gray-500">Package Name</p>
                  <p className="font-medium text-gray-900">
                    {payment.package?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900 uppercase">
                    {payment.method || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Type</p>
                  <p className="font-medium text-gray-900">
                    {payment.payment_type?.replace(/_/g, ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.status === 'success' 
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {payment.status?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Breakdown chi phí */}
              <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Order Info:</span>
                    <span className="font-medium text-right max-w-xs truncate">
                      {payment.order_info || 'N/A'}
                    </span>
                  </div>
                  
                  {payment.package && (
                    <>
                      <div className="flex justify-between items-center text-gray-700">
                        <span>Base Price:</span>
                        <span className="font-mono font-medium">
                          {formatCurrency(payment.package.base_price)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-700">
                        <span>Battery Deposit:</span>
                        <span className="font-mono font-medium">
                          {payment.payment_type?.includes('deposit') ? '400,000 VND' : '0 VND'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <hr className="my-4 border-gray-200" />

                {/* Tổng tiền */}
                <div className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">Số tiền</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>

              {/* User info (nếu có) */}
              {payment.user && (
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">User Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700">Name: </span>
                      <span className="font-medium text-blue-900">{payment.user.username}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Email: </span>
                      <span className="font-medium text-blue-900">{payment.user.email}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={onClose}
                className="inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Payment History
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
