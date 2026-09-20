import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { restaurantService } from '../../services/restaurantService';
import { productService } from '../../services/productService';
import type { RestaurantRecipe, RestaurantMenuItem, Product } from '@infinityhub/types';
import {
  ChefHat,
  Boxes,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Scale
} from 'lucide-react';

export const RestaurantRecipesPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [recipes, setRecipes] = useState<RestaurantRecipe[]>([]);
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RestaurantRecipe | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const tenantId = tenant?.id || 'tenant-xyz-restaurant';

  const loadData = async () => {
    try {
      const [recData, menuData, prodData] = await Promise.all([
        restaurantService.getRecipes(tenantId),
        restaurantService.getMenuItems(tenantId),
        productService.getProducts(tenantId)
      ]);
      setRecipes(recData);
      setMenuItems(menuData);
      setRawProducts(prodData);
      if (recData.length > 0 && !selectedRecipe) {
        setSelectedRecipe(recData[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load recipes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Add ingredient line to selected recipe
  const handleAddIngredient = () => {
    if (!selectedRecipe || rawProducts.length === 0) return;
    const defaultRaw = rawProducts[0];
    const newIngredient = {
      rawMaterialProductId: defaultRaw.id,
      rawMaterialName: defaultRaw.name,
      quantityNeeded: 0.1,
      unit: defaultRaw.unit || 'kg',
      unitCost: defaultRaw.costPrice || 100
    };

    const updatedIngredients = [...selectedRecipe.ingredients, newIngredient];
    const totalCost = Number(
      updatedIngredients.reduce((sum, ing) => sum + ing.quantityNeeded * ing.unitCost, 0).toFixed(2)
    );
    const margin = selectedRecipe.sellingPrice > 0
      ? Number((((selectedRecipe.sellingPrice - totalCost) / selectedRecipe.sellingPrice) * 100).toFixed(1))
      : 0;

    setSelectedRecipe({
      ...selectedRecipe,
      ingredients: updatedIngredients,
      totalCost,
      marginPercentage: margin
    });
  };

  // Remove ingredient line
  const handleRemoveIngredient = (index: number) => {
    if (!selectedRecipe) return;
    const updatedIngredients = selectedRecipe.ingredients.filter((_, idx) => idx !== index);
    const totalCost = Number(
      updatedIngredients.reduce((sum, ing) => sum + ing.quantityNeeded * ing.unitCost, 0).toFixed(2)
    );
    const margin = selectedRecipe.sellingPrice > 0
      ? Number((((selectedRecipe.sellingPrice - totalCost) / selectedRecipe.sellingPrice) * 100).toFixed(1))
      : 0;

    setSelectedRecipe({
      ...selectedRecipe,
      ingredients: updatedIngredients,
      totalCost,
      marginPercentage: margin
    });
  };

  // Update ingredient property
  const handleUpdateIngredient = (index: number, field: string, value: any) => {
    if (!selectedRecipe) return;
    const updatedIngredients = [...selectedRecipe.ingredients];

    if (field === 'rawMaterialProductId') {
      const prod = rawProducts.find(p => p.id === value);
      if (prod) {
        updatedIngredients[index] = {
          ...updatedIngredients[index],
          rawMaterialProductId: prod.id,
          rawMaterialName: prod.name,
          unit: prod.unit || 'kg',
          unitCost: prod.costPrice || 100
        };
      }
    } else if (field === 'quantityNeeded') {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        quantityNeeded: Number(value) || 0
      };
    }

    const totalCost = Number(
      updatedIngredients.reduce((sum, ing) => sum + ing.quantityNeeded * ing.unitCost, 0).toFixed(2)
    );
    const margin = selectedRecipe.sellingPrice > 0
      ? Number((((selectedRecipe.sellingPrice - totalCost) / selectedRecipe.sellingPrice) * 100).toFixed(1))
      : 0;

    setSelectedRecipe({
      ...selectedRecipe,
      ingredients: updatedIngredients,
      totalCost,
      marginPercentage: margin
    });
  };

  // Save recipe
  const handleSaveRecipe = async () => {
    if (!selectedRecipe) return;
    setIsSaving(true);
    try {
      await restaurantService.saveRecipe(tenantId, selectedRecipe);
      showToast(`Recipe for ${selectedRecipe.menuItemName} saved successfully!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save recipe', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete recipe
  const handleDeleteRecipe = async () => {
    if (!selectedRecipe) return;
    if (!window.confirm(`Are you sure you want to delete the recipe BOM for "${selectedRecipe.menuItemName}"?`)) {
      return;
    }
    try {
      await restaurantService.deleteRecipe(tenantId, selectedRecipe.id);
      showToast(`Recipe for ${selectedRecipe.menuItemName} deleted successfully!`, 'info');
      setSelectedRecipe(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete recipe', 'error');
    }
  };

  const isExistingRecipe = recipes.some(r => r.id === selectedRecipe?.id);

  // Create new recipe template for an unmapped menu item
  const handleSelectMenuItem = (item: RestaurantMenuItem) => {
    const existing = recipes.find(r => r.menuItemId === item.id);
    if (existing) {
      setSelectedRecipe(existing);
    } else {
      const newRec: RestaurantRecipe = {
        id: `rec-${Date.now()}`,
        menuItemId: item.id,
        menuItemName: item.name,
        portionSize: '1 Standard Portion',
        ingredients: [],
        totalCost: 0,
        sellingPrice: item.price,
        marginPercentage: 100,
        notes: 'Configured recipe for stock auto-deduction'
      };
      setSelectedRecipe(newRec);
    }
  };

  const filteredMenuItems = menuItems.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-[18px] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A] font-display">
                Recipe & Bill of Materials (BOM) Control
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Kitchen Anti-Theft
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Link menu dishes to raw inventory ingredients. Billed orders automatically deduct raw materials from stock to prevent kitchen shrinkage.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Dishes List (Left) vs Recipe Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Menu Items Directory */}
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-2xs space-y-4 flex flex-col h-[75vh]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Menu Items ({menuItems.length})
            </h2>
            <span className="text-xs font-semibold text-slate-500">{recipes.length} Mapped</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter dishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredMenuItems.map(item => {
              const hasRecipe = recipes.some(r => r.menuItemId === item.id);
              const isSelected = selectedRecipe?.menuItemId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectMenuItem(item)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-500">
                      Code: {item.code} · ₹{item.price}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      hasRecipe
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {hasRecipe ? 'BOM Active' : 'Unmapped'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recipe Ingredients Editor */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-2xs space-y-6 flex flex-col justify-between">
          {selectedRecipe ? (
            <div className="space-y-6">
              {/* Recipe Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedRecipe.menuItemName}
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Portion: {selectedRecipe.portionSize}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selling Price: ₹{selectedRecipe.sellingPrice} · Food Cost: ₹{selectedRecipe.totalCost.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Gross Margin</div>
                    <div className="text-lg font-extrabold text-emerald-700 font-display">
                      {selectedRecipe.marginPercentage}%
                    </div>
                  </div>

                  {isExistingRecipe && (
                    <button
                      type="button"
                      onClick={handleDeleteRecipe}
                      className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Delete Recipe BOM"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete BOM</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveRecipe}
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Recipe'}</span>
                  </button>
                </div>
              </div>

              {/* Recipe Ingredients Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Raw Material Ingredients ({selectedRecipe.ingredients.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Raw Material</span>
                  </button>
                </div>

                {selectedRecipe.ingredients.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <Scale className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No Raw Materials Mapped Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click &quot;Add Raw Material&quot; to link Paneer, Butter, Meat, or Spices from the raw material inventory.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Raw Ingredient</th>
                          <th className="py-2.5 px-4 w-32">Qty Needed</th>
                          <th className="py-2.5 px-4 w-24">Unit</th>
                          <th className="py-2.5 px-4 w-28">Line Cost</th>
                          <th className="py-2.5 px-3 w-12 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRecipe.ingredients.map((ing, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-4">
                              <select
                                value={ing.rawMaterialProductId}
                                onChange={e => handleUpdateIngredient(idx, 'rawMaterialProductId', e.target.value)}
                                className="w-full p-1.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg bg-white outline-hidden"
                              >
                                {rawProducts.map(prod => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.name} (Stock: {prod.stockQuantity} {prod.unit})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2.5 px-4">
                              <input
                                type="number"
                                step="0.01"
                                min="0.001"
                                value={ing.quantityNeeded}
                                onChange={e => handleUpdateIngredient(idx, 'quantityNeeded', e.target.value)}
                                className="w-full p-1.5 text-xs font-bold text-slate-900 border border-slate-200 rounded-lg bg-white outline-hidden text-center"
                              />
                            </td>

                            <td className="py-2.5 px-4 font-mono text-slate-500">
                              {ing.unit}
                            </td>

                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              ₹{(ing.quantityNeeded * ing.unitCost).toFixed(2)}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(idx)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recipe Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Preparation & Cooking Standard
                </label>
                <input
                  type="text"
                  value={selectedRecipe.notes || ''}
                  onChange={e => setSelectedRecipe({ ...selectedRecipe, notes: e.target.value })}
                  placeholder="e.g. Standard 8 pieces of paneer with 450g rich gravy"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <ChefHat className="w-12 h-12 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Select a dish from the left to configure its recipe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
