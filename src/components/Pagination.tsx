'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage?: number;
  page?: number;
  totalPages?: number;
  totalItems: number;
  pageSize?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage: explicitCurrentPage,
  page: aliasPage,
  totalPages: explicitTotalPages,
  totalItems,
  pageSize: explicitPageSize,
  limit: aliasLimit,
  onPageChange,
  onPageSizeChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  if (totalItems === 0) return null;

  const activePage = explicitCurrentPage ?? aliasPage ?? 1;
  const activePageSize = explicitPageSize ?? aliasLimit ?? 10;
  const computedTotalPages = explicitTotalPages ?? Math.ceil(totalItems / activePageSize);
  const totalPages = Math.max(1, computedTotalPages);

  const startItem = (activePage - 1) * activePageSize + 1;
  const endItem = Math.min(activePage * activePageSize, totalItems);

  const handleSizeChange = (size: number) => {
    if (onPageSizeChange) onPageSizeChange(size);
    if (onLimitChange) onLimitChange(size);
  };

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (activePage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (activePage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="px-4 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
      {/* Items count & Page Size Selector */}
      <div className="flex items-center space-x-3 text-slate-500">
        <div>
          Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
          <span className="font-bold text-slate-800">{endItem}</span> of{' '}
          <span className="font-bold text-slate-800">{totalItems}</span> entries
        </div>

        {(onPageSizeChange || onLimitChange) && (
          <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
            <span className="text-[11px] text-slate-400">Rows:</span>
            <select
              value={activePageSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1 self-center sm:self-auto">
        <button
          onClick={() => onPageChange(1)}
          disabled={activePage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const isCurrent = p === activePage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={activePage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
