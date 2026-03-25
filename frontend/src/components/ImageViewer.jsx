import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import './ImageViewer.css';

/**
 * ImageViewer — click to open lightbox, then:
 *   • scroll wheel  → zoom in/out
 *   • drag          → pan
 *   • +/- buttons   → zoom
 *   • reset button  → back to fit
 *   • Escape / X    → close
 */
export default function ImageViewer({ src, alt, className = '', style = {} }) {
  const [open, setOpen]     = useState(false);
  const [scale, setScale]   = useState(1);
  const [pos, setPos]       = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const imgRef    = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => { setOpen(false); reset(); };
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  const zoom = useCallback((delta) => {
    setScale(s => Math.min(5, Math.max(0.5, +(s + delta).toFixed(2))));
  }, []);

  // Wheel zoom
  const onWheel = (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 0.15 : -0.15);
  };

  // Drag pan
  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  // Touch pan
  const touchStart = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 1 && touchStart.current) {
      setPos({ x: e.touches[0].clientX - touchStart.current.x, y: e.touches[0].clientY - touchStart.current.y });
    }
  };

  if (!src) return null;

  return (
    <>
      {/* Thumbnail — click to open */}
      <div className={`iv-thumb ${className}`} style={style} onClick={() => setOpen(true)} title="Click to zoom">
        <img src={src} alt={alt}/>
        <div className="iv-thumb-hint"><Maximize2 size={16}/> Click to zoom</div>
      </div>

      {/* Lightbox */}
      {open && (
        <div className="iv-overlay" onClick={close}>
          {/* Stop propagation so clicking the image doesn't close */}
          <div
            className="iv-stage"
            onClick={e => e.stopPropagation()}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { touchStart.current = null; }}
            style={{ cursor: dragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className="iv-img"
              draggable={false}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                transition: dragging ? 'none' : 'transform 0.15s ease',
              }}
            />
          </div>

          {/* Controls */}
          <div className="iv-controls" onClick={e => e.stopPropagation()}>
            <button className="iv-btn" onClick={() => zoom(0.25)} title="Zoom in"><ZoomIn size={18}/></button>
            <span className="iv-scale">{Math.round(scale * 100)}%</span>
            <button className="iv-btn" onClick={() => zoom(-0.25)} title="Zoom out"><ZoomOut size={18}/></button>
            <button className="iv-btn" onClick={reset} title="Reset"><RotateCcw size={16}/></button>
            <button className="iv-btn iv-close" onClick={close} title="Close"><X size={18}/></button>
          </div>

          {/* Hint */}
          {scale === 1 && (
            <div className="iv-hint">Scroll to zoom · Drag to pan · Esc to close</div>
          )}
        </div>
      )}
    </>
  );
}
