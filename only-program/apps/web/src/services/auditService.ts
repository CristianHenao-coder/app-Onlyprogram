import { supabase } from "./supabase";

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const auditService = {
  /**
   * Log an admin action
   */
  async logAction(
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      await supabase.rpc("log_admin_action", {
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId || null,
        p_details: details || null,
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
      // Don't throw - logging failures shouldn't break the app
    }
  },

  /**
   * Get recent audit logs
   */
  async getRecentLogs(limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get logs by admin
   */
  async getLogsByAdmin(adminId: string, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get logs by resource type
   */
  async getLogsByResource(
    resourceType: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("resource_type", resourceType)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get logs by action
   */
  async getLogsByAction(action: string, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Search logs
   */
  async searchLogs(query: string, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .or(
        `action.ilike.%${query}%,resource_type.ilike.%${query}%,admin_email.ilike.%${query}%`,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

// Helper functions for common actions
export const logActions = {
  cmsUpdate: (section: string, details?: Record<string, any>) =>
    auditService.logAction("UPDATE", "cms_config", section, details),

  cmsDelete: (section: string, itemId: string, details?: Record<string, any>) =>
    auditService.logAction(
      "DELETE",
      "cms_config",
      `${section}/${itemId}`,
      details,
    ),

  userPromote: (userId: string, details?: Record<string, any>) =>
    auditService.logAction("PROMOTE", "user", userId, details),

  userSuspend: (
    userId: string,
    suspended: boolean,
    details?: Record<string, any>,
  ) =>
    auditService.logAction(
      suspended ? "SUSPEND" : "UNSUSPEND",
      "user",
      userId,
      details,
    ),

  couponCreate: (couponId: string, details?: Record<string, any>) =>
    auditService.logAction("CREATE", "coupon", couponId, details),

  couponDelete: (couponId: string, details?: Record<string, any>) =>
    auditService.logAction("DELETE", "coupon", couponId, details),

  mediaUpload: (path: string, details?: Record<string, any>) =>
    auditService.logAction("UPLOAD", "media", path, details),

  mediaDelete: (path: string, details?: Record<string, any>) =>
    auditService.logAction("DELETE", "media", path, details),
};
