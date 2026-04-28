import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 z-50 flex items-center justify-center">
      <div className="relative">
        {/* Animated Logo/Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-white border-r-white rounded-full animate-spin"></div>

          {/* Middle rotating ring (reverse) */}
          <div className="absolute inset-2 border-4 border-transparent border-b-blue-400 border-l-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>

          {/* Inner pulsing circle */}
          <div className="absolute inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">S</span>
            </div>
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mb-4">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold mb-2">Loading Stand</h2>
          <p className="text-blue-200 text-sm animate-pulse">Preparing your workspace...</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2000}ms`,
              animationDuration: `${2000 + Math.random() * 2000}ms`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full border-2 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
    </div>
  );
};

export const SkeletonLoader: React.FC<{
  className?: string,
  lines?: number,
  height?: string
}> = ({ className = '', lines = 3, height = 'h-4' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 rounded animate-pulse`}
          style={{
            width: `${60 + Math.random() * 40}%`,
            animationDelay: `${i * 100}ms`
          }}
        ></div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <SkeletonLoader lines={2} height="h-4" />
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export const ButtonLoader: React.FC<{
  loading: boolean,
  children: React.ReactNode,
  className?: string,
  onClick?: () => void,
  type?: 'button' | 'submit' | 'reset'
}> = ({ loading, children, className = '', onClick, type = 'button' }) => {
  return (
    <button
      className={`relative ${className}`}
      disabled={loading}
      onClick={onClick}
      type={type}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" className="text-white" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
};
