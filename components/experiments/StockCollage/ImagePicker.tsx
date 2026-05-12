'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  COLLAGE_IMAGES,
  getCategories,
  type CollageCategory,
  type CollageImage,
} from '@/data/collageImages';
import styles from './ImagePicker.module.css';

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: CollageImage) => void;
  selectedIds?: string[];
}

const ALL: 'all' = 'all';

export default function ImagePicker({
  isOpen,
  onClose,
  onSelect,
  selectedIds = [],
}: ImagePickerProps) {
  const categories = useMemo(() => getCategories(), []);
  const [activeCategory, setActiveCategory] = useState<CollageCategory | typeof ALL>(ALL);

  // Reset to "All" each time the picker opens
  useEffect(() => {
    if (isOpen) setActiveCategory(ALL);
  }, [isOpen]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const visibleImages = useMemo(
    () =>
      activeCategory === ALL
        ? COLLAGE_IMAGES
        : COLLAGE_IMAGES.filter((img) => img.category === activeCategory),
    [activeCategory],
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles.scrim}
      role="dialog"
      aria-modal="true"
      aria-label="Pick an image"
      onClick={onClose}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <span className={styles.title}>Pick an image</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close image picker"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeCategory === ALL}
            className={`${styles.tab}${activeCategory === ALL ? ` ${styles.tabActive}` : ''}`}
            onClick={() => setActiveCategory(ALL)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`${styles.tab}${activeCategory === cat ? ` ${styles.tabActive}` : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {visibleImages.map((img) => {
            const isSelected = selectedIds.includes(img.id);
            return (
              <button
                key={img.id}
                className={`${styles.thumb}${isSelected ? ` ${styles.thumbSelected}` : ''}`}
                style={{ backgroundColor: img.dominantColor }}
                onClick={() => {
                  onSelect(img);
                  onClose();
                }}
                aria-label={`${img.category}: ${img.tags.join(', ')}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumbUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
