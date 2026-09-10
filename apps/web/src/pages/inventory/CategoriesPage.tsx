import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { categoryService } from '../../services/categoryService';
import { Category } from '@infinityhub/types';
import { categorySchema, CategoryFormData } from '@infinityhub/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../../components/ui/EmptyState';
import { Layers, Plus, FolderTree, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active'
    }
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema)
  });

  const loadCategories = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const cats = await categoryService.getCategories(tenant.id);
      setCategories(cats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.type?.startsWith('category:')) {
        loadCategories();
      }
    };
    window.addEventListener('infinityhub:sync', handleSync);
    return () => window.removeEventListener('infinityhub:sync', handleSync);
  }, [tenant?.id]);

  const onSubmit = async (data: CategoryFormData) => {
    if (!tenant) return;
    setIsSubmitting(true);
    try {
      await categoryService.createCategory(tenant.id, {
        name: data.name,
        description: data.description || '',
        status: data.status as any
      });
      showToast(`Category "${data.name}" added successfully!`, 'success');
      reset();
      setIsAddModalOpen(false);
      loadCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setEditValue('name', category.name);
    setEditValue('description', category.description || '');
    setEditValue('status', category.status);
    setIsEditModalOpen(true);
  };

  const onUpdateSubmit = async (data: CategoryFormData) => {
    if (!tenant || !editingCategory) return;
    setIsUpdating(true);
    try {
      await categoryService.updateCategory(tenant.id, editingCategory.id, {
        name: data.name,
        description: data.description || '',
        status: data.status as any
      });
      showToast(`Category "${data.name}" updated successfully!`, 'success');
      setIsEditModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to update category', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tenant || !deletingCategory) return;
    if ((deletingCategory.productCount || 0) > 0) {
      showToast(
        `Cannot delete "${deletingCategory.name}": ${deletingCategory.productCount} product(s) are assigned to it. Reassign or delete products first.`,
        'error'
      );
      setDeletingCategory(null);
      return;
    }

    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(tenant.id, deletingCategory.id);
      showToast(`Category "${deletingCategory.name}" removed successfully!`, 'success');
      setDeletingCategory(null);
      loadCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading category hierarchy..." />;

  const canManage = hasPermission('inventory.categories.manage');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Product Categories
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Organize catalog products into structured groups for reporting and POS speed.
          </p>
        </div>

        {canManage && (
          <Button size="sm" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Category
          </Button>
        )}
      </div>

      {/* Categories Table */}
      <Card>
        {categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories created"
            description="Categories help structure your inventory items logically."
            actionLabel={canManage ? 'Add Category' : undefined}
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Active Products</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {cat.productCount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={cat.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {cat.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Category"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete Category"
                            onClick={() => setDeletingCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Category"
        description="Define a new department or grouping for products"
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g., Grocery, Beverages, Electronics"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Description (Optional)"
            placeholder="Brief notes about products in this category"
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
        title="Edit Category"
        description="Update category name and operational status"
        maxWidth="sm"
      >
        <form onSubmit={handleSubmitEdit(onUpdateSubmit)} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g., Grocery, Beverages, Electronics"
            {...registerEdit('name')}
            error={editErrors.name?.message}
          />

          <Input
            label="Description (Optional)"
            placeholder="Brief notes about products in this category"
            {...registerEdit('description')}
            error={editErrors.description?.message}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isUpdating}>
              Update Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Delete Category"
        description="Verify category removal"
        maxWidth="sm"
      >
        {deletingCategory && (
          <div className="space-y-4">
            {(deletingCategory.productCount || 0) > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">Cannot Delete Category</p>
                  <p className="mt-1 text-amber-800 leading-relaxed">
                    This category currently has <span className="font-bold">{deletingCategory.productCount}</span> active product(s) assigned to it. Please reassign or delete the products before removing this category.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete the category <span className="font-bold text-slate-900">"{deletingCategory.name}"</span>? This action cannot be undone.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCategory(null)}
              >
                Cancel
              </Button>
              {(deletingCategory.productCount || 0) === 0 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={isDeleting}
                  onClick={handleConfirmDelete}
                >
                  Delete Category
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
