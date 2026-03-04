interface IconProps {
  src: string;
  alt?: string;
  className?: string;
}

// Icon component that loads an SVG from src/assets/icons by file name, e.g. "PersonIcon.svg"
// Kullanım: <Icon src="PersonIcon.svg" />
export function Icon({ src, alt = '', className = '' }: IconProps) {
  if (!src) return null;

  const resolvedSrc = new URL(
    `/src/assets/icons/${src}`,
    import.meta.url,
  ).href;

  return <img src={resolvedSrc} alt={alt || src} className={className} />;
}

