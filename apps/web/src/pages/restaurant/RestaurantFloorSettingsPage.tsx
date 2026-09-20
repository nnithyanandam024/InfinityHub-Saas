import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { restaurantService } from '../../services/restaurantService';
import type { RestaurantSection, RestaurantTable } from '@infinityhub/types';
import {
  SlidersHorizontal,
  Plus,
  ArrowLeft,
  Circle,
  Square,
  RectangleHorizontal,
  Users,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Hash
} from 'lucide-react';

export const RestaurantFloorSettingsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [sections, setSections] = useState<RestaurantSection[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'tables' | 'sections' | 'preview'>('tables');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<RestaurantSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '', sortOrder: 1 });

  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    sectionId: '',
    capacity: 4,
    shape: 'square' as 'square' | 'round' | 'rectangle',
    assignedCaptain: ''
  });

  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchForm, setBatchForm] = useState({
    sectionId: '',
    prefix: 'T-',
    startNumber: 1,
    count: 4,
    capacity: 4,
    shape: 'square' as 'square' | 'round' | 'rectangle',
    assignedCaptain: ''
  });

  const tenantId = tenant?.id || 'tenant-xyz-restaurant';

  const loadData = async () => {
    try {
      const [secData, tblData] = await Promise.all([
        restaurantService.getSections(tenantId),
        restaurantService.getTables(tenantId)
      ]);
      setSections(secData.sort((a, b) => a.sortOrder - b.sortOrder));
      setTables(tblData);
      if (secData.length > 0 && !tableForm.sectionId) {
        setTableForm(prev => ({ ...prev, sectionId: secData[0].id }));
        setBatchForm(prev => ({ ...prev, sectionId: secData[0].id }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load floor configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Section Handlers
  const handleOpenAddSection = () => {
    setEditingSection(null);
    setSectionForm({
      name: '',
      description: '',
      sortOrder: sections.length + 1
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec: RestaurantSection) => {
    setEditingSection(sec);
    setSectionForm({
      name: sec.name,
      description: sec.description || '',
      sortOrder: sec.sortOrder
    });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.name.trim()) {
      showToast('Section name is required', 'error');
      return;
    }

    try {
      if (editingSection) {
        await restaurantService.updateSection(tenantId, editingSection.id, sectionForm);
        showToast(`Section "${sectionForm.name}" updated`, 'success');
      } else {
        await restaurantService.createSection(tenantId, sectionForm);
        showToast(`Section "${sectionForm.name}" created`, 'success');
      }
      setIsSectionModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save section', 'error');
    }
  };

  const handleDeleteSection = async (sec: RestaurantSection) => {
    const sectionTables = tables.filter(t => t.sectionId === sec.id);
    const occupied = sectionTables.filter(t => t.status !== 'vacant' && t.status !== 'cleaning');
    if (occupied.length > 0) {
      showToast(`Cannot delete section "${sec.name}" with ${occupied.length} occupied table(s)`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete section "${sec.name}"? ${sectionTables.length} vacant table(s) in this section will also be removed.`)) {
      return;
    }

    try {
      await restaurantService.deleteSection(tenantId, sec.id);
      showToast(`Section "${sec.name}" deleted`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete section', 'error');
    }
  };

  // Table Handlers
  const handleOpenAddTable = () => {
    setEditingTable(null);
    setTableForm({
      tableNumber: '',
      sectionId: selectedSectionFilter !== 'all' ? selectedSectionFilter : (sections[0]?.id || ''),
      capacity: 4,
      shape: 'square',
      assignedCaptain: ''
    });
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (table: RestaurantTable) => {
    setEditingTable(table);
    setTableForm({
      tableNumber: table.tableNumber,
      sectionId: table.sectionId,
      capacity: table.capacity,
      shape: table.shape || 'square',
      assignedCaptain: table.assignedCaptain || ''
    });
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.tableNumber.trim()) {
      showToast('Table number is required', 'error');
      return;
    }
    if (!tableForm.sectionId) {
      showToast('Please select a dining section', 'error');
      return;
    }

    try {
      if (editingTable) {
        await restaurantService.updateTable(tenantId, editingTable.id, tableForm);
        showToast(`Table ${tableForm.tableNumber} updated`, 'success');
      } else {
        await restaurantService.createTable(tenantId, tableForm);
        showToast(`Table ${tableForm.tableNumber} created`, 'success');
      }
      setIsTableModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save table', 'error');
    }
  };

  const handleDeleteTable = async (table: RestaurantTable) => {
    if (table.status !== 'vacant' && table.status !== 'cleaning') {
      showToast(`Cannot delete Table ${table.tableNumber} while it is occupied (${table.status})`, 'error');
      return;
    }

    if (!window.confirm(`Delete Table ${table.tableNumber}?`)) {
      return;
    }

    try {
      await restaurantService.deleteTable(tenantId, table.id);
      showToast(`Table ${table.tableNumber} deleted`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete table', 'error');
    }
  };

  // Batch Generator Handler
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.sectionId) {
      showToast('Please select a section for batch generation', 'error');
      return;
    }

    try {
      const created = await restaurantService.batchCreateTables(tenantId, batchForm);
      showToast(`Generated ${created.length} new tables!`, 'success');
      setIsBatchModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Batch generation failed', 'error');
    }
  };

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      if (selectedSectionFilter !== 'all' && t.sectionId !== selectedSectionFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = t.tableNumber.toLowerCase().includes(query);
        const sec = sections.find(s => s.id === t.sectionId);
        const matchesSection = sec?.name.toLowerCase().includes(query);
        if (!matchesNumber && !matchesSection) return false;
      }
      return true;
    });
  }, [tables, sections, selectedSectionFilter, searchQuery]);

  const getSectionName = (secId: string) => {
    return sections.find(s => s.id === secId)?.name || 'Unassigned';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-xs font-semibold">Loading Floor Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-[18px] shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A] font-display">
                  Floor & Table Configuration
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                  Settings
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize dining areas, add or edit tables, adjust capacities, shapes, and preview layouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/restaurant/tables"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Floor Plan</span>
            </Link>

            <button
              onClick={handleOpenAddTable}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tables'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Tables Catalog ({tables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'sections'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dining Sections ({sections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'preview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Floor Preview</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TABLES CONFIGURATION */}
      {/* ======================================================== */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          {/* Filters & Actions Bar */}
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Section Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSectionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedSectionFilter === 'all'
                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                All Sections ({tables.length})
              </button>
              {sections.map(sec => {
                const count = tables.filter(t => t.sectionId === sec.id).length;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectionFilter(sec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      selectedSectionFilter === sec.id
                        ? 'bg-orange-50 text-orange-800 border border-orange-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {sec.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search & Batch Button */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search table #..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-40 sm:w-48"
                />
              </div>

              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Batch Generator</span>
              </button>
            </div>
          </div>

          {/* Tables Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Table Code</th>
                    <th className="py-3 px-4">Dining Section</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Shape</th>
                    <th className="py-3 px-4">Default Captain</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No tables match your current filters. Click "Add Table" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredTables.map(tbl => {
                      const isOccupied = tbl.status !== 'vacant' && tbl.status !== 'cleaning';

                      return (
                        <tr key={tbl.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center font-mono text-xs shadow-2xs">
                                {tbl.tableNumber}
                              </span>
                              <span className="font-bold text-slate-900">{tbl.tableNumber}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {getSectionName(tbl.sectionId)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Users className="w-3 h-3 text-slate-500" />
                              {tbl.capacity} covers
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 capitalize font-medium text-slate-600">
                              {tbl.shape === 'round' && <Circle className="w-3.5 h-3.5 text-blue-500" />}
                              {tbl.shape === 'rectangle' && <RectangleHorizontal className="w-3.5 h-3.5 text-purple-500" />}
                              {(!tbl.shape || tbl.shape === 'square') && <Square className="w-3.5 h-3.5 text-orange-500" />}
                              {tbl.shape || 'square'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {tbl.assignedCaptain || <span className="text-slate-400 italic">Unassigned</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              tbl.status === 'vacant'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : tbl.status === 'cleaning'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {tbl.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditTable(tbl)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                                title="Edit Table"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteTable(tbl)}
                                disabled={isOccupied}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isOccupied
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                                }`}
                                title={isOccupied ? 'Cannot delete occupied table' : 'Delete Table'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DINING SECTIONS CONFIGURATION */}
      {/* ======================================================== */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dining Sections & Floors</h2>
              <p className="text-xs text-slate-500">Configure your dining zones, ambient areas, and floor layout groups.</p>
            </div>
            <button
              onClick={handleOpenAddSection}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dining Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map(sec => {
              const secTables = tables.filter(t => t.sectionId === sec.id);
              const occupied = secTables.filter(t => t.status !== 'vacant' && t.status !== 'cleaning');
              const totalCapacity = secTables.reduce((sum, t) => sum + t.capacity, 0);

              return (
                <div
                  key={sec.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center">
                            {sec.sortOrder}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">{sec.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 pl-8">
                          {sec.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditSection(sec)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                          title="Edit Section"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sec)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Section Stats */}
                    <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-slate-100 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Tables</div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">{secTables.length}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Total Capacity</div>
                        <div className="text-sm font-extrabold text-blue-700 mt-0.5">{totalCapacity} seats</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Occupied</div>
                        <div className="text-sm font-extrabold text-orange-600 mt-0.5">{occupied.length} tables</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LIVE FLOOR PREVIEW */}
      {/* ======================================================== */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Floor Layout Preview</h2>
              <p className="text-xs text-slate-500">Live preview of how tables will appear to waitstaff and captains.</p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSectionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedSectionFilter === 'all'
                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Sections
              </button>
              {sections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionFilter(sec.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedSectionFilter === sec.id
                      ? 'bg-orange-50 text-orange-800 border border-orange-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sec.name}
                </button>
              ))}
            </div>
          </div>

          {/* Spatial Grid Preview */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 min-h-[450px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredTables.map(tbl => (
                <div key={tbl.id} className="flex flex-col items-center">
                  {/* Visual Table Shapes with Chair Pegs */}
                  <div className="relative flex items-center justify-center p-3">
                    {/* Round Table */}
                    {tbl.shape === 'round' && (
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-300 shadow-sm flex flex-col items-center justify-center transition-all hover:border-orange-500 hover:scale-105">
                          <span className="font-extrabold text-xs font-mono text-slate-900">{tbl.tableNumber}</span>
                          <span className="text-[9px] text-slate-500">{tbl.capacity}p</span>
                        </div>
                        {/* 4 chair dots around */}
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -top-1 left-1/2 -translate-x-1/2"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -left-1 -translate-y-1/2"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -right-1 -translate-y-1/2"></span>
                      </div>
                    )}

                    {/* Rectangle Table */}
                    {tbl.shape === 'rectangle' && (
                      <div className="relative">
                        <div className="w-28 h-16 rounded-xl bg-white border-2 border-slate-300 shadow-sm flex flex-col items-center justify-center transition-all hover:border-orange-500 hover:scale-105">
                          <span className="font-extrabold text-xs font-mono text-slate-900">{tbl.tableNumber}</span>
                          <span className="text-[9px] text-slate-500">{tbl.capacity} covers</span>
                        </div>
                        {/* Chairs top and bottom */}
                        <div className="flex justify-around w-full absolute -top-1 px-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                        </div>
                        <div className="flex justify-around w-full absolute -bottom-1 px-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                        </div>
                      </div>
                    )}

                    {/* Square Table (Default) */}
                    {(!tbl.shape || tbl.shape === 'square') && (
                      <div className="relative">
                        <div className="w-18 h-18 rounded-xl bg-white border-2 border-slate-300 shadow-sm flex flex-col items-center justify-center transition-all hover:border-orange-500 hover:scale-105">
                          <span className="font-extrabold text-xs font-mono text-slate-900">{tbl.tableNumber}</span>
                          <span className="text-[9px] text-slate-500">{tbl.capacity}p</span>
                        </div>
                        {/* 4 chair dots */}
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -top-1 left-1/2 -translate-x-1/2"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -left-1 -translate-y-1/2"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -right-1 -translate-y-1/2"></span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-medium text-slate-500 mt-1 truncate max-w-24 text-center">
                    {getSectionName(tbl.sectionId)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT DINING SECTION */}
      {/* ======================================================== */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-90 zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSection ? 'Edit Dining Section' : 'Add Dining Section'}
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alfresco Garden Terrace"
                  value={sectionForm.name}
                  onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Open air garden with ambient lighting"
                  value={sectionForm.description}
                  onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={sectionForm.sortOrder}
                  onChange={e => setSectionForm({ ...sectionForm, sortOrder: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs"
                >
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT TABLE */}
      {/* ======================================================== */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-90 zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTable ? `Edit Table ${editingTable.tableNumber}` : 'Add New Table'}
              </h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Table Number / Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-09, TR-04, BAR-02"
                  value={tableForm.tableNumber}
                  onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dining Section <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={tableForm.sectionId}
                  onChange={e => setTableForm({ ...tableForm, sectionId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                >
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seating Capacity (Covers)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={tableForm.capacity}
                    onChange={e => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 4 })}
                    className="w-24 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <div className="flex items-center gap-1">
                    {[2, 4, 6, 8, 12].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTableForm({ ...tableForm, capacity: num })}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                          tableForm.capacity === num
                            ? 'bg-orange-50 border-orange-300 text-orange-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Table Shape
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'square', label: 'Square', icon: Square, desc: '2-4 seats' },
                    { id: 'round', label: 'Round', icon: Circle, desc: 'Bistro/Booth' },
                    { id: 'rectangle', label: 'Rectangle', icon: RectangleHorizontal, desc: '6-12 banquet' }
                  ].map(sh => {
                    const IconComponent = sh.icon;
                    const isSelected = tableForm.shape === sh.id;

                    return (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setTableForm({ ...tableForm, shape: sh.id as any })}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                          isSelected
                            ? 'bg-orange-50 border-orange-500 text-orange-900 ring-1 ring-orange-400/20 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 text-orange-600" />
                        <span className="text-xs font-bold">{sh.label}</span>
                        <span className="text-[9px] text-slate-400">{sh.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Captain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Captain Suresh"
                  value={tableForm.assignedCaptain}
                  onChange={e => setTableForm({ ...tableForm, assignedCaptain: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs"
                >
                  {editingTable ? 'Save Table' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BATCH TABLE GENERATOR */}
      {/* ======================================================== */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-90 zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Batch Table Generator</h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Dining Section <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={batchForm.sectionId}
                  onChange={e => setBatchForm({ ...batchForm, sectionId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                >
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Table Prefix
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TR-, T-, BAR-"
                    value={batchForm.prefix}
                    onChange={e => setBatchForm({ ...batchForm, prefix: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={batchForm.startNumber}
                    onChange={e => setBatchForm({ ...batchForm, startNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Count of Tables
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={batchForm.count}
                    onChange={e => setBatchForm({ ...batchForm, count: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={batchForm.capacity}
                    onChange={e => setBatchForm({ ...batchForm, capacity: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Table Shape
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'square', label: 'Square' },
                    { id: 'round', label: 'Round' },
                    { id: 'rectangle', label: 'Rectangle' }
                  ].map(sh => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setBatchForm({ ...batchForm, shape: sh.id as any })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize ${
                        batchForm.shape === sh.id
                          ? 'bg-purple-50 border-purple-500 text-purple-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900">
                <span className="font-bold">Preview: </span>
                This will generate tables{' '}
                <span className="font-mono font-bold">
                  {batchForm.prefix}{batchForm.startNumber < 10 ? '0' + batchForm.startNumber : batchForm.startNumber}
                </span>{' '}
                to{' '}
                <span className="font-mono font-bold">
                  {batchForm.prefix}{(batchForm.startNumber + batchForm.count - 1) < 10 ? '0' + (batchForm.startNumber + batchForm.count - 1) : (batchForm.startNumber + batchForm.count - 1)}
                </span>{' '}
                ({batchForm.count} tables with {batchForm.capacity} seats).
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs"
                >
                  Generate Tables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
