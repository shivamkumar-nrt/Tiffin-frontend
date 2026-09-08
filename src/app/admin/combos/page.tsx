'use client';

import React, { useState, useEffect } from 'react';
import { comboService, menuService } from '@/services/api';
import { ComboPackage, MenuItem, TiffinType } from '@/types';
import {
  PackageCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  Utensils,
  Sparkles,
  Search,
  X
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { useToast } from '@/context/ToastContext';

export default function AdminCombosPage() {
  const toast = useToast();
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Form State
  const [name, setName] = useState('');
  const [tiffinType, setTiffinType] = useState<TiffinType>('FULL');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comboRes, itemsRes] = await Promise.all([
        comboService.getAllCombos(),
        menuService.getAllMenuItems(),
      ]);

      if (comboRes.success && comboRes.data) {
        setCombos(comboRes.data);
      }
      if (itemsRes.success && itemsRes.data) {
        setMenuItems(itemsRes.data);
      }
    } catch (err) {
      toast.error('Failed to load combos catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setTiffinType('FULL');
    setPrice('');
    setDescription('');
    setSelectedDishes([]);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (combo: ComboPackage) => {
    setEditingId(combo.id || null);
    setName(combo.name);
    setTiffinType(combo.tiffinType);
    setPrice(String(combo.price));
    setDescription(combo.description || '');
    setSelectedDishes(combo.includedItems || []);
    setIsActive(combo.active);
    setShowModal(true);
  };

  const toggleDishSelection = (dishName: string) => {
    if (selectedDishes.includes(dishName)) {
      setSelectedDishes(selectedDishes.filter((d) => d !== dishName));
    } else {
      setSelectedDishes([...selectedDishes, dishName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(price) <= 0) {
      toast.warning('Please provide a valid combo name and price');
      return;
    }

    try {
      setSubmitting(true);
      const payload: ComboPackage = {
        name: name.trim(),
        tiffinType,
        price: Number(price),
        description: description.trim(),
        includedItems: selectedDishes,
        active: isActive,
      };

      if (editingId) {
        await comboService.updateCombo(editingId, payload);
        toast.success(`Combo '${name}' updated successfully!`);
      } else {
        await comboService.createCombo(payload);
        toast.success(`Combo '${name}' created successfully!`);
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save combo package');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, comboName: string) => {
    if (!confirm(`Are you sure you want to delete combo '${comboName}'?`)) return;
    try {
      await comboService.deleteCombo(id);
      toast.info(`Combo '${comboName}' deleted`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete combo');
    }
  };

  const filteredCombos = combos.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || c.tiffinType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredCombos.length / pageSize) || 1;
  const paginatedCombos = filteredCombos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span>Combos & Thali Packages</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Full Thali, Half Thali, and special food combos with specific dishes and prices.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Combo / Thali</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search combo by name, dish..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {(['ALL', 'FULL', 'HALF'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setTypeFilter(tab);
                setCurrentPage(1);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                typeFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Combos' : tab === 'FULL' ? 'Full Thalis' : 'Half Thalis'}
            </button>
          ))}
        </div>
      </div>

      {/* Combos Grid */}
      {loading ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
          <Loader text="Loading meal packages..." />
        </div>
      ) : paginatedCombos.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCombos.map((combo) => (
              <div
                key={combo.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition"
              >
                <div className="space-y-3">
                  {/* Title & Price Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        combo.tiffinType === 'FULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {combo.tiffinType}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 mt-1">{combo.name}</h2>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-600">
                        Rs. {Number(combo.price).toFixed(2)}
                      </div>
                      <span className={`text-[10px] font-bold ${combo.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {combo.active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {combo.description && (
                    <p className="text-xs text-slate-500">{combo.description}</p>
                  )}

                  {/* Included Dishes / Food Items */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Included Dishes ({combo.includedItems?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {combo.includedItems && combo.includedItems.length > 0 ? (
                        combo.includedItems.map((dish, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-medium text-slate-700"
                          >
                            {dish}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Standard Daily Thali items</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(combo)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => combo.id && handleDelete(combo.id, combo.name)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCombos.length}
              pageSize={pageSize}
              pageSizeOptions={[6, 12, 24]}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Combos or Thalis Found</h3>
          <p className="text-xs text-slate-500 mt-1">Click &apos;Create New Combo / Thali&apos; to add your first package.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Combo / Thali Package' : 'Create New Combo / Thali Package'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Combo / Thali Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Full Thali or Special Combo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category Type
                  </label>
                  <select
                    value={tiffinType}
                    onChange={(e) => setTiffinType(e.target.value as TiffinType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="FULL">FULL Thali / Big Combo</option>
                    <option value="HALF">HALF Thali / Mini Combo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Package Price (Rs.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 120.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Servings Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 4 Phulkas + 1 Paneer Dish + 1 Dal + Rice + Dessert"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Select Included Dishes from Menu */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Select Included Dishes from Menu ({selectedDishes.length} selected)
                  </label>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto space-y-1.5">
                  {menuItems.length > 0 ? (
                    menuItems.map((dish) => {
                      const isSelected = selectedDishes.includes(dish.name);
                      return (
                        <label
                          key={dish.id}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-emerald-100/70 text-emerald-900 font-semibold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDishSelection(dish.name)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{dish.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({dish.category.replace('_', ' ')})
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-2">
                      No menu dishes created yet. Go to Menu Items to add dishes first.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="activeToggle" className="text-xs font-semibold text-slate-700">
                  Active (Visible for users to order)
                </label>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Combo' : 'Create Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}