import { supabase } from "./supabase.service";
import {
  sendPaymentConfirmationEmail,
  sendFreeTrialInvoiceEmail,
} from "./brevo.service";

export class FulfillmentService {
  /**
   * Activa los links pendientes de un usuario tras un pago exitoso o free trial.
   * @param userId ID del usuario
   * @param paymentId ID del pago (para referencia)
   */
  static async activateLinkProduct(
    userId: string,
    paymentId: string,
    amount: number,
    currency: string,
  ) {
    try {
      console.log(`🚀 Iniciando activación de producto para usuario ${userId}`);

      // 1. Fetch payment metadata to see if there are links to create
      const { data: payment } = await supabase
        .from("payments")
        .select("metadata")
        .eq("id", paymentId)
        .single();

      const linksToCreate = payment?.metadata?.linksData || [];
      const customDomain = payment?.metadata?.customDomain;

      const now = new Date();
      let expiresAt = new Date();

      if (amount === 0) {
        expiresAt.setDate(now.getDate() + 30);
      } else {
        expiresAt.setDate(now.getDate() + 30);
      }

      let activatedCount = 0;

      if (linksToCreate.length > 0) {
        console.log(
          `📝 Creando ${linksToCreate.length} nuevos links desde metadatos`,
        );

        for (const draft of linksToCreate) {
          const randomSlug = Math.random().toString(36).substring(2, 8);
          const nameToUse = draft.name || "Mi Link";
          const slugToUse =
            nameToUse.toLowerCase().replace(/[^a-z0-9]/g, "-") +
            "-" +
            randomSlug;

          // A. Insert into smart_links
          const { data: newLink, error: linkError } = await supabase
            .from("smart_links")
            .insert({
              user_id: userId,
              slug: slugToUse,
              title: draft.profileName,
              photo: draft.profileImage,
              is_active: false,
              status: "pending",
              expires_at: expiresAt.toISOString(),
              custom_domain: customDomain?.toLowerCase(),
              config: {
                template: draft.template,
                theme: draft.theme,
                name: draft.name,
                folder: draft.folder,
                landingMode: draft.landingMode,
                profileImageSize: draft.profileImageSize,
              },
            })
            .select("id")
            .single();

          if (linkError || !newLink) {
            console.error(`❌ Error creando link ${draft.name}:`, linkError);
            continue;
          }

          // B. Insert buttons into smart_link_buttons
          if (Array.isArray(draft.buttons) && draft.buttons.length > 0) {
            const buttonsToInsert = draft.buttons.map(
              (btn: any, index: number) => ({
                smart_link_id: newLink.id,
                type: btn.type,
                title: btn.title,
                subtitle: btn.subtitle,
                url: btn.url,
                color: btn.color,
                text_color: btn.text_color || btn.textColor,
                font: btn.font,
                border_radius: btn.border_radius || btn.borderRadius,
                opacity: btn.opacity,
                is_active: btn.is_active ?? btn.isActive ?? true,
                order: btn.order ?? index,
                rotator_active:
                  btn.rotator_active ?? btn.rotatorActive ?? false,
                rotator_links: btn.rotator_links || btn.rotatorLinks || [],
              }),
            );

            const { error: buttonsError } = await supabase
              .from("smart_link_buttons")
              .insert(buttonsToInsert);

            if (buttonsError) {
              console.error(
                `❌ Error insertando botones para link ${newLink.id}:`,
                buttonsError,
              );
            }
          }
          activatedCount++;
        }
      } else {
        // Fallback: Activar links "pendientes" existentes (legacy)
        console.log(
          "⚠️ No se encontraron metadatos, activando links pendientes existentes",
        );
        const { data: activatedLinks, error: updateError } = await supabase
          .from("smart_links")
          .update({
            is_active: false,
            status: "pending",
            expires_at: expiresAt.toISOString(),
          })
          .eq("user_id", userId)
          .eq("is_active", false)
          .select();

        if (updateError) {
          console.error("❌ Error al activar links pendientes:", updateError);
        } else {
          activatedCount = activatedLinks?.length || 0;
        }
      }

      console.log(
        `✅ ${activatedCount} links finalizados para el usuario. Vencimiento: ${expiresAt.toISOString()}`,
      );

      // 2. Enviar correo de confirmación adecuado
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      const userName =
        profile?.full_name || userData.user?.email?.split("@")[0] || "Usuario";

      if (userData.user?.email) {
        if (amount === 0) {
          await sendFreeTrialInvoiceEmail(
            userData.user.email,
            userName,
            now,
            expiresAt,
            paymentId,
          );
        } else {
          await sendPaymentConfirmationEmail(
            userData.user.email,
            amount,
            currency,
            paymentId,
          );
        }
      }

      return { success: true, activatedCount };
    } catch (error) {
      console.error("❌ Error en FulfillmentService:", error);
      return { success: false, error };
    }
  }
}
