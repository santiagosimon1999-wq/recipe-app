import { supabase } from './supabaseClient'

const RECIPE_IMAGES_BUCKET = 'recipe-images'
const PROFILE_AVATARS_BUCKET = 'profile-avatars'

const ALLOWED_RECIPE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()

  if (!extension) {
    return 'jpg'
  }

  return extension.toLowerCase()
}

function validateRecipeImageFile(file: File) {
  if (!ALLOWED_RECIPE_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.')
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 5 MB or smaller.')
  }
}

export async function uploadRecipeImage(userId: string, file: File) {
  validateRecipeImageFile(file)

  const fileExtension = getFileExtension(file.name)
  const fileName = `${crypto.randomUUID()}.${fileExtension}`
  const filePath = `${userId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(RECIPE_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from(RECIPE_IMAGES_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function uploadProfileImage(userId: string, file: File) {
  if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WebP image.')
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image size must be under 5 MB.')
  }

  const fileExtension = getFileExtension(file.name)
  const fileName = `${crypto.randomUUID()}.${fileExtension}`
  const filePath = `${userId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}
