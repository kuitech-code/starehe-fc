const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const BUCKET_NAME = "player-photos";
const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

let supabaseClient;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Image storage is not configured.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

async function uploadImage(file, folder) {
  if (!file?.buffer) {
    throw new Error("No image file was provided.");
  }

  const extension = allowedTypes[file.mimetype];

  if (!extension) {
    throw new Error("Choose a JPG, PNG, WebP, or GIF image.");
  }

  if (!["players", "news", "teams"].includes(folder)) {
    throw new Error("Invalid image folder.");
  }

  const filePath = `${folder}/${crypto.randomUUID()}${extension}`;
  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function deleteImage(publicUrl) {
  if (typeof publicUrl !== "string" || !publicUrl) return;

  const projectUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  if (!projectUrl) return;

  const prefix = `${projectUrl}/storage/v1/object/public/${BUCKET_NAME}/`;
  if (!publicUrl.startsWith(prefix)) return;

  const filePath = publicUrl.slice(prefix.length).split("?")[0];
  if (!filePath) return;

  const { error } = await getSupabase()
    .storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw error;
}

module.exports = { uploadImage, deleteImage };
