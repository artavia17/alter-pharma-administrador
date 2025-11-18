/**
 * Tipos y interfaces para formularios
 */

/**
 * Ciudad de validación de un campo
 */
export interface FieldValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Errores de formulario genérico
 */
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * Ciudad de campos tocados en un formulario
 */
export type TouchedFields<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Ciudad de formulario genérico
 */
export interface FormState<T> {
  data: T;
  errors: FormErrors<T>;
  touched: TouchedFields<T>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Opciones de validación de campo
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

/**
 * Reglas de validación para un formulario
 */
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule;
};

/**
 * Resultado de validación de formulario
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
