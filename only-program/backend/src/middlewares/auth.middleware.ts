import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware para verificar el token JWT de Supabase
 * Extrae el token del header Authorization y valida con Supabase
 */
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "No se proporcionó token de autenticación",
        code: "NO_TOKEN",
      });
    }

    // Verificar el token con Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({
        error: "Token inválido o expirado",
        code: "INVALID_TOKEN",
      });
    }

    // Intentar obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .single();

    // Si no existe el perfil, lo creamos al vuelo (Self-healing)
    // Esto pasa a veces si el trigger de creación de perfil falló o no existe
    if (profileError && profileError.code === 'PGRST116') {
      console.log(`⚠️ Perfil no encontrado para usuario ${user.id}. Creando perfil por defecto...`);

      const { error: createError } = await supabase.from("profiles").insert({
        id: user.id,
        role: "user",
        is_suspended: false,
        created_at: new Date().toISOString()
      });

      if (createError) {
        console.error("❌ Error creando perfil automático:", createError);
        return res.status(500).json({
          error: "Error al crear perfil de usuario",
          code: "PROFILE_CREATION_ERROR",
        });
      }

      // Asignamos valores por defecto para continuar
      req.user = {
        id: user.id,
        email: user.email,
        role: "user",
      };
      return next();
    } else if (profileError) {
      // Otro tipo de error de base de datos
      console.error("❌ Error DB al obtener perfil:", profileError);
      return res.status(500).json({
        error: "Error al obtener datos del usuario",
        code: "PROFILE_ERROR",
        details: profileError.message
      });
    }

    // Verificar si el usuario está suspendido
    if (profile?.is_suspended) {
      return res.status(403).json({
        error: "Tu cuenta ha sido suspendida",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || "user",
    };

    next();
  } catch (error) {
    console.error("Error en middleware de autenticación:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      code: "SERVER_ERROR",
    });
  }
}

/**
 * Middleware para verificar que el usuario es administrador
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      error: "No autenticado",
      code: "NOT_AUTHENTICATED",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Acceso denegado. Se requiere rol de administrador",
      code: "ADMIN_REQUIRED",
    });
  }

  next();
}

/**
 * Middleware opcional de autenticación
 * Permite acceso sin token, pero agrega información del usuario si está presente
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        req.user = {
          id: user.id,
          email: user.email,
          role: profile?.role || "user",
        };
      }
    }

    next();
  } catch (error) {
    // Ignorar errores en autenticación opcional
    next();
  }
}
