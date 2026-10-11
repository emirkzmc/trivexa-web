import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
}

/**
 * Reusable Skeleton Loader Component
 *
 * Displays a loading placeholder with shimmer animation
 *
 * Usage:
 * ```tsx
 * <Skeleton width={200} height={20} />
 * <Skeleton circle width={40} height={40} />
 * <Skeleton count={3} />
 * ```
 */
export function Skeleton({
  width,
  height,
  circle = false,
  count = 1,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const skeletonStyle = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : '1rem',
    ...style,
  };

  const skeletonClass = `
    bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
    animate-shimmer bg-[length:200%_100%]
    ${circle ? 'rounded-full' : 'rounded'}
    ${className}
  `.trim();

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${skeletonClass} mb-2`}
            style={skeletonStyle}
            {...props}
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={skeletonClass}
      style={skeletonStyle}
      {...props}
    />
  );
}

/**
 * Card Skeleton - For card-like content
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton circle width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} className="mt-2" />
        </div>
      </div>
      <Skeleton count={3} height={12} />
      <div className="flex justify-between">
        <Skeleton width={80} height={24} />
        <Skeleton width={60} height={24} />
      </div>
    </div>
  );
}

/**
 * Table Skeleton - For table rows
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton height={16} width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton height={14} width="70%" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * List Skeleton - For list items
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
          <Skeleton circle width={32} height={32} />
          <div className="flex-1">
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={10} className="mt-2" />
          </div>
          <Skeleton width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton - For form fields
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton width="30%" height={14} className="mb-2" />
          <Skeleton height={40} />
        </div>
      ))}
      <div className="flex gap-3 mt-6">
        <Skeleton width={100} height={40} />
        <Skeleton width={80} height={40} />
      </div>
    </div>
  );
}

/**
 * Dashboard Skeleton - For dashboard widgets
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <Skeleton width="60%" height={12} className="mb-2" />
            <Skeleton width="40%" height={24} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton width="40%" height={20} className="mb-4" />
          <Skeleton height={200} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton width="40%" height={20} className="mb-4" />
          <ListSkeleton items={5} />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile Skeleton - For user profiles
 */
export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton circle width={80} height={80} />
        <div className="flex-1">
          <Skeleton width="60%" height={24} className="mb-2" />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton width="40%" height={12} className="mb-2" />
            <Skeleton height={14} />
          </div>
          <div>
            <Skeleton width="40%" height={12} className="mb-2" />
            <Skeleton height={14} />
          </div>
        </div>
        <Skeleton count={3} height={14} />
      </div>
    </div>
  );
}
