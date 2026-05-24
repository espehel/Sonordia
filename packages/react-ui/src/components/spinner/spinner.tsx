import * as React from 'react';

import { cn } from '../../lib/utils';

const SPINNER_STYLES = `
  [data-slot="spinner"] .son-spinner-el {
    transform-box: fill-box;
    transform-origin: center;
    animation: son-spinner-pulse 1.2s cubic-bezier(.42,0,.58,1) infinite;
    will-change: transform, opacity;
  }
  [data-slot="spinner"] .son-spinner-d1 { animation-delay: 0s; }
  [data-slot="spinner"] .son-spinner-d2 { animation-delay: .4s; }
  [data-slot="spinner"] .son-spinner-d3 { animation-delay: .8s; }

  @keyframes son-spinner-pulse {
    0%   { transform: scale(.80); opacity: .40; }
    16%  { transform: scale(1.06); opacity: 1; }
    36%  { transform: scale(.80); opacity: .40; }
    100% { transform: scale(.80); opacity: .40; }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-slot="spinner"] .son-spinner-el { animation-duration: 3.6s; }
  }
`;

function Spinner({
  className,
  title = 'Loading…',
  background = true,
  ...props
}: React.ComponentProps<'svg'> & { title?: string; background?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
      data-slot="spinner"
      className={cn('size-8', className)}
      {...props}
    >
      <title>{title}</title>
      <style>{SPINNER_STYLES}</style>

      {background && <rect width="512" height="512" rx="96" fill="#0E1B00" />}

      <rect className="son-spinner-el son-spinner-d1" x="132" y="135" width="248" height="56" rx="28" fill="#BB95FF" />
      <circle className="son-spinner-el son-spinner-d1" cx="418" cy="163" r="27" fill="#AAD741" />

      <rect className="son-spinner-el son-spinner-d2" x="132" y="228" width="248" height="56" rx="28" fill="#AAD741" />
      <circle className="son-spinner-el son-spinner-d2" cx="94" cy="256" r="27" fill="#BB95FF" />

      <rect className="son-spinner-el son-spinner-d3" x="132" y="321" width="248" height="56" rx="28" fill="#BB95FF" />
      <circle className="son-spinner-el son-spinner-d3" cx="418" cy="349" r="27" fill="#AAD741" />
    </svg>
  );
}

export { Spinner };
