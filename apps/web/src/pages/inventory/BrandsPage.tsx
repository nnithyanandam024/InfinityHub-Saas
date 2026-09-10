import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { brandService } from '../../services/brandService';
import { Brand } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  Award,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Package,
  Globe,
  Sparkles,
  Building2,
  Filter,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BrandsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = hasPermission('inventory.brands.manage') || hasPermission('inventory.categories.manage');

  const loadBrands = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const data = await brandService.getBrands(tenant.id);
      setBrands(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load brands', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tenant || !deletingBrand) return;
    if ((deletingBrand.productCount || 0) > 0) {
      showToast(
        `Cannot delete brand "${deletingBrand.name}": ${deletingBrand.productCount} product(s) are associated with it. Please reassign products first.`,
        'error'
      );
      setDeletingBrand(null);
      return;
    }

    setIsDeleting(true);
    try {
      await brandService.deleteBrand(tenant.id, deletingBrand.id);
      showToast(`Brand "${deletingBrand.name}" deleted successfully`, 'success');
      setDeletingBrand(null);
      loadBrands();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete brand', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [tenant?.id]);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.website && b.website.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, statusFilter]);

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      description: '',
      website: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      website: brand.website || '',
      status: brand.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (!formData.name.trim()) {
      showToast('Brand name is required', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBrand) {
        await brandService.updateBrand(tenant.id, editingBrand.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          website: formData.website.trim() || undefined,
          status: formData.status
        });
        showToast(`Brand "${formData.name}" updated successfully`, 'success');
      } else {
        await brandService.createBrand(tenant.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          website: formData.website.trim() || undefined,
          status: formData.status
        });
        showToast(`Brand "${formData.name}" created successfully`, 'success');
      }
      setIsModalOpen(false);
      loadBrands();
    } catch (err: any) {
      showToast(err.message || 'Failed to save brand', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalProducts = brands.reduce((acc, b) => acc + (b.productCount || 0), 0);
  const activeBrands = brands.filter(b => b.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-primary-600" />
            Brand Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize catalog products by official manufacturers, licensed labels, and vendor brands.
          </p>
        </div>
        {canManage && (
          <Button
            type="button"
            variant="primary"
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Brand
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/50 rounded-xl text-primary-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Brands</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{brands.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Brands</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{activeBrands}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Branded Products</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search brands by name, description, website..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands Grid / List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Loading brands directory..." />
        </div>
      ) : filteredBrands.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Brands Found"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No brands matched your filter criteria. Try clearing search filters.'
              : 'Start organizing your catalog by adding manufacturer and supplier brands.'
          }
          actionLabel={canManage && !searchQuery && statusFilter === 'ALL' ? 'Add First Brand' : undefined}
          onAction={canManage && !searchQuery && statusFilter === 'ALL' ? openCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/10 to-indigo-500/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center font-bold text-primary-600 text-lg">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {brand.name}
                      </h3>
                      {brand.website && (
                        <a
                          href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{brand.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>
                  <Badge variant={brand.status === 'active' ? 'success' : 'neutral'}>
                    {brand.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 min-h-[32px] mb-4">
                  {brand.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>{brand.productCount || 0} Products</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/inventory/products?brand=${brand.id}`)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    View Catalog
                  </button>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(brand)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Brand"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBrand(brand)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? 'Edit Brand' : 'Add New Brand'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aashirvaad, Britannia, Amul"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Website
            </label>
            <input
              type="text"
              placeholder="https://brand.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the brand, vendor lineage, or product line..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create Brand'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Brand Confirmation Modal */}
      <Modal
        isOpen={!!deletingBrand}
        onClose={() => setDeletingBrand(null)}
        title="Delete Brand"
        description="Verify brand removal"
        maxWidth="sm"
      >
        {deletingBrand && (
          <div className="space-y-4">
            {(deletingBrand.productCount || 0) > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">Cannot Delete Brand</p>
                  <p className="mt-1 text-amber-800 leading-relaxed">
                    This brand currently has <span className="font-bold">{deletingBrand.productCount}</span> active product(s) associated with it. Please reassign products before removing this brand.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete the brand <span className="font-bold text-slate-900">"{deletingBrand.name}"</span>?
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingBrand(null)}
              >
                Cancel
              </Button>
              {(deletingBrand.productCount || 0) === 0 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={isDeleting}
                  onClick={handleConfirmDelete}
                >
                  Delete Brand
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
