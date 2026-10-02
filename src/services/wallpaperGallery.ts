import { WallpaperItem, GlobalWallpaperConfig, DEFAULT_WALLPAPER_CONFIG } from '../types/wallpaper.ts';

export const CURATED_WALLPAPERS: WallpaperItem[] = [
  // 0. MINIMALIST & CURATED OS STYLES
  {
    id: 'minimal-white',
    title: 'Чистый белый минимализм',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
    thumbnail: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
    author: 'Minimalist OS',
    location: 'Минимализм',
    accentColor: '#0f172a',
  },
  {
    id: 'studio-graphite',
    title: 'Studio Dark Graphite',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #0a0f1d 100%)',
    thumbnail: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #0a0f1d 100%)',
    author: 'Dark Matter',
    location: 'Студийный',
    accentColor: '#38bdf8',
  },
  {
    id: 'sequoia-midnight',
    title: 'macOS Sequoia Midnight',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #0b1021 0%, #1a1c3d 50%, #2d1b4e 100%)',
    thumbnail: 'linear-gradient(135deg, #0b1021 0%, #1a1c3d 50%, #2d1b4e 100%)',
    author: 'Apple Style',
    location: 'Фирменный градиент',
    accentColor: '#6366f1',
  },
  // 1. NATURE & LANDSCAPES
  {
    id: 'mountain-dawn',
    title: 'Альпийские вершины на рассвете',
    category: 'nature',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=480&q=75',
    author: 'Kaley Dykstra',
    location: 'Доломитовые Альпы',
    accentColor: '#38bdf8',
  },
  {
    id: 'nordic-forest',
    title: 'Туманный хвойный лес',
    category: 'nature',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=480&q=75',
    author: 'Luca Bravo',
    location: 'Скандинавия',
    accentColor: '#10b981',
  },
  {
    id: 'aurora-fjord',
    title: 'Северное сияние над фьордом',
    category: 'nature',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&w=480&q=75',
    author: 'Vincent Guth',
    location: 'Норвегия',
    accentColor: '#34d399',
  },
  {
    id: 'moraine-lake',
    title: 'Озеро Морейн в сумерках',
    category: 'nature',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=480&q=75',
    author: 'Bailey Zindel',
    location: 'Канада',
    accentColor: '#0ea5e9',
  },
  {
    id: 'pacific-coast',
    title: 'Тихоокеанский прибой на закате',
    category: 'nature',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=480&q=75',
    author: 'Sean Oulashin',
    location: 'Океан',
    accentColor: '#f59e0b',
  },

  // 2. SPACE & COSMOS
  {
    id: 'orion-nebula',
    title: 'Туманность Ориона & Звездная пыль',
    category: 'space',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=480&q=75',
    author: 'NASA Hubble',
    location: 'Глубокий космос',
    accentColor: '#818cf8',
  },
  {
    id: 'orbital-network',
    title: 'Орбитальная Земля & Созвездия',
    category: 'space',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=480&q=75',
    author: 'NASA Earth',
    location: 'Орбита',
    accentColor: '#38bdf8',
  },
  {
    id: 'milky-way-canyon',
    title: 'Млечный путь над снежными пиками',
    category: 'space',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=480&q=75',
    author: 'Benjamin Davies',
    location: 'Высокогорье',
    accentColor: '#a855f7',
  },

  // 3. ARCHITECTURE & MINIMALISM
  {
    id: 'tokyo-towers',
    title: 'Стеклянные башни мегаполиса',
    category: 'architecture',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=480&q=75',
    author: 'Simone Hutsch',
    location: 'Токио',
    accentColor: '#60a5fa',
  },
  {
    id: 'studio-architecture',
    title: 'Минималистичные тени & Студия',
    category: 'architecture',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=480&q=75',
    author: 'Breather Studio',
    location: 'Интерьер',
    accentColor: '#94a3b8',
  },

  // 4. CYBERPUNK & ABSTRACT
  {
    id: 'shinjuku-neon',
    title: 'Неоновый Синдзюку под дождем',
    category: 'cyberpunk',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=480&q=75',
    author: 'Aleksandar Pasaric',
    location: 'Синдзюку, Токио',
    accentColor: '#ec4899',
  },
  {
    id: 'liquid-curves',
    title: 'Шелковые 3D волны графита',
    category: 'cyberpunk',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=480&q=75',
    author: 'Milad Fakurian',
    location: '3D Арт',
    accentColor: '#c084fc',
  },

  // 5. SIGNATURE GRADIENTS
  {
    id: 'sequoia',
    title: 'macOS Sequoia Midnight',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #0b1021 0%, #1a1c3d 50%, #2d1b4e 100%)',
    thumbnail: 'linear-gradient(135deg, #0b1021 0%, #1a1c3d 50%, #2d1b4e 100%)',
    author: 'Apple Style',
    location: 'Фирменный градиент',
    accentColor: '#6366f1',
  },
  {
    id: 'aurora',
    title: 'Aurora Studio Midnight',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #03151e 0%, #082a36 50%, #041a1f 100%)',
    thumbnail: 'linear-gradient(135deg, #03151e 0%, #082a36 50%, #041a1f 100%)',
    author: 'Deep Emerald',
    location: 'Фирменный градиент',
    accentColor: '#10b981',
  },
  {
    id: 'studio_slate',
    title: 'Studio Dark Graphite',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #0a0f1d 100%)',
    thumbnail: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #0a0f1d 100%)',
    author: 'Dark Matter',
    location: 'Фирменный градиент',
    accentColor: '#38bdf8',
  },
  {
    id: 'cyber_dark',
    title: 'Cyberpunk Violet Night',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #120826 0%, #1f103c 50%, #0a0418 100%)',
    thumbnail: 'linear-gradient(135deg, #120826 0%, #1f103c 50%, #0a0418 100%)',
    author: 'Neon Synth',
    location: 'Фирменный градиент',
    accentColor: '#c084fc',
  },
  {
    id: 'bitrix_flora',
    title: 'Pure Minimal Studio',
    category: 'gradient',
    type: 'gradient',
    url: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    thumbnail: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    author: 'Clean Light',
    location: 'Светлая тема',
    accentColor: '#475569',
  },
];

const CUSTOM_WALLPAPERS_KEY = 'learning_os_custom_wallpapers_v2';
const WALLPAPER_CONFIG_KEY = 'learning_os_global_wallpaper_v2';

export function getCustomWallpapers(): WallpaperItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_WALLPAPERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading custom wallpapers:', e);
  }
  return [];
}

export async function processImageFileToWallpaper(file: File): Promise<WallpaperItem> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Пожалуйста, выберите файл изображения (PNG, JPG, WebP, GIF, SVG)');
  }

  const dataUrl = await readAndOptimizeImage(file);
  const title = file.name.replace(/\.[^/.]+$/, '').slice(0, 36) || 'Мои обои';

  const newWallpaper: WallpaperItem = {
    id: `custom-file-${Date.now()}`,
    title,
    category: 'custom',
    type: 'image',
    url: dataUrl,
    thumbnail: dataUrl,
    author: 'Файл с устройства',
    location: file.name,
    isCustom: true,
    accentColor: '#38bdf8',
  };

  saveCustomWallpaper(newWallpaper);
  return newWallpaper;
}

function readAndOptimizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG or small animated GIF, read directly
    if (file.type === 'image/svg+xml' || (file.type === 'image/gif' && file.size < 1024 * 1024)) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      if (!rawUrl) {
        reject(new Error('Пустой файл изображения'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 2560;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          let compressed = canvas.toDataURL('image/webp', 0.88);
          if (!compressed || compressed.length > rawUrl.length) {
            compressed = canvas.toDataURL('image/jpeg', 0.88);
          }
          resolve(compressed);
        } catch {
          resolve(rawUrl);
        }
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла изображения'));
    reader.readAsDataURL(file);
  });
}

export function saveCustomWallpaper(wallpaper: WallpaperItem): WallpaperItem[] {
  const existing = getCustomWallpapers();
  // Keep up to 6 custom wallpapers to prevent localStorage quota exhaustion
  const updated = [wallpaper, ...existing.filter((w) => w.id !== wallpaper.id)].slice(0, 6);
  try {
    localStorage.setItem(CUSTOM_WALLPAPERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage quota limit reached, trimming wallpapers:', e);
    try {
      const trimmed = [wallpaper, ...existing.filter((w) => w.id !== wallpaper.id)].slice(0, 2);
      localStorage.setItem(CUSTOM_WALLPAPERS_KEY, JSON.stringify(trimmed));
    } catch {
      console.warn('Could not persist to localStorage');
    }
  }
  return updated;
}

export function deleteCustomWallpaper(id: string): WallpaperItem[] {
  const existing = getCustomWallpapers();
  const updated = existing.filter((w) => w.id !== id);
  try {
    localStorage.setItem(CUSTOM_WALLPAPERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error deleting custom wallpaper:', e);
  }
  return updated;
}

export function loadWallpaperConfig(): GlobalWallpaperConfig {
  try {
    const raw = localStorage.getItem(WALLPAPER_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_WALLPAPER_CONFIG,
          ...parsed,
        };
      }
    }
    // Backwards compatibility with previous local storage
    const legacyDesktopWallpaper = localStorage.getItem('learning_os_desktop_wallpaper');
    if (legacyDesktopWallpaper) {
      return {
        ...DEFAULT_WALLPAPER_CONFIG,
        wallpaperId: legacyDesktopWallpaper,
        applyEverywhere: true,
      };
    }
  } catch (e) {
    console.warn('Error loading wallpaper config:', e);
  }
  return DEFAULT_WALLPAPER_CONFIG;
}

export function saveWallpaperConfig(config: GlobalWallpaperConfig) {
  try {
    localStorage.setItem(WALLPAPER_CONFIG_KEY, JSON.stringify(config));
    // Also save legacy key for compatibility
    if (config.wallpaperId) {
      localStorage.setItem('learning_os_desktop_wallpaper', config.wallpaperId);
    }
  } catch (e) {
    console.warn('Error saving wallpaper config:', e);
  }
}

export function resolveWallpaperItem(config: GlobalWallpaperConfig): WallpaperItem {
  if (config.customUrl) {
    return {
      id: 'custom-active',
      title: 'Пользовательские обои',
      category: 'custom',
      type: 'image',
      url: config.customUrl,
      thumbnail: config.customUrl,
      isCustom: true,
    };
  }

  const customList = getCustomWallpapers();
  const customFound = customList.find((w) => w.id === config.wallpaperId);
  if (customFound) return customFound;

  const curatedFound = CURATED_WALLPAPERS.find((w) => w.id === config.wallpaperId);
  if (curatedFound) return curatedFound;

  return CURATED_WALLPAPERS[0];
}

export function getWallpaperCssBackground(config: GlobalWallpaperConfig): string {
  const item = resolveWallpaperItem(config);
  if (item.type === 'gradient') {
    return item.url;
  }
  return `url("${item.url}")`;
}
