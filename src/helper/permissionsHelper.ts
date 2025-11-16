import { getCookieHelper } from "./cookieHelper";
import { UserModule } from "../types/services/auth/auth.types";

/**
 * Obtiene los módulos del usuario desde las cookies
 */
export const getUserModules = (): UserModule[] => {
  try {
    const modulesStr = getCookieHelper('user_modules');
    if (!modulesStr) return [];
    return JSON.parse(modulesStr) as UserModule[];
  } catch (error) {
    console.error('Error parsing user modules:', error);
    return [];
  }
};

/**
 * Verifica si el usuario tiene acceso a un módulo específico
 * @param moduleName - Nombre del módulo a verificar (e.g., 'users', 'products')
 */
export const hasModuleAccess = (moduleName: string): boolean => {
  const userModules = getUserModules();
  return userModules.some(module => module.name === moduleName);
};

/**
 * Verifica si el usuario tiene acceso a cualquiera de los módulos especificados
 * @param moduleNames - Array de nombres de módulos
 */
export const hasAnyModuleAccess = (moduleNames: string[]): boolean => {
  const userModules = getUserModules();
  const userModuleNames = userModules.map(m => m.name);
  return moduleNames.some(moduleName => userModuleNames.includes(moduleName));
};
