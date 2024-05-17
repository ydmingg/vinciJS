import type { IDrawSettings, IDrawStorage, IDrawMode } from '../types';

export const defaultMode: IDrawMode = 'select';

export const defaultSettings: Required<IDrawSettings> = {
  mode: defaultMode
};

export function getDefaultStorage(): IDrawStorage {
  const storage: IDrawStorage = {
    mode: defaultMode,
    enableRuler: false,
    enableScale: false,
    enableScroll: false,
    enableSelect: false,
    enableTextEdit: false,
    enableDrag: false,
    enableInfo: false
  };
  return storage;
}
