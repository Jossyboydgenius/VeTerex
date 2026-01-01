import { supabaseAdmin, STORAGE_BUCKETS } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";
import sharp from "sharp";

// Max file sizes
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Upload profile image to Supabase Storage and save URL to database
 */
export async function uploadProfileImage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
) {
  try {
    console.log("📸 Uploading profile image...");

    // ========== STEP 1: Validate file ==========
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error("File must be an image (JPEG, PNG, WebP, or GIF)");
    }

    if (fileBuffer.length > MAX_PROFILE_IMAGE_SIZE) {
      throw new Error("File size must be less than 5MB");
    }

    // ========== STEP 2: Optimize image with Sharp ==========
    const optimizedBuffer = await sharp(fileBuffer)
      .resize(800, 800, {
        fit: "cover",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    console.log(
      `✅ Image optimized: ${fileBuffer.length} → ${optimizedBuffer.length} bytes`
    );

    // ========== STEP 3: Upload to Supabase Storage ==========
    const ext = "jpg"; // Always save as JPEG after optimization
    const storagePath = `${userId}/${Date.now()}-profile.${ext}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.PROFILE_IMAGES)
      .upload(storagePath, optimizedBuffer, {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      throw uploadError;
    }

    console.log("✅ File uploaded to storage:", storagePath);

    // ========== STEP 4: Get public URL ==========
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.PROFILE_IMAGES)
      .getPublicUrl(storagePath);

    const imageUrl = urlData.publicUrl;
    console.log("✅ Public URL:", imageUrl);

    // ========== STEP 5: Update user in database ==========
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imageUrl,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Database updated with image URL");

    // ========== STEP 6: Create media record ==========
    const media = await prisma.media.create({
      data: {
        userId,
        fileName,
        fileUrl: imageUrl,
        fileType: "image/jpeg",
        fileSize: optimizedBuffer.length,
        storagePath,
        purpose: "profile-image",
      },
    });

    console.log("✅ Media record created:", media.id);

    return {
      success: true,
      imageUrl,
      user,
      media,
    };
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    throw error;
  }
}

/**
 * Delete profile image from storage and update database
 */
export async function deleteProfileImage(userId: string) {
  try {
    console.log("🗑️  Deleting profile image...");

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.profileImage) {
      console.log("⚠️  No image to delete");
      return null;
    }

    // Find media record to get storage path
    const media = await prisma.media.findFirst({
      where: {
        userId,
        purpose: "profile-image",
      },
      orderBy: { createdAt: "desc" },
    });

    if (media?.storagePath) {
      // ========== STEP 1: Delete from storage ==========
      const { error: deleteError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.PROFILE_IMAGES)
        .remove([media.storagePath]);

      if (deleteError) {
        console.error("❌ Storage delete error:", deleteError);
        // Continue anyway to update database
      } else {
        console.log("✅ File deleted from storage");
      }
    }

    // ========== STEP 2: Update database ==========
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: null,
        updatedAt: new Date(),
      },
    });

    // ========== STEP 3: Delete media records ==========
    await prisma.media.deleteMany({
      where: {
        userId,
        purpose: "profile-image",
      },
    });

    console.log("✅ Image deleted successfully");

    return updatedUser;
  } catch (error) {
    console.error("❌ Error deleting image:", error);
    throw error;
  }
}

/**
 * Upload general file
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
  folder: string = "general"
) {
  try {
    console.log(`📁 Uploading ${fileName}...`);

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error("File size must be less than 50MB");
    }

    // Upload to storage
    const ext = fileName.split(".").pop() || "bin";
    const storagePath = `${userId}/${folder}/${Date.now()}-${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.UPLOADS)
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: mimeType,
      });

    if (uploadError) throw uploadError;

    console.log("✅ File uploaded to storage:", storagePath);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.UPLOADS)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // Create media record
    const media = await prisma.media.create({
      data: {
        userId,
        fileName,
        fileUrl,
        fileType: mimeType,
        fileSize: fileBuffer.length,
        storagePath,
        purpose: "upload",
      },
    });

    console.log("✅ File uploaded successfully:", media.id);

    return {
      success: true,
      fileUrl,
      media,
    };
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    throw error;
  }
}

/**
 * Get user's media files
 */
export async function getUserMedia(userId: string, purpose?: string) {
  try {
    const media = await prisma.media.findMany({
      where: {
        userId,
        ...(purpose && { purpose }),
      },
      orderBy: { createdAt: "desc" },
    });

    return media;
  } catch (error) {
    console.error("❌ Error fetching media:", error);
    throw error;
  }
}

/**
 * Delete a media file
 */
export async function deleteMedia(mediaId: string, userId: string) {
  try {
    // Get media record
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId, // Ensure user owns this media
      },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    // Determine bucket
    const bucket =
      media.purpose === "profile-image"
        ? STORAGE_BUCKETS.PROFILE_IMAGES
        : STORAGE_BUCKETS.UPLOADS;

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([media.storagePath]);

    if (deleteError) {
      console.error("❌ Storage delete error:", deleteError);
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });

    console.log("✅ Media deleted:", mediaId);

    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting media:", error);
    throw error;
  }
}
