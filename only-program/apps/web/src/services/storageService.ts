import { supabase } from "./supabase";
import { retryWithBackoff } from "../utils/retryHelper";
import { logActions } from "./auditService";

/**
 * Service to handle media uploads to Supabase Storage
 */
export const storageService = {
  /**
   * Converts an image to WebP using Canvas and uploads it to the bucket.
   */
  async uploadImage(file: File, bucketPath: string): Promise<string> {
    const fileName = `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.webp`;
    const fullPath = `${bucketPath}/${fileName}`;

    // Convert to WebP in browser
    const webpBlob = await convertToWebP(file);

    await retryWithBackoff(async () => {
      const result = await supabase.storage
        .from("cms-assets")
        .upload(fullPath, webpBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (result.error) throw result.error;
      return result;
    });

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("cms-assets").getPublicUrl(fullPath);

    // Log the upload
    await logActions.mediaUpload(fullPath, {
      size: file.size,
      type: file.type,
    });

    return publicUrl;
  },

  /**
   * Deletes an image from the bucket using its public URL.
   */
  async deleteImage(url: string) {
    if (!url) return;

    try {
      // Extract path from public URL
      // Example URL: https://xxx.supabase.co/storage/v1/object/public/cms-assets/logos/123.webp
      const parts = url.split("cms-assets/");
      if (parts.length < 2) return;

      const path = parts[1];
      const { error } = await supabase.storage
        .from("cms-assets")
        .remove([path]);

      if (error) throw error;

      // Log the deletion
      await logActions.mediaDelete(path);
    } catch (err) {
      console.error("Error deleting image from storage:", err);
    }
  },
};

/**
 * Helper to convert Image File to WebP Blob
 */
async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("WebP conversion failed"));
          },
          "image/webp",
          0.85, // quality
        );
      };
      img.onerror = () =>
        reject(new Error("Failed to load image for conversion"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
