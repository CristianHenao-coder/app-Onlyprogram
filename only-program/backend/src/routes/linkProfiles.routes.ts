import { Router, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import { supabase } from "../services/supabase.service";
import {
  authenticateToken as authMiddleware,
  AuthRequest,
} from "../middlewares/auth.middleware";
import { linkProfilesService } from "../services/linkProfiles.service";

// Extend AuthRequest to include multer's file field
type MulterRequest = AuthRequest & { file?: Express.Multer.File };

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb: FileFilterCallback) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

/**
 * Helper function to optimize and upload image
 */
async function optimizeAndUploadImage(
  buffer: Buffer,
  userId: string,
  folder: "profile" | "backgrounds" | "icons",
): Promise<string> {
  // Optimize image with sharp
  const optimizedBuffer = await sharp(buffer)
    .resize(500, 500, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${userId}/${folder}/${timestamp}.jpg`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from("link-assets")
    .upload(filename, optimizedBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data } = supabase.storage.from("link-assets").getPublicUrl(filename);

  return data.publicUrl;
}

/**
 * GET /api/link-profiles
 * Get current user's link profile
 */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await linkProfilesService.getProfile(userId);

    res.json({ profile });
  } catch (error: any) {
    console.error("Error fetching link profile:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/link-profiles
 * Create or update link profile
 */
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profileData = { ...req.body, user_id: userId };

    const profile = await linkProfilesService.upsertProfile(profileData);

    res.json({ profile });
  } catch (error: any) {
    console.error("Error upserting link profile:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/link-profiles/smart-link
 * Get smart link with buttons
 */
router.get(
  "/smart-link",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const linkId = req.query.linkId as string | undefined;

      const smartLink = await linkProfilesService.getSmartLink(userId, linkId);

      res.json({ smartLink });
    } catch (error: any) {
      console.error("Error fetching smart link:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/link-profiles/buttons/:linkId
 * Update buttons for a smart link
 */
router.post(
  "/buttons/:linkId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkId } = req.params;
      const { buttons } = req.body;

      await linkProfilesService.updateButtons(linkId, buttons);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating buttons:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/link-profiles/branding/:linkId
 * Update branding (photo, title, subtitle, verified badge)
 */
router.post(
  "/branding/:linkId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkId } = req.params;
      const branding = req.body;

      await linkProfilesService.updateBranding(linkId, branding);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating branding:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/link-profiles/upload/profile-photo
 * Upload and optimize profile photo
 */
router.post(
  "/upload/profile-photo",
  authMiddleware,
  upload.single("photo"),
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user!.id;
      const url = await optimizeAndUploadImage(
        req.file.buffer,
        userId,
        "profile",
      );

      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/link-profiles/upload/background
 * Upload and optimize background image
 */
router.post(
  "/upload/background",
  authMiddleware,
  upload.single("background"),
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user!.id;
      const url = await optimizeAndUploadImage(
        req.file.buffer,
        userId,
        "backgrounds",
      );

      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading background:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/link-profiles/upload/icon
 * Upload button icon
 */
router.post(
  "/upload/icon",
  authMiddleware,
  upload.single("icon"),
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user!.id;
      const url = await optimizeAndUploadImage(
        req.file.buffer,
        userId,
        "icons",
      );

      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading icon:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * DELETE /api/link-profiles/image
 * Delete an image from storage
 */
router.delete(
  "/image",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: "Path is required" });
      }

      await linkProfilesService.deleteImage(path);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
