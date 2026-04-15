import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Full MovieMania logo — image + wordmark
 *
 * @param {'sm'|'md'|'lg'|'xl'} props.size - Preset size
 * @param {boolean} props.showTagline - Show the tagline
 * @param {boolean} props.linkToHome - Wrap in a Link to "/"
 * @param {string} props.className - Extra wrapper classes
 * @param {boolean} props.iconOnly - Show icon only (no text)
 */
const Logo = ({
  size = 'md',
  showTagline = false,
  linkToHome = false,
  className = '',
  iconOnly = false,
}) => {
  const sizes = {
    sm: { icon: 42, text: 'text-xl', tagline: 'text-[9px]', gap: 'gap-2.5' },
    md: { icon: 52, text: 'text-3xl', tagline: 'text-[10px]', gap: 'gap-3' },
    lg: { icon: 64, text: 'text-4xl', tagline: 'text-xs', gap: 'gap-3.5' },
    xl: { icon: 80, text: 'text-5xl', tagline: 'text-sm', gap: 'gap-4' },
  };

  const s = sizes[size] || sizes.md;

  const content = (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <img
        src="/logos/logo.png"
        alt="MovieMania"
        style={{ width: s.icon, height: s.icon }}
        className="object-contain drop-shadow-lg rounded-md"
        draggable={false}
      />
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`${s.text} font-black tracking-tight leading-none`}>
            <span className="text-white">Movie</span>
            <span className="text-red-500">Mania</span>
          </span>
          {showTagline && (
            <span className={`${s.tagline} font-medium text-slate-400 tracking-[0.2em] uppercase mt-0.5`}>
              Book · Discuss · Experience
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return <Link to="/">{content}</Link>;
  }

  return content;
};

export const LogoIcon = ({ size = 32, className = '' }) => (
  <img
    src="/logos/logo.png"
    alt="MovieMania"
    style={{ width: size, height: size }}
    className={`object-contain drop-shadow-lg rounded-md ${className}`}
    draggable={false}
  />
);

export default Logo;
