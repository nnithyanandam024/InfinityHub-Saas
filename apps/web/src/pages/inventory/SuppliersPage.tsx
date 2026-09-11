import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '@infinityhub/types';
import { supplierSchema, SupplierFormData } from '@infinityhub/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../../components/ui/EmptyState';
import { Truck, Plus, Phone, Mail, Building, Edit2, Trash2 } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      companyName: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      status: 'active'
    }
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema)
  });

  const loadSuppliers = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const sups = await supplierService.getSuppliers(tenant.id);
      setSuppliers(sups);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.type?.startsWith('supplier:')) {
        loadSuppliers();
      }
    };
    window.addEventListener('infinityhub:sync', handleSync);
    return () => window.removeEventListener('infinityhub:sync', handleSync);
  }, [tenant?.id]);

  const onSubmit = async (data: SupplierFormData) => {
    if (!tenant) return;
    setIsSubmitting(true);
    try {
      await supplierService.createSupplier(tenant.id, {
        name: data.name,
        companyName: data.companyName,
        phone: data.phone,
        email: data.email,
        address: data.address || '',
        taxNumber: data.taxNumber || '',
        status: data.status as any
      });
      showToast(`Supplier "${data.companyName}" added successfully!`, 'success');
      reset();
      setIsAddModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      showToast(err.message || 'Failed to create supplier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setEditValue('name', sup.name);
    setEditValue('companyName', sup.companyName);
    setEditValue('phone', sup.phone);
    setEditValue('email', sup.email);
    setEditValue('address', sup.address || '');
    setEditValue('taxNumber', sup.taxNumber || '');
    setEditValue('status', sup.status);
    setIsEditModalOpen(true);
  };

  const onUpdateSubmit = async (data: SupplierFormData) => {
    if (!tenant || !editingSupplier) return;
    setIsUpdating(true);
    try {
      await supplierService.updateSupplier(tenant.id, editingSupplier.id, {
        name: data.name,
        companyName: data.companyName,
        phone: data.phone,
        email: data.email,
        address: data.address || '',
        taxNumber: data.taxNumber || '',
        status: data.status as any
      });
      showToast(`Supplier "${data.companyName}" updated successfully!`, 'success');
      setIsEditModalOpen(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update supplier', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tenant || !deletingSupplier) return;
    setIsDeleting(true);
    try {
      await supplierService.deleteSupplier(tenant.id, deletingSupplier.id);
      showToast(`Supplier "${deletingSupplier.companyName}" removed successfully!`, 'success');
      setDeletingSupplier(null);
      loadSuppliers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading supplier vendors..." />;

  const canManage = hasPermission('inventory.suppliers.manage');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Suppliers & Vendors
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage distributor contacts, wholesale terms, and purchase billing references.
          </p>
        </div>

        {canManage && (
          <Button size="sm" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Supplier
          </Button>
        )}
      </div>

      {/* Suppliers Table */}
      <Card>
        {suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers registered"
            description="Suppliers provide goods for purchase orders and inventory replenishments."
            actionLabel={canManage ? 'Add Supplier' : undefined}
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Tax / GST Number</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{sup.companyName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {sup.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {sup.taxNumber || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={sup.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {sup.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Supplier"
                            onClick={() => handleOpenEdit(sup)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete Supplier"
                            onClick={() => setDeletingSupplier(sup)}
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

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Supplier"
        description="Register a wholesale supplier for purchasing and replenishment"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              placeholder="e.g., Ravi Traders Wholesale"
              {...register('companyName')}
              error={errors.companyName?.message}
            />

            <Input
              label="Contact Person Name"
              required
              placeholder="e.g., Ravi Verma"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Phone Number"
              required
              placeholder="e.g., +91 98401 23456"
              {...register('phone')}
              error={errors.phone?.message}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="orders@supplier.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Tax Number / GST"
              placeholder="e.g., 33AABCU9603R1ZM"
              {...register('taxNumber')}
              error={errors.taxNumber?.message}
            />

            <Input
              label="Warehouse / Office Address"
              placeholder="e.g., 10 Industrial Estate, Chennai"
              {...register('address')}
              error={errors.address?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSupplier(null);
        }}
        title="Edit Supplier"
        description="Update vendor contact and billing credentials"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitEdit(onUpdateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              placeholder="e.g., Ravi Traders Wholesale"
              {...registerEdit('companyName')}
              error={editErrors.companyName?.message}
            />

            <Input
              label="Contact Person Name"
              required
              placeholder="e.g., Ravi Verma"
              {...registerEdit('name')}
              error={editErrors.name?.message}
            />

            <Input
              label="Phone Number"
              required
              placeholder="e.g., +91 98401 23456"
              {...registerEdit('phone')}
              error={editErrors.phone?.message}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="orders@supplier.com"
              {...registerEdit('email')}
              error={editErrors.email?.message}
            />

            <Input
              label="Tax Number / GST"
              placeholder="e.g., 33AABCU9603R1ZM"
              {...registerEdit('taxNumber')}
              error={editErrors.taxNumber?.message}
            />

            <Input
              label="Warehouse / Office Address"
              placeholder="e.g., 10 Industrial Estate, Chennai"
              {...registerEdit('address')}
              error={editErrors.address?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingSupplier(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isUpdating}>
              Update Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Supplier Confirmation Modal */}
      <Modal
        isOpen={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        title="Delete Supplier"
        description="Verify supplier vendor removal"
        maxWidth="sm"
      >
        {deletingSupplier && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete supplier <span className="font-bold text-slate-900">"{deletingSupplier.companyName}"</span>?
              If any purchase orders are currently associated with this vendor, the action will be blocked.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingSupplier(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                Delete Supplier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
