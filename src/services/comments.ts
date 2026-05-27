import { supabase } from '../lib/supabaseClient'
import type { Database } from '../types/database'
import type { RecipeComment } from '../types/Comment'

type CommentRow = Database['public']['Tables']['comments']['Row']

type AuthorJoin = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type CommentRowWithAuthor = CommentRow & {
  author?: AuthorJoin | AuthorJoin[] | null
}

const COMMENTS_WITH_AUTHOR_SELECT =
  '*, author:profiles!comments_user_id_fkey(username, display_name, avatar_url)'

const MAX_COMMENT_LENGTH = 500

function getAuthorRecord(row: CommentRowWithAuthor): AuthorJoin | null {
  const author = row.author
  if (!author) return null
  return Array.isArray(author) ? (author[0] ?? null) : author
}

function mapRowToComment(row: CommentRowWithAuthor): RecipeComment {
  const author = getAuthorRecord(row)

  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    username: author?.username ?? null,
    displayName: author?.display_name ?? null,
    avatarUrl: author?.avatar_url ?? null,
  }
}

function validateContent(content: string): string {
  const trimmed = content.trim()

  if (!trimmed) {
    throw new Error('Comment cannot be empty.')
  }

  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`)
  }

  return trimmed
}

/**
 * Fetch all comments for a recipe, oldest first, with author profile fields.
 */
export async function getRecipeComments(recipeId: number): Promise<RecipeComment[]> {
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    throw new Error('A valid recipe id is required.')
  }

  const { data, error } = await supabase
    .from('comments')
    .select(COMMENTS_WITH_AUTHOR_SELECT)
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return ((data ?? []) as unknown as CommentRowWithAuthor[]).map(mapRowToComment)
}

/**
 * Create a comment on a recipe for the signed-in user.
 */
export async function createComment(
  recipeId: number,
  content: string
): Promise<RecipeComment> {
  const trimmed = validateContent(content)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('You must be signed in to comment.')
  }

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    throw new Error('A valid recipe id is required.')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      recipe_id: recipeId,
      user_id: user.id,
      content: trimmed,
    })
    .select(COMMENTS_WITH_AUTHOR_SELECT)
    .single()

  if (error) {
    throw error
  }

  return mapRowToComment(data as unknown as CommentRowWithAuthor)
}

/**
 * Delete a comment. RLS ensures only the owner can remove their row.
 */
export async function deleteComment(commentId: string): Promise<void> {
  const trimmedId = commentId.trim()

  if (!trimmedId) {
    throw new Error('A valid comment id is required.')
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('You must be signed in to delete a comment.')
  }

  const { error } = await supabase.from('comments').delete().eq('id', trimmedId)

  if (error) {
    throw error
  }
}

export { MAX_COMMENT_LENGTH }
