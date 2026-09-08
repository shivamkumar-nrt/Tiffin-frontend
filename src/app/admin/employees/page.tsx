'use client';

import React, { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import { User, UserStatus } from '@/types';
import { Users, Plus, Search, Shield, CheckCircle, XCircle, Check, KeyRound, X, RotateCcw } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { useToast } from '@/context/ToastContext';

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // New User Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'ROLE_EMPLOYEE' | 'ROLE_ADMIN'>('ROLE_EMPLOYEE');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('Password@123');
  const [resetting, setResetting] = useState(false);

  const loadUsers = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        search: search.trim() || undefined,
        page: page - 1,
        size: size,
      });
      if (res.success && res.data) {
        setUsers(res.data.content);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      toast.error('Failed to load users directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadUsers(1, pageSize);
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadUsers(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadUsers(1, newSize);
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await userService.updateUserStatus(user.id, nextStatus);
      if (res.success) {
        toast.info(`Updated ${user.fullName} to ${nextStatus}`);
        await loadUsers(currentPage, pageSize);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await userService.createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
      });

      if (res.success) {
        toast.success(`User '${fullName}' created successfully!`);
        setShowModal(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('Password@123');
        await loadUsers(currentPage, pageSize);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'User creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    try {
      setResetting(true);
      const res = await userService.resetUserPassword(resetModalUser.id, newPassword);
      if (res.success) {
        toast.success(`Password for ${resetModalUser.email} has been updated to '${newPassword}'!`);
        setResetModalUser(null);
        setNewPassword('Password@123');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setResetting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Users Directory & Account Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View registered users, manage account statuses, reset passwords, and track individual dues.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700"
          >
            <option value="ALL">All Roles (Admin & Customer)</option>
            <option value="ROLE_EMPLOYEE">Customer / User</option>
            <option value="ROLE_ADMIN">Administrator</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">ACTIVE Users</option>
            <option value="INACTIVE">INACTIVE Users</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Name & Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Outstanding Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Loader text="Loading users directory..." />
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {u.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-800">
                      Rs. {Number(u.outstandingBalance || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setResetModalUser(u);
                          setNewPassword('Password@123');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1"
                        title="Set new password for this user"
                      >
                        <KeyRound className="w-3 h-3 text-orange-600" />
                        <span>Reset Password</span>
                      </button>

                      {u.role !== 'ROLE_ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-50 hover:bg-red-100 text-red-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No users found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New User Account</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                >
                  <option value="ROLE_EMPLOYEE">Customer / User</option>
                  <option value="ROLE_ADMIN">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password@123"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-orange-600" />
                <span>Reset User Password</span>
              </h2>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
              <div><span className="font-bold">User:</span> {resetModalUser.fullName}</div>
              <div><span className="font-bold">Email:</span> {resetModalUser.email}</div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter New Password
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. Password@123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {resetting ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}