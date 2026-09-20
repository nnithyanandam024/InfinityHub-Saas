import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { restaurantService } from '../../services/restaurantService';
import type {
  RestaurantMenuItem,
  KitchenStation,
  DietaryType,
  RestaurantModifierGroup
} from '@infinityhub/types';
import {
  Utensils,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Sparkles,
  RefreshCw,
  ChefHat,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Coffee,
  DollarSign
} from 'lucide-react';

export const RestaurantMenuPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const [selectedStation, setSelectedStation] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RestaurantMenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<RestaurantMenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form state for Add/Edit
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    categoryName: string;
    price: number;
    taxRate: number;
    prepTimeMinutes: number;
    station: KitchenStation;
    dietary: DietaryType;
    description: string;
    isAvailable: boolean;
  }>({
    name: '',
    code: '',
    categoryName: 'Mains',
    price: 150,
    taxRate: 5,
    prepTimeMinutes: 10,
    station: 'kitchen',
    dietary: 'veg',
    description: '',
    isAvailable: true
  });

  const tenantId = tenant?.id || 'tenant-xyz-restaurant';

  const loadData = async () => {
    try {
      const items = await restaurantService.getMenuItems(tenantId);
      setMenuItems(items);
    } catch (err: any) {
      showToast(err.message || 'Failed to load menu items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Unique categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(i => i.categoryName || 'General'))).filter(Boolean);
    return cats;
  }, [menuItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && (item.categoryName || 'General') !== selectedCategory) return false;
      if (selectedDietary !== 'all' && item.dietary !== selectedDietary) return false;
      if (selectedStation !== 'all' && item.station !== selectedStation) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, selectedDietary, selectedStation, searchQuery]);

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      code: '',
      categoryName: categories[0] || 'Mains',
      price: 180,
      taxRate: 5,
      prepTimeMinutes: 12,
      station: 'kitchen',
      dietary: 'veg',
      description: '',
      isAvailable: true
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: RestaurantMenuItem) => {
    setFormData({
      name: item.name,
      code: item.code,
      categoryName: item.categoryName || 'General',
      price: item.price,
      taxRate: item.taxRate ?? 5,
      prepTimeMinutes: item.prepTimeMinutes || 10,
      station: item.station || 'kitchen',
      dietary: item.dietary || 'veg',
      description: item.description || '',
      isAvailable: item.isAvailable ?? true
    });
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Dish name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await restaurantService.updateMenuItem(tenantId, editingItem.id, {
          name: formData.name,
          code: formData.code,
          categoryName: formData.categoryName,
          price: Number(formData.price),
          taxRate: Number(formData.taxRate),
          prepTimeMinutes: Number(formData.prepTimeMinutes),
          station: formData.station,
          dietary: formData.dietary,
          description: formData.description,
          isAvailable: formData.isAvailable
        });
        showToast(`Updated dish "${formData.name}"`, 'success');
      } else {
        await restaurantService.createMenuItem(tenantId, {
          name: formData.name,
          code: formData.code,
          categoryName: formData.categoryName,
          price: Number(formData.price),
          taxRate: Number(formData.taxRate),
          prepTimeMinutes: Number(formData.prepTimeMinutes),
          station: formData.station,
          dietary: formData.dietary,
          description: formData.description,
          isAvailable: formData.isAvailable
        });
        showToast(`Added dish "${formData.name}" to menu catalog`, 'success');
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save menu item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (item: RestaurantMenuItem) => {
    try {
      const updated = await restaurantService.toggleMenuItemAvailability(tenantId, item.id);
      showToast(
        `"${item.name}" marked as ${updated.isAvailable ? 'In Stock (Available)' : 'Out of Stock (86ed)'}`,
        updated.isAvailable ? 'success' : 'info'
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle availability', 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      await restaurantService.deleteMenuItem(tenantId, deletingItem.id);
      showToast(`Deleted dish "${deletingItem.name}"`, 'success');
      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete dish', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPIs
  const totalDishes = menuItems.length;
  const availableDishes = menuItems.filter(i => i.isAvailable).length;
  const avgPrice = totalDishes > 0
    ? Math.round(menuItems.reduce((acc, i) => acc + i.price, 0) / totalDishes)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-xs font-semibold">Loading Restaurant Menu Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-[18px] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A] font-display">
                  Digital Menu & Dishes Catalog
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wider">
                  Menu Master
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure food & beverage items, prices, dietary classifications, and kitchen prep stations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Refresh menu items"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={openAddModal}
              className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>
        </div>

        {/* Telemetry KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Menu Items</div>
            <div className="text-xl font-extrabold text-[#0F172A] mt-1 font-display">{totalDishes}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active / In-Stock</div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1 font-display">
              {availableDishes}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({totalDishes > 0 ? Math.round((availableDishes / totalDishes) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Categories</div>
            <div className="text-xl font-extrabold text-[#0F172A] mt-1 font-display">{categories.length}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Dish Price</div>
            <div className="text-xl font-extrabold text-orange-600 mt-1 font-display">₹{avgPrice}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by dish name or code (e.g. PBM, Biryani)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold outline-hidden focus:bg-white focus:border-orange-500"
            >
              <option value="all">All Categories ({menuItems.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Dietary Filter */}
            <select
              value={selectedDietary}
              onChange={e => setSelectedDietary(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold outline-hidden focus:bg-white focus:border-orange-500"
            >
              <option value="all">All Dietary</option>
              <option value="veg">Vegetarian (🌱)</option>
              <option value="non_veg">Non-Vegetarian (🍗)</option>
              <option value="vegan">Vegan (🌿)</option>
              <option value="egg">Egg (🥚)</option>
            </select>

            {/* Station Filter */}
            <select
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold outline-hidden focus:bg-white focus:border-orange-500"
            >
              <option value="all">All Stations</option>
              <option value="kitchen">Main Kitchen</option>
              <option value="tandoor">Tandoor</option>
              <option value="bar">Bar & Drinks</option>
              <option value="dessert">Dessert</option>
              <option value="pantry">Pantry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between shadow-2xs hover:shadow-md bg-white ${
                item.isAvailable ? 'border-slate-200' : 'border-slate-200 bg-slate-50/70 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 font-mono font-extrabold text-xs flex items-center justify-center shrink-0">
                      {item.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h3>
                        {item.dietary === 'veg' && (
                          <span className="w-3.5 h-3.5 rounded-xs border border-emerald-600 p-0.5 flex items-center justify-center shrink-0" title="Vegetarian">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          </span>
                        )}
                        {item.dietary === 'non_veg' && (
                          <span className="w-3.5 h-3.5 rounded-xs border border-rose-600 p-0.5 flex items-center justify-center shrink-0" title="Non-Vegetarian">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.categoryName || 'General'}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-slate-900 font-display shrink-0">
                    ₹{item.price}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize">
                    {item.station} station
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {item.prepTimeMinutes || 10}m prep
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                    {item.taxRate || 5}% GST
                  </span>
                </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item)}
                  className={`text-xs font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    item.isAvailable
                      ? 'text-emerald-700 hover:bg-emerald-50'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                  title={item.isAvailable ? 'Click to 86 / mark Out of Stock' : 'Click to mark In Stock'}
                >
                  {item.isAvailable ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                      <span>In Stock</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-400" />
                      <span>Out of Stock</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Edit dish attributes"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete dish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <Utensils className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No dishes match your filters</h3>
          <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query, or click "Add New Dish".</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT DISH */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Menu Item'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set dish pricing, short code, dietary classification, and kitchen routing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dish Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabadi Mutton Dum Biryani"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Code (KOT Tag)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HMB"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Biryani & Rice"
                    value={formData.categoryName}
                    onChange={e => setFormData({ ...formData, categoryName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GST Tax Rate (%)
                  </label>
                  <select
                    value={formData.taxRate}
                    onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% (Standard Restaurant GST)</option>
                    <option value={12}>12% (Packaged / Bakery)</option>
                    <option value={18}>18% (Beverages / Hotel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dietary Classification
                  </label>
                  <select
                    value={formData.dietary}
                    onChange={e => setFormData({ ...formData, dietary: e.target.value as DietaryType })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  >
                    <option value="veg">Vegetarian (🌱)</option>
                    <option value="non_veg">Non-Vegetarian (🍗)</option>
                    <option value="vegan">Vegan (🌿)</option>
                    <option value="egg">Contains Egg (🥚)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kitchen Station
                  </label>
                  <select
                    value={formData.station}
                    onChange={e => setFormData({ ...formData, station: e.target.value as KitchenStation })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  >
                    <option value="kitchen">Main Kitchen</option>
                    <option value="tandoor">Tandoor</option>
                    <option value="bar">Bar & Beverages</option>
                    <option value="dessert">Dessert</option>
                    <option value="pantry">Pantry & Salads</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={formData.prepTimeMinutes}
                    onChange={e => setFormData({ ...formData, prepTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dish Description / Ingredients summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fragrant basmati rice layered with slow-cooked marinated mutton and rich saffron spices."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE DISH CONFIRMATION */}
      {/* ======================================================== */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Menu Item?</h3>
                <p className="text-xs text-slate-500 font-medium">{deletingItem.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently remove <strong>{deletingItem.name}</strong> from your menu catalog?
              If any active orders contain this dish, deletion will be blocked by system safety guards.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteItem}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Dish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
