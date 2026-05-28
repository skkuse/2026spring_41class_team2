import { access, readFile } from "node:fs/promises"
import path from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseServiceEnv, loadEnvFiles, ROOT_DIR } from "./env"
import { characterChatMovieSeeds } from "./seed-data"
import { avatarStoragePath, CHARACTER_IMAGE_BUCKET } from "./seed-utils"

async function ensureBucket(supabase: SupabaseClient) {
  const { data: bucket, error: getBucketError } = await supabase.storage.getBucket(CHARACTER_IMAGE_BUCKET)

  if (bucket) {
    return
  }

  if (getBucketError && getBucketError.message !== "Bucket not found") {
    throw new Error(`${CHARACTER_IMAGE_BUCKET} bucket 조회 실패: ${getBucketError.message}`)
  }

  const { error: createBucketError } = await supabase.storage.createBucket(CHARACTER_IMAGE_BUCKET, {
    public: false,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/webp"],
  })

  if (createBucketError) {
    throw new Error(`${CHARACTER_IMAGE_BUCKET} bucket 생성 실패: ${createBucketError.message}`)
  }
}

export async function uploadCharacterImages() {
  await loadEnvFiles()
  const { supabaseUrl, serviceRoleKey } = getSupabaseServiceEnv()
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  await ensureBucket(supabase)

  for (const movieSeed of characterChatMovieSeeds) {
    const imageDir = path.join(
      ROOT_DIR,
      "data",
      "seeds",
      "character-chat",
      "movies",
      String(movieSeed.movieId),
      "images",
      "characters",
    )

    for (const character of movieSeed.characters) {
      const filePath = path.join(imageDir, character.imageFileName)

      try {
        await access(filePath)
      } catch {
        throw new Error(`캐릭터 이미지 파일이 없습니다. path=${filePath}`)
      }

      const body = await readFile(filePath)
      const storagePath = avatarStoragePath(movieSeed.movieId, character.slug)
      const { error } = await supabase.storage.from(CHARACTER_IMAGE_BUCKET).upload(storagePath, body, {
        contentType: "image/webp",
        upsert: true,
      })

      if (error) {
        throw new Error(`${storagePath} 업로드 실패: ${error.message}`)
      }

      console.log(`${CHARACTER_IMAGE_BUCKET}/${storagePath} uploaded`)
    }
  }
}

uploadCharacterImages().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
