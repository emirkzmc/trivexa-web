type LoadingVariant = 'spinner' | 'dots';

interface LoadingProps {
  fullScreen?: boolean;
  variant?: LoadingVariant;
}

export default function Loading({
  fullScreen = false,
  variant = 'spinner',
}: LoadingProps) {
  const containerClasses = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center';

  if (variant === 'dots') {
    return (
      <div className={containerClasses} aria-busy="true" aria-label="Yükleniyor">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-trivexa-black animate-bounce" />
          <div
            className="h-10 w-10 rounded-full bg-trivexa-gray-700 animate-bounce"
            style={{ animationDelay: '120ms' }}
          />
          <div
            className="h-10 w-10 rounded-full bg-trivexa-gray-500 animate-bounce"
            style={{ animationDelay: '240ms' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} aria-busy="true" aria-label="Yükleniyor">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-trivexa-gray-400 border-t-trivexa-black" />
    </div>
  );
}