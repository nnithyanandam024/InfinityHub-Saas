import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#CBD5E1] rounded-[14px] bg-[#F8FAFC]/50 ${className}`}>
      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 mb-3.5">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-semibold text-[#0F172A] mb-1">{title}</h4>
      <p className="text-xs text-[#64748B] max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ text?: string; className?: string }> = ({
  text = 'Loading details...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 gap-3 ${className}`}>
      <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-500">{text}</span>
    </div>
  );
};
