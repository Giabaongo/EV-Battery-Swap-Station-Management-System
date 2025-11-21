import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogTrigger, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useContext';

export default function PersonalInfoEdit({ onUpdated }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const initialValues = {
    fullName: user?.name || '',
    password: '',
    confirmPassword: '',
  };

  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required('Full name is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match'),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting: setFormikSubmitting }) => {
    setServerError('');
    setSuccessMessage('');
    setIsSaving(true);
    try {
      const payload = {
        id: user?.id || user?.user_id,
        name: values.fullName,
      };
      if (values.password) payload.password = values.password;

      // call service
      const res = await authService.updateProfile(payload);

      // Update localStorage user preview (AuthContext will refresh on reload)
      try {
        const existing = JSON.parse(localStorage.getItem('user') || '{}');
        const updated = { ...existing, name: res?.name || values.fullName };
        localStorage.setItem('user', JSON.stringify(updated));
      } catch {
        // ignore
      }

      setSuccessMessage('Profile updated successfully.');
      if (typeof onUpdated === 'function') onUpdated(res);
      resetForm({ values: { ...values, password: '', confirmPassword: '' } });
    } catch (err) {
      console.error('Update profile error:', err);
      setServerError(err?.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
      try { setFormikSubmitting && setFormikSubmitting(false); } catch { /* ignore */ }
    }
  };

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-blue-700 hover:text-blue-700 hover:bg-blue-50">
            Edit
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md w-full sm:max-h-[420px] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your full name or change your password here.</DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
              {({ isSubmitting }) => (
                <Form>
                  <div className="grid p-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-gray-700">Full Name</span>
                      <Field name="fullName" as={Input} className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 shadow-xs outline-none focus:ring-2 focus:ring-blue-500/50" />
                      <ErrorMessage name="fullName" component="div" className="text-sm text-red-600 mt-1" />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-gray-700">New Password</span>
                      <Field name="password" as={Input} type="password" className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 shadow-xs outline-none focus:ring-2 focus:ring-blue-500/50" />
                      <ErrorMessage name="password" component="div" className="text-sm text-red-600 mt-1" />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-gray-700">Confirm Password</span>
                      <Field name="confirmPassword" as={Input} type="password" className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 shadow-xs outline-none focus:ring-2 focus:ring-blue-500/50" />
                      <ErrorMessage name="confirmPassword" component="div" className="text-sm text-red-600 mt-1" />
                    </label>

                    {serverError && <div className="text-sm text-red-700">{serverError}</div>}
                    {successMessage && <div className="text-sm text-green-700">{successMessage}</div>}

                    <div className="flex justify-end gap-2 mt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSubmitting || isSaving}>
                        {isSubmitting || isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}

