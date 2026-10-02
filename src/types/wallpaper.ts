export type WallpaperCategory = 
  | 'all'
  | 'nature' 
  | 'space' 
  | 'architecture' 
  | 'cyberpunk' 
  | 'gradient' 
  | 'custom';

export interface WallpaperItem {
  id: string;
  title: string;
  category: 'nature' | 'space' | 'architecture' | 'cyberpunk' | 'gradient' | 'custom';
  type: 'image' | 'gradient';
  url: string;
  thumbnail: string;
  author?: string;
  location?: string;
  accentColor?: string;
  isCustom?: boolean;
}

export interface GlobalWallpaperConfig {
  wallpaperId: string;
  customUrl?: string;
  dimOpacity: number; // 0 to 0.70
  blurAmount: number; // 0 to 16 px
  applyEverywhere: boolean; // true = background across all tabs & windows
}

export const DEFAULT_WALLPAPER_CONFIG: GlobalWallpaperConfig = {
  wallpaperId: 'minimal-white',
  dimOpacity: 0,
  blurAmount: 0,
  applyEverywhere: true,
};
