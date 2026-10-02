export type ProjectCadenceMode = 'balanced' | 'intensive' | 'relaxed';

export interface ProjectCadenceSettings {
  mode: ProjectCadenceMode;
  autoInjectEnabled: boolean;
  unitsCompletedSinceLastProject: number;
  threshold: number; // balanced = 2-3 units, intensive = 1, relaxed = 4
  totalProjectsInjected: number;
  totalProjectsCompleted: number;
  lastInjectedTopic?: string;
  lastInjectedAt?: number;
}

const STORAGE_KEY = 'learning_os_project_cadence_v1';

export const CADENCE_CONFIGS: Record<ProjectCadenceMode, {
  label: string;
  badge: string;
  threshold: number;
  description: string;
  frequencyText: string;
}> = {
  balanced: {
    label: 'Сбалансированная (Рекомендуется)',
    badge: 'Часто, но не слишком',
    threshold: 2, // Every 2-3 units
    description: 'Оптимальный баланс теории и практики: 1 боевой проект каждые 2-3 пройденные темы.',
    frequencyText: 'Раз в 2-3 темы',
  },
  intensive: {
    label: 'Интенсивная практика',
    badge: 'Максимум кейсов',
    threshold: 1, // Every 1 unit
    description: 'Боевой кейс после каждой пройденной темы. Максимальный темп погружения.',
    frequencyText: 'Каждую тему',
  },
  relaxed: {
    label: 'Размеренная',
    badge: 'Только в финале спринта',
    threshold: 4, // Every 4 units
    description: 'Боевые проекты только на ключевых вехах и в конце спринтов.',
    frequencyText: 'Раз в 4-5 тем',
  },
};

export const DEFAULT_CADENCE_SETTINGS: ProjectCadenceSettings = {
  mode: 'balanced',
  autoInjectEnabled: true,
  unitsCompletedSinceLastProject: 0,
  threshold: 2,
  totalProjectsInjected: 1,
  totalProjectsCompleted: 0,
};

export function loadCadenceSettings(): ProjectCadenceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_CADENCE_SETTINGS,
          ...parsed,
          threshold: CADENCE_CONFIGS[parsed.mode as ProjectCadenceMode]?.threshold || 2,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load cadence settings:', e);
  }
  return { ...DEFAULT_CADENCE_SETTINGS };
}

export function saveCadenceSettings(settings: ProjectCadenceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save cadence settings:', e);
  }
}

/**
 * Checks if the student is due for a new project based on the cadence
 */
export function shouldCadenceTriggerProject(settings: ProjectCadenceSettings): boolean {
  if (!settings.autoInjectEnabled) return false;
  return settings.unitsCompletedSinceLastProject >= settings.threshold;
}

/**
 * Record a lesson completion and determine if project injection should trigger
 */
export function recordLessonCompletion(settings: ProjectCadenceSettings): {
  updatedSettings: ProjectCadenceSettings;
  shouldTrigger: boolean;
} {
  const nextCount = settings.unitsCompletedSinceLastProject + 1;
  const shouldTrigger = settings.autoInjectEnabled && nextCount >= settings.threshold;

  const updatedSettings: ProjectCadenceSettings = {
    ...settings,
    unitsCompletedSinceLastProject: shouldTrigger ? 0 : nextCount,
  };

  saveCadenceSettings(updatedSettings);
  return { updatedSettings, shouldTrigger };
}

/**
 * Record that a project was injected
 */
export function recordProjectInjected(
  settings: ProjectCadenceSettings,
  topic?: string
): ProjectCadenceSettings {
  const updatedSettings: ProjectCadenceSettings = {
    ...settings,
    unitsCompletedSinceLastProject: 0,
    totalProjectsInjected: settings.totalProjectsInjected + 1,
    lastInjectedTopic: topic,
    lastInjectedAt: Date.now(),
  };
  saveCadenceSettings(updatedSettings);
  return updatedSettings;
}

/**
 * Record that a project was successfully audited & completed
 */
export function recordProjectCompleted(settings: ProjectCadenceSettings): ProjectCadenceSettings {
  const updatedSettings: ProjectCadenceSettings = {
    ...settings,
    totalProjectsCompleted: settings.totalProjectsCompleted + 1,
  };
  saveCadenceSettings(updatedSettings);
  return updatedSettings;
}
