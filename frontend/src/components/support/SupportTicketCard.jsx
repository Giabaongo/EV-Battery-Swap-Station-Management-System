import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '../../components/ui/button';
import { Search, Star } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/card';
import { supportService } from '../../services/supportService';

// Component form ticket hỗ trợ - User tạo ticket báo cáo vấn đề
export default function SupportTicketCard({ stations = [] }) {
  // State quản lý input tìm kiếm trạm
  const [searchQuery, setSearchQuery] = useState('');
  // State hiển thị/ẩn dropdown danh sách trạm
  const [showDropdown, setShowDropdown] = useState(false);
  // State lưu trạm được chọn
  const [selectedStation, setSelectedStation] = useState(null);
  // Ref dropdown để detect click outside
  const dropdownRef = useRef(null);
  
  // Close dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Lọc danh sách trạm dựa vào search query - Optimize bằng useMemo
  const stationOptions = useMemo(() => {
    if (!Array.isArray(stations)) return [];
    // Map dữ liệu từ backend thành format hiển thị
    const allStations = stations.map((s) => ({
      value: s.station_id ?? s.id,  // ID trạm
      label: s.name ? `${s.name}${s.address ? ` - ${s.address}` : ''}` : `${s.address || 'Unknown station'}`,  // Tên + địa chỉ
      name: s.name || '',
    }));
    
    // Filter theo search query
    if (!searchQuery.trim()) return allStations;
    const query = searchQuery.toLowerCase();
    return allStations.filter(st => st.label.toLowerCase().includes(query));
  }, [stations, searchQuery]);

  // Lấy user_id từ context
  const { user } = useAuth();
  const userId = user?.id ?? user?.user_id;

  // Gọi API tạo support ticket
  const createSupportTicket = async (ticketData) => {
    try {
      const response = await supportService.createSupportTicket(ticketData);
      return response;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  };

  // Mảng danh mục vấn đề - Map với backend 'type' field
  const categories = [
    { value: 'battery_issue', label: 'Battery Issue' },       // Vấn đề pin
    { value: 'station_issue', label: 'Station Issue' },       // Vấn đề trạm
    { value: 'other', label: 'Other / Feedback' },            // Khác / Feedback
  ];

  // State quản lý form submission
  const [submitting, setSubmitting] = useState(false);       // Đang gửi form
  const [submitted, setSubmitted] = useState(false);         // Form đã gửi thành công
  const [createdTicket, setCreatedTicket] = useState(null);  // Lưu thông tin ticket vừa tạo
  const [errorMessage, setErrorMessage] = useState('');      // Thông báo lỗi

  // Schema validation Yup - Kiểm tra dữ liệu form
  const validationSchema = Yup.object().shape({
    stationId: Yup.number()
      .typeError('Please select a station')
      .required('Station is required'),  // Bắt buộc chọn trạm
    category: Yup.string()
      .oneOf(categories.map((c) => c.value), 'Invalid category')
      .required('Category is required'),  // Bắt buộc chọn danh mục
    rating: Yup.number()
      .min(1, 'Please select a rating')
      .max(5)
      .required('Rating is required'),  // Bắt buộc đánh giá 1-5 sao
    message: Yup.string()
      .min(10, 'Please provide more details (at least 10 characters)')
      .required('Description is required'),  // Bắt buộc ghi chú chí tiết
  });

  // Hàm xử lý gửi form
  const handleSubmit = async (values, { resetForm, setSubmitting: setFormikSubmitting }) => {
    setSubmitting(true);
    setSubmitted(false);
    setErrorMessage('');
    try {
      if (!userId) throw new Error('User not authenticated');

      // Chuẩn bị payload gửi backend
      const payload = {
        user_id: Number(userId),           // User gửi ticket
        station_id: Number(values.stationId),  // Trạm liên quan
        type: values.category,             // Loại vấn đề
        rating: Number(values.rating),     // Đánh giá sao
        description: values.message,       // Nội dung chi tiết
      };

      // Gửi API tạo ticket
      const resp = await createSupportTicket(payload);
      setCreatedTicket(resp);
      setSubmitted(true);
      resetForm();  // Xóa dữ liệu form
    } catch (err) {
      console.error('Submit support error:', err);
      setSubmitted(false);
      setErrorMessage(err?.response?.data?.message || err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
      setFormikSubmitting(false);
    }
  };

  return (
    // Card container - Nền trắng, border xám
    <Card className="bg-white border-gray-200">
      {/* Header: Tiêu đề + mô tả */}
      <CardHeader className="border-b border-gray-100">
        <CardTitle>Submit a Ticket</CardTitle>
        <CardDescription>Our team will review and get back to you shortly.</CardDescription>
      </CardHeader>

      {/* Form Formik - Quản lý state + validation */}
      <Formik
        initialValues={{ stationId: '', category: '', rating: 0, message: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form>
        {/* Nội dung form */}
        <CardContent className="py-2">
          {/* Row 1: Chọn trạm + Chọn danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phần 1: Tìm kiếm + Chọn trạm */}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Select Charging Station</span>
              
              {/* Input tìm kiếm với dropdown */}
              <div className="relative" ref={dropdownRef}>
                {/* Icon search */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                {/* Input tìm kiếm */}
                <input
                  type="text"
                  placeholder="Search and select station..."
                  value={selectedStation ? selectedStation.label : searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);  // Cập nhật text tìm kiếm
                    setSelectedStation(null);        // Reset trạm chọn
                    setFieldValue('stationId', '');  // Reset form
                    setShowDropdown(true);           // Mở dropdown
                  }}
                  onFocus={() => setShowDropdown(true)}  // Mở dropdown khi focus
                  className="w-full h-10 rounded-md border border-gray-300 bg-white pl-10 pr-3 text-gray-900 shadow-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                
                {/* Dropdown danh sách trạm - Hiển thị nếu showDropdown=true */}
                {showDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {stationOptions.length > 0 ? (
                      // Danh sách trạm khớp search
                      stationOptions.map((station) => (
                        <button
                          key={station.value}
                          type="button"
                          onClick={() => {
                            setSelectedStation(station);     // Chọn trạm
                            setSearchQuery('');              // Xóa search
                            setFieldValue('stationId', station.value);  // Set giá trị form
                            setShowDropdown(false);           // Đóng dropdown
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                        >
                          <div className="text-sm text-gray-900">{station.label}</div>
                        </button>
                      ))
                    ) : (
                      // Không có trạm khớp
                      <div className="px-4 py-3 text-sm text-gray-500">No stations found</div>
                    )}
                  </div>
                )}
                
                {/* Hidden field Formik */}
                <Field type="hidden" name="stationId" />
              </div>
              {/* Hiển thị lỗi validation */}
              <ErrorMessage name="stationId" component="div" className="text-sm text-red-600 mt-1" />
            </label>

            {/* Phần 2: Chọn danh mục vấn đề */}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">What you are having issue with</span>
              {/* Dropdown danh mục */}
              <Field
                as="select"
                name="category"
                className="form-select w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-gray-900 shadow-xs outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Field>
              {/* Hiển thị lỗi validation */}
              <ErrorMessage name="category" component="div" className="text-sm text-red-600 mt-1" />
            </label>
          </div>

          {/* Row 2: Đánh giá sao (1-5) */}
          <label className="flex flex-col gap-2 mt-6">
            <span className="text-sm font-medium text-gray-700">Rate your experience</span>
            {/* Hiển thị 5 ngôi sao */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFieldValue('rating', star)}  // Set rating khi click
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  {/* Star icon - Filled nếu <= rating */}
                  <Star
                    className={`w-8 h-8 ${
                      star <= values.rating
                        ? 'fill-yellow-400 text-yellow-400'  // Filled yellow
                        : 'text-gray-300'                     // Empty gray
                    }`}
                  />
                </button>
              ))}
              {/* Hiển thị số sao được chọn */}
              <span className="ml-2 text-sm text-gray-600">
                {values.rating > 0 ? `${values.rating} star${values.rating > 1 ? 's' : ''}` : 'No rating'}
              </span>
            </div>
            {/* Hiển thị lỗi validation */}
            <ErrorMessage name="rating" component="div" className="text-sm text-red-600 mt-1" />
          </label>

          {/* Row 3: Mô tả chi tiết vấn đề */}
          <label className="flex flex-col gap-2 mt-6">
            <span className="text-sm font-medium text-gray-700">Please describe your issue or feedback</span>
            {/* Textarea nhập mô tả */}
            <Field
              as="textarea"
              name="message"
              placeholder="Enter your message here..."
              className="min-h-36 w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 shadow-xs outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {/* Hiển thị lỗi validation */}
            <ErrorMessage name="message" component="div" className="text-sm text-red-600 mt-1" />
          </label>

          {/* Thông báo thành công */}
          {submitted && (
            <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-200">
              Thank you! Your feedback has been submitted.
              {createdTicket && (
                <div className="mt-2 text-sm text-gray-800">
                  <p className="font-medium">Ticket ID: {createdTicket.support_id}</p>
                  <p>Type: {createdTicket.type}</p>
                  <p>Rating: {createdTicket.rating ? `${createdTicket.rating} star${createdTicket.rating > 1 ? 's' : ''}` : 'N/A'}</p>
                  <p>Station: {createdTicket.station?.name || createdTicket.station_id}</p>
                  <p className="text-xs text-gray-600">Created at: {createdTicket.created_at ? new Date(createdTicket.created_at).toLocaleString() : ''}</p>
                </div>
              )}
            </div>
          )}
          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 border border-red-200">
              {errorMessage}
            </div>
          )}
        </CardContent>

          {/* Footer: Nút submit */}
          <CardFooter className="justify-end border-t border-gray-100 py-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Feedback'}
            </Button>
          </CardFooter>
          </Form>
        )}
      </Formik>
    </Card>
  );
}
