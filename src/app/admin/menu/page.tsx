'use client';

import React, { useState, useEffect } from 'react';
import { menuService } from '@/services/api';
import { MenuItem, ItemCategory } from '@/types';
import { ChefHat, Plus, Trash2, Sparkles, Check, Flame, Candy, Search, Filter } from 'lucide-react';

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('MAIN_COURSE');
  const [description, setDescription] = useState('');
  const [isSpicy, setIsSpicy] = useState(false);
  const [isSweet, setIsSweet] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await menuService.getAllMenuItems();
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load menu items', err);
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
      alert('Please enter dish name');
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const res = await menuService.createMenuItem({
        name: name.trim(),
        category,
        description: description.trim(),
        spicy: isSpicy,
        sweet: isSweet,
        available: true,
      });

      if (res.success) {
        setMessage(`'${name.trim()}' added to menu items successfully!`);
        setName('');
        setDescription('');
        setIsSpicy(false);
        setIsSweet(false);
        await loadItems();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: number, itemName: string) => {
    if (!confirm(`Are you sure you want to delete '${itemName}' from menu?`)) return;
    try {
      const res = await menuService.deleteMenuItem(id);
      if (res.success) {
        setMessage(`'${itemName}' deleted`);
        await loadItems();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <span>Menu Items & Dishes Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add and manage individual dishes, rotis, rice, and sides available in the kitchen.
          </p>
        </div>

        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm font-semibold text-slate-700">
          Total Dishes: <span className="text-orange-600 font-bold">{items.length}</span>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 font-bold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-4 pt-1">
              <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSpicy}
                  onChange={(e) => setIsSpicy(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>Spicy</span>
              </label>

              <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSweet}
                  onChange={(e) => setIsSweet(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <Candy className="w-3.5 h-3.5 text-pink-500" />
                <span>Sweet</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-3 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Adding Dish...' : 'Add Dish to Menu'}</span>
            </button>
          </form>
        </div>

        {/* Dish Catalog Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              All Available Dishes ({filteredItems.length})
            </h2>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dish..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">All Categories</option>
                <option value="MAIN_COURSE">Main Course</option>
                <option value="CURRY">Dal & Curry</option>
                <option value="BREAD">Roti / Bread</option>
                <option value="RICE">Rice & Pulao</option>
                <option value="DESSERT">Sweet / Dessert</option>
                <option value="SALAD">Salad & Sides</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between hover:border-orange-200 hover:bg-orange-50/20 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                        <span>{item.name}</span>
                        {item.spicy && <Flame className="w-3 h-3 text-red-500" />}
                        {item.sweet && <Candy className="w-3 h-3 text-pink-500" />}
                      </div>
                      <div className="text-[10px] text-orange-700 font-bold uppercase mt-0.5">
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
                      onClick={() => item.id && handleDeleteItem(item.id, item.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No dishes found matching criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}