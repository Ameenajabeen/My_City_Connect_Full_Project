/**
 * MY CITY CONNECT - Page Container
 * Enterprise White + Black Header & Surface Layout
 */
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  backPath,
  backLabel,
  actions,
  children,
  fullWidth = false,
}) => {
  const { navigate } = useApp();

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 space-y-6 bg-zinc-50 text-zinc-900">
      <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} space-y-6`}>
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            {backPath && (
              <button
                id="btn-page-back"
                onClick={() => navigate(backPath)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-black transition-colors mb-2 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                {backLabel || 'Back'}
              </button>
            )}
            <h1 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-xs md:text-sm text-zinc-500 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </div>

        {/* Content area */}
        <div>{children}</div>
      </div>
    </div>
  );
};
