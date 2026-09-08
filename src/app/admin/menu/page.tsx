'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { menuService } from '@/services/api';
import { MenuItem, ItemCategory } from '@/types';
import { ChefHat, Plus, Trash2, Check, Flame, Candy, Search, Filter, RefreshCw, X } from 'lucide-react';
import Loader from '@/components/Loader';
import Pagination from '@/components/Pagination';
import { useToast } from '@/context/ToastContext';

export default function AdminMenuPage() {
  const { showSuccess, showError, showWarning } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterSpicy, setFilterSpicy] = useState<string>('ALL'); // 'ALL' | 'YES' | 'NO'
  const [filterSweet, setFilterSweet] = useState<string>('ALL'); // 'ALL' | 'YES' | 'NO'

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('MAIN_COURSE');
  const [description, setDescription] = useState('');
  const [isSpicy, setIsSpicy] = useState(false);
  const [isSweet, setIsSweet] = useState(false);

  // Delete modal confirmation
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await menuService.getAllMenuItems();
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showWarning('Please enter dish name');
      return;
    }

    try {
      setSaving(true);
      const res = await menuService.createMenuItem({
        name: name.trim(),
        category,
        description: description.trim(),
        spicy: isSpicy,
        sweet: isSweet,
        available: true,
      });

      if (res.success) {
        showSuccess(`'${name.trim()}' added to menu items successfully!`);
        setName('');
        setDescription('');
        setIsSpicy(false);
        setIsSweet(false);
        await loadItems();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem || !deletingItem.id) return;
    try {
      setDeleting(true);
      const res = await menuService.deleteMenuItem(deletingItem.id);
      if (res.success) {
        showSuccess(`'${deletingItem.name}' deleted successfully`);
        setDeletingItem(null);
        await loadItems();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSpicy = filterSpicy === 'ALL' || (filterSpicy === 'YES' ? item.spicy : !item.spicy);
      const matchesSweet = filterSweet === 'ALL' || (filterSweet === 'YES' ? item.sweet : !item.sweet);
      return matchesSearch && matchesCategory && matchesSpicy && matchesSweet;
    });
  }, [items, search, selectedCategory, filterSpicy, filterSweet]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, filterSpicy, filterSweet, limit]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-emerald-600" />
            <span>Menu Items & Dishes Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add and manage individual dishes, rotis, rice, and sides available in the kitchen.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadItems}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Dishes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm font-semibold text-slate-700">
            Total Dishes: <span className="text-emerald-600 font-bold">{items.length}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Add Dish Form (Left) & Dish List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Food Item Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Add New Food Item</h2>

          <form onSubmit={handleAddItem} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dish Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shahi Paneer, Dal Tadka, Tawa Roti"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MAIN_COURSE">Main Course / Paneer / Veg</option>
                <option value="CURRY">Dal / Curry / Gravy</option>
                <option value="BREAD">Roti / Phulka / Poori</option>
                <option value="RICE">Rice / Pulao / Biryani</option>
                <option value="DESSERT">Sweet / Dessert</option>
                <option value="SALAD">Salad / Papad / Chutney</option>
                <option value="BEVERAGE">Beverage / Chaas / Lassi</option>
                <option value="SPECIAL">Special Item</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fresh home style preparation with mild spices"
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-4 pt-1">
              <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSpicy}
                  onChange={(e) => setIsSpicy(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>Spicy</span>
              </label>

              <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSweet}
                  onChange={(e) => setIsSweet(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Candy className="w-3.5 h-3.5 text-pink-500" />
                <span>Sweet</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Adding Dish...' : 'Add Dish to Menu'}</span>
            </button>
          </form>
        </div>

        {/* Dish Catalog Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                All Available Dishes ({filteredItems.length})
              </h2>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search dish..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="MAIN_COURSE">Main Course</option>
                  <option value="CURRY">Dal & Curry</option>
                  <option value="BREAD">Roti / Bread</option>
                  <option value="RICE">Rice & Pulao</option>
                  <option value="DESSERT">Sweet / Dessert</option>
                  <option value="SALAD">Salad & Sides</option>
                  <option value="BEVERAGE">Beverage</option>
                  <option value="SPECIAL">Special</option>
                </select>

                <select
                  value={filterSpicy}
                  onChange={(e) => setFilterSpicy(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Spicy: Any</option>
                  <option value="YES">🌶️ Spicy Only</option>
                  <option value="NO">Non-Spicy</option>
                </select>

                <select
                  value={filterSweet}
                  onChange={(e) => setFilterSweet(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Sweet: Any</option>
                  <option value="YES">🍬 Sweet Only</option>
                  <option value="NO">Non-Sweet</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16">
                <Loader text="Loading menu catalog..." />
              </div>
            ) : paginatedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {paginatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between hover:border-emerald-200 hover:bg-emerald-50/20 transition group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                          <span>{item.name}</span>
                          {item.spicy && (
                            <span title="Spicy">
                              <Flame className="w-3 h-3 text-red-500" />
                            </span>
                          )}
                          {item.sweet && (
                            <span title="Sweet">
                              <Candy className="w-3 h-3 text-pink-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold uppercase mt-0.5">
                          {item.category.replace('_', ' ')}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {item.description}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition opacity-80 group-hover:opacity-100"
                        title="Delete dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                No dishes found matching criteria.
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredItems.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <Pagination
                totalItems={filteredItems.length}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
                pageSizeOptions={[6, 10, 20, 50]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeletingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Dish?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-700">{deletingItem.name}</strong> from the kitchen menu? This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}