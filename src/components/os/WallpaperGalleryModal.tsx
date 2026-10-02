import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  Sliders, 
  Trash2, 
  Sparkles, 
  Layers, 
  Eye, 
  SunMedium, 
  Maximize2,
  Compass,
  Palette,
  ShieldAlert
} from 'lucide-react';
import { WallpaperCategory, WallpaperItem, GlobalWallpaperConfig } from '../../types/wallpaper.ts';
import { 
  CURATED_WALLPAPERS, 
  getCustomWallpapers, 
  saveCustomWallpaper, 
  deleteCustomWallpaper, 
  resolveWallpaperItem,
  processImageFileToWallpaper 
} from '../../services/wallpaperGallery.ts';
import { playChime } from '../../utils/audio.ts';

interface WallpaperGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GlobalWallpaperConfig;
  onUpdateConfig: (newConfig: GlobalWallpaperConfig) => void;
}

export const WallpaperGalleryModal: React.FC<WallpaperGalleryModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<WallpaperCategory>('all');
  const [customWallpapers, setCustomWallpapers] = useState<WallpaperItem[]>(() => getCustomWallpapers());
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentItem = resolveWallpaperItem(config);

  const allItems: WallpaperItem[] = [
    ...customWallpapers,
    ...CURATED_WALLPAPERS,
  ];

  const filteredItems = selectedCategory === 'all'
    ? allItems
    : selectedCategory === 'custom'
    ? customWallpapers
    : CURATED_WALLPAPERS.filter((item) => item.category === selectedCategory);

  const handleSelectWallpaper = (item: WallpaperItem) => {
    onUpdateConfig({
      ...config,
      wallpaperId: item.id,
      customUrl: item.isCustom ? item.url : undefined,
    });
    playChime('click');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите файл изображения (PNG, JPG, WebP, GIF, SVG)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Файл слишком большой (макс. 15 МБ)');
      return;
    }

    setUploadError(null);
    try {
      const newWallpaper = await processImageFileToWallpaper(file);
      const updated = getCustomWallpapers();
      setCustomWallpapers(updated);
      handleSelectWallpaper(newWallpaper);
      playChime('success');
    } catch (err: any) {
      setUploadError(err?.message || 'Не удалось обработать файл изображения');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const url = imageUrlInput.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      setUploadError('Ссылка должна начинаться с https://');
      return;
    }

    setUploadError(null);
    const newWallpaper: WallpaperItem = {
      id: `custom-url-${Date.now()}`,
      title: 'Обои по ссылке',
      category: 'custom',
      type: 'image',
      url,
      thumbnail: url,
      author: 'По ссылке',
      location: 'Внешняя сеть',
      isCustom: true,
      accentColor: '#6366f1',
    };
    const updated = saveCustomWallpaper(newWallpaper);
    setCustomWallpapers(updated);
    handleSelectWallpaper(newWallpaper);
    setImageUrlInput('');
    playChime('success');
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteCustomWallpaper(id);
    setCustomWallpapers(updated);
    if (config.wallpaperId === id) {
      onUpdateConfig({
        ...config,
        wallpaperId: CURATED_WALLPAPERS[0].id,
        customUrl: undefined,
      });
    }
    playChime('click');
  };

  const categories: { id: WallpaperCategory; label: string; count?: number }[] = [
    { id: 'all', label: 'Все обои', count: allItems.length },
    { id: 'nature', label: 'Природа & Горы', count: CURATED_WALLPAPERS.filter(x => x.category === 'nature').length },
    { id: 'space', label: 'Космос & Галактики', count: CURATED_WALLPAPERS.filter(x => x.category === 'space').length },
    { id: 'architecture', label: 'Архитектура', count: CURATED_WALLPAPERS.filter(x => x.category === 'architecture').length },
    { id: 'cyberpunk', label: 'Киберпанк & 3D', count: CURATED_WALLPAPERS.filter(x => x.category === 'cyberpunk').length },
    { id: 'gradient', label: 'Градиенты OS', count: CURATED_WALLPAPERS.filter(x => x.category === 'gradient').length },
    { id: 'custom', label: 'Моя галерея', count: customWallpapers.length },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl max-h-[92vh] bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold tracking-tight text-white">
                  Галерея обоев & Оформление системы
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Global Wallpaper
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Выберите фото из галереи или загрузите свое — оно будет фоном не только на рабочем столе, но и везде в системе
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Закрыть (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SYSTEM-WIDE BACKGROUND CONTROLS BAR ("везде фоном") */}
        <div className="px-6 py-3 border-b border-white/10 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          {/* Apply Everywhere Toggle */}
          <label className="flex items-center space-x-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.applyEverywhere}
              onChange={(e) => onUpdateConfig({ ...config, applyEverywhere: e.target.checked })}
              className="w-4 h-4 rounded border-white/30 text-sky-500 focus:ring-sky-400 cursor-pointer accent-sky-500"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-white flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Фон везде в приложении (на всех экранах)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Обои видны не только на рабочем столе, но и в DAG-графе, Фокус-Студии, чате и задачах
              </span>
            </div>
          </label>

          {/* Dim & Blur Fine Tuning */}
          <div className="flex items-center space-x-5">
            {/* Dimming Level */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 flex items-center space-x-1">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                <span>Затемнение:</span>
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                {[
                  { label: '10%', val: 0.10 },
                  { label: '25%', val: 0.25 },
                  { label: '40%', val: 0.40 },
                  { label: '60%', val: 0.60 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, dimOpacity: opt.val })}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer font-mono ${
                      Math.abs(config.dimOpacity - opt.val) < 0.05
                        ? 'bg-sky-500 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blur Level */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Размытие:</span>
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                {[
                  { label: '0px', val: 0 },
                  { label: '3px', val: 3 },
                  { label: '8px', val: 8 },
                  { label: '14px', val: 14 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, blurAmount: opt.val })}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer font-mono ${
                      config.blurAmount === opt.val
                        ? 'bg-purple-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. UPLOAD & CUSTOM URL BAR */}
        <div className="px-6 py-3 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Upload Button */}
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer border border-white/15 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Загрузить фото с устройства</span>
            </button>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              PNG, JPG, WebP до 8 МБ
            </span>
          </div>

          {/* Direct URL Form */}
          <form onSubmit={handleAddFromUrl} className="flex items-center space-x-1.5 flex-1 max-w-md">
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Или вставьте прямую ссылку на фото (https://...)..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/80 transition"
              />
            </div>
            <button
              type="submit"
              disabled={!imageUrlInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-medium transition cursor-pointer shrink-0 shadow-xs"
            >
              Добавить
            </button>
          </form>
        </div>

        {uploadError && (
          <div className="px-6 py-2 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* 4. CATEGORIES TABS */}
        <div className="px-6 pt-3 pb-2 border-b border-white/10 flex items-center space-x-1 overflow-x-auto shrink-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-white/20 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{cat.label}</span>
              {typeof cat.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.id ? 'bg-white/25 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 5. WALLPAPERS GRID */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">В этой категории пока нет обоев</p>
              <p className="text-slate-500 mt-1">Загрузите свое фото через кнопку выше</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isActive = config.wallpaperId === item.id || (item.isCustom && config.customUrl === item.url);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectWallpaper(item)}
                    className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col ${
                      isActive
                        ? 'border-sky-400 ring-2 ring-sky-400/60 shadow-xl shadow-sky-500/10 scale-[1.01]'
                        : 'border-white/10 hover:border-white/30 bg-slate-800/40 hover:bg-slate-800/80 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {/* Visual Preview */}
                    <div className="h-36 w-full relative overflow-hidden bg-slate-950">
                      {item.type === 'gradient' ? (
                        <div 
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                          style={{ background: item.url }}
                        />
                      ) : (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* Active Overlay Badge */}
                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-sky-500 text-white font-semibold text-[11px] shadow-lg flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Активно везде</span>
                        </div>
                      )}

                      {/* Delete Custom Button */}
                      {item.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustom(e, item.id)}
                          className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white/80 hover:text-white transition cursor-pointer backdrop-blur-md"
                          title="Удалить из моей галереи"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Bottom Image Gradient Overlay for legibility */}
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-slate-950/80 to-transparent pointer-events-none" />
                    </div>

                    {/* Card Info Footer */}
                    <div className="p-3 flex items-center justify-between bg-slate-900/90 border-t border-white/5">
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                          {item.author && <span>{item.author}</span>}
                          {item.location && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="truncate">{item.location}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectWallpaper(item);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        }`}
                      >
                        {isActive ? 'Выбрано' : 'Применить'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/60" />
            <span>Текущие обои: <strong className="text-white">{currentItem.title}</strong></span>
            <span className="text-slate-600">·</span>
            <span className="text-sky-300 font-mono">
              {config.applyEverywhere ? 'Фоном на всех экранах' : 'Только рабочий стол'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-white/90 transition cursor-pointer shadow-lg"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
