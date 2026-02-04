/**
 * Centralized Validation Utilities
 * Provides robust validation for all admin panel inputs
 */

export const validation = {
  /**
   * Email validation
   */
  email: (email: string): { valid: boolean; error?: string } => {
    if (!email) return { valid: false, error: "El email es requerido" };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Email inválido" };
    }

    return { valid: true };
  },

  /**
   * URL validation
   */
  url: (url: string, required = false): { valid: boolean; error?: string } => {
    if (!url) {
      return required
        ? { valid: false, error: "La URL es requerida" }
        : { valid: true };
    }

    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: "URL inválida" };
    }
  },

  /**
   * Text validation (min/max length, no HTML)
   */
  text: (
    text: string,
    options: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      label?: string;
    } = {},
  ): { valid: boolean; error?: string } => {
    const {
      required = false,
      minLength = 0,
      maxLength = 10000,
      label = "El texto",
    } = options;

    if (!text || text.trim() === "") {
      return required
        ? { valid: false, error: `${label} es requerido` }
        : { valid: true };
    }

    const trimmed = text.trim();

    if (trimmed.length < minLength) {
      return {
        valid: false,
        error: `${label} debe tener al menos ${minLength} caracteres`,
      };
    }

    if (trimmed.length > maxLength) {
      return {
        valid: false,
        error: `${label} no puede exceder ${maxLength} caracteres`,
      };
    }

    return { valid: true };
  },

  /**
   * File validation (size, type)
   */
  file: (
    file: File,
    options: {
      maxSizeMB?: number;
      allowedTypes?: string[];
    } = {},
  ): { valid: boolean; error?: string } => {
    const {
      maxSizeMB = 5,
      allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    } = options;

    if (!file) {
      return { valid: false, error: "No se seleccionó ningún archivo" };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `El archivo no puede superar ${maxSizeMB}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Usa: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`,
      };
    }

    return { valid: true };
  },

  /**
   * Coupon code validation
   */
  couponCode: (code: string): { valid: boolean; error?: string } => {
    if (!code || code.trim() === "") {
      return { valid: false, error: "El código de cupón es requerido" };
    }

    const trimmed = code.trim().toUpperCase();

    if (trimmed.length < 3) {
      return {
        valid: false,
        error: "El código debe tener al menos 3 caracteres",
      };
    }

    if (trimmed.length > 20) {
      return {
        valid: false,
        error: "El código no puede exceder 20 caracteres",
      };
    }

    // Only alphanumeric and hyphens
    if (!/^[A-Z0-9-]+$/.test(trimmed)) {
      return {
        valid: false,
        error: "Solo se permiten letras, números y guiones",
      };
    }

    return { valid: true };
  },

  /**
   * Percentage validation (0-100)
   */
  percentage: (value: number): { valid: boolean; error?: string } => {
    if (value === null || value === undefined) {
      return { valid: false, error: "El porcentaje es requerido" };
    }

    if (value < 1 || value > 100) {
      return { valid: false, error: "El porcentaje debe estar entre 1 y 100" };
    }

    return { valid: true };
  },

  /**
   * Price validation (positive number)
   */
  price: (value: number): { valid: boolean; error?: string } => {
    if (value === null || value === undefined) {
      return { valid: false, error: "El precio es requerido" };
    }

    if (value < 0) {
      return { valid: false, error: "El precio no puede ser negativo" };
    }

    return { valid: true };
  },

  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHtml: (html: string): string => {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Sanitize text input
   */
  sanitizeText: (text: string): string => {
    return text
      .trim()
      .replace(/[<>]/g, "") // Remove < and >
      .replace(/\s+/g, " "); // Normalize whitespace
  },
};

/**
 * Form validation helper
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Partial<
    Record<keyof T, (value: any) => { valid: boolean; error?: string }>
  >,
): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let valid = true;

  for (const [field, validator] of Object.entries(rules) as [keyof T, any][]) {
    const result = validator(data[field]);
    if (!result.valid) {
      errors[field] = result.error;
      valid = false;
    }
  }

  return { valid, errors };
}
