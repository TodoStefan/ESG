import React, { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

export default function InfoTooltip({ text, label = 'Mehr Informationen' }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <span className={`esg-info-tooltip ${open ? 'open' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className="esg-info-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={tooltipId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Info size={12} />
      </button>
      <span id={tooltipId} className="esg-info-content" role="tooltip">
        {text}
      </span>
    </span>
  );
}
