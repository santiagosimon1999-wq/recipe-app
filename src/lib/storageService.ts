import { supabase } from './supabaseClient'

const RECIPE_IMAGES_BUCKET = 'recipe-images'
const PROFILE_AVATARS_BUCKET = 'profile-avatars'

function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()

  if (!extension) {
    return 'jpg'
  }

  return extension.toLowerCase()
}

export async function uploadRecipeImage(userId: string, file: File) {
  const fileExtension = getFileExtension(file.name)
  const fileName = `${crypto.randomUUID()}.${fileExtension}`
  const filePath = `${userId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(RECIPE_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
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
  const fileExtension = getFileExtension(file.name)
  const fileName = `${crypto.randomUUID()}.${fileExtension}`
  const filePath = `${userId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}