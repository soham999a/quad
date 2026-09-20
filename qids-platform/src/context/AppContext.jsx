import { createContext, useContext } from 'react';

/**
 * AppContext — shared shell state (assessment data, phase data, evaluations).
 *
 * Lives in its own component-free module on purpose: Vite Fast Refresh cannot
 * hot-update a file that exports both components and a Context. Keeping the
 * context isolated means hot updates of App.jsx never invalidate it, so
 * consumers always read the same context instance the provider holds
 * (the "Cannot destructure of null" class of HMR crashes is gone).
 */
export const AppContext = createContext(null);

/** Read shell state. Throws a clear error if used outside the provider. */
export function useApp() {
  const ctx = useContext(AppContext);
  if (ctx === null) {
    throw new Error('useApp() must be used inside <AppContext.Provider> (rendered by AppShell).');
  }
  return ctx;
}
