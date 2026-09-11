import React, { useState, useEffect } from 'react';
import { PLATFORM_APPLICATIONS } from '@infinityhub/constants';
import { tenantService } from '../../services/tenantService';
import { Tenant } from '@infinityhub/types';
import {
  Boxes,
  Receipt,
  UtensilsCrossed,
  Users,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Plus,
  Building2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProvisionTenantModal } from '../platform/ProvisionTenantModal';
import { Link } from 'react-router-dom';

const APP_ICONS: Record<string, React.ElementType> = {
  inventory: Boxes,
  pos: Receipt,
  restaurant: UtensilsCrossed,
  employee: Users,
  appointment: CalendarCheck
};

export const AdminModulesPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedAppForProvision, setSelectedAppForProvision] = useState<any>(null);

  useEffect(() => {
    tenantService.getTenants().then(setTenants);
  }, []);

  const getTenantCountForApp = (appId: string) => {
    return tenants.filter(t => (t.applicationId || 'inventory') === appId).length;
  };

  const handleOpenProvision = (app: any) => {
    setSelectedAppForProvision(app);
    setIsProvisionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-6 rounded-[14px] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight font-display flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              SaaS Applications Catalog & Suites
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Decoupled multi-tenant business software applications sold by InfinityHub. Each product is provisioned as an independent customer solution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/platform">
            <Button size="sm" variant="outline" icon={ArrowUpRight}>
              Public Storefront
            </Button>
          </Link>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => handleOpenProvision(null)}
          >
            Provision Customer Store
          </Button>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLATFORM_APPLICATIONS.map(app => {
          const Icon = APP_ICONS[app.id] || Boxes;
          const tenantCount = getTenantCountForApp(app.id);

          return (
            <div
              key={app.id}
              className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-2xs flex flex-col justify-between hover:shadow-xs hover:border-slate-300 transition-all"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        app.isAvailable
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] leading-tight">
                        {app.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">{app.tagline}</p>
                    </div>
                  </div>

                  {app.isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Live Product
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                      <Sparkles className="w-3 h-3" /> Standalone Suite
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {app.description}
                </p>

                {/* Application Core Navigation Scope */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-[#E2E8F0] mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Customer Product Navigation:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {app.coreNavItems.map(item => (
                      <span
                        key={item}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900">{tenantCount}</span>
                  <span className="text-slate-500">
                    {tenantCount === 1 ? 'Customer Workspace' : 'Customer Workspaces'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    service:{app.serviceId}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleOpenProvision(app)}
                  >
                    Provision Store
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provision Wizard Modal */}
      <ProvisionTenantModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        defaultApp={selectedAppForProvision}
      />
    </div>
  );
};
