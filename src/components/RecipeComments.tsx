import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { notify } from '../lib/toast'
import { getAvatarInitials } from '../lib/userUtils'
import {
  createComment,
  deleteComment,
  getRecipeComments,
  MAX_COMMENT_LENGTH,
} from '../services/comments'
import type { RecipeComment } from '../types/Comment'
import type { Recipe } from '../types/Recipe'
import { recipeSupportsComments } from '../utils/recipeComments'

type RecipeCommentsProps = {
  recipe: Recipe
  onViewAuthor?: (username: string) => void
}

function formatCommentDate(isoDate: string): string {
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function CommentAvatar({ comment }: { comment: RecipeComment }) {
  const initials = getAvatarInitials(
    comment.displayName,
    comment.username ?? undefined
  )

  if (comment.avatarUrl) {
    return (
      <img
        src={comment.avatarUrl}
        alt=""
        className="recipe-comments__avatar recipe-comments__avatar--image"
        loading="lazy"
      />
    )
  }

  return (
    <span className="recipe-comments__avatar" aria-hidden="true">
      {initials}
    </span>
  )
}

export default function RecipeComments({
  recipe,
  onViewAuthor,
}: RecipeCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<RecipeComment[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)

  const supportsComments = recipeSupportsComments(recipe)

  const loadComments = useCallback(async () => {
    if (!supportsComments) {
      setComments([])
      setLoadError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)

    try {
      const rows = await getRecipeComments(recipe.id)
      setComments(rows)
    } catch (error) {
      console.error('Failed to load comments:', error)
      setLoadError('Failed to load comments. Please try again.')
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [recipe.id, supportsComments])

  useEffect(() => {
    setDraft('')
    void loadComments()
  }, [loadComments, recipe.id])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user || posting || !supportsComments) {
      return
    }

    const trimmed = draft.trim()

    if (!trimmed) {
      notify.error('Write a comment before submitting.')
      return
    }

    setPosting(true)

    try {
      await createComment(recipe.id, trimmed)
      setDraft('')
      await loadComments()
      notify.success('Comment posted.')
    } catch (error) {
      console.error('Failed to post comment:', error)
      notify.error(
        error instanceof Error
          ? error.message
          : 'Failed to post comment. Please try again.'
      )
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(commentId: string) {
    if (!user || deletingId) {
      return
    }

    setDeletingId(commentId)

    try {
      await deleteComment(commentId)
      await loadComments()
      notify.success('Comment deleted.')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      notify.error('Failed to delete comment. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleAuthorClick(username: string | null) {
    const trimmed = username?.trim()
    if (!trimmed) return
    onViewAuthor?.(trimmed)
  }

  return (
    <section
      className="recipe-comments"
      aria-label="Comments"
      data-recipe-id={recipe.id}
      data-recipe-source={recipe.source ?? 'unknown'}
    >
      <div className="recipe-comments__header">
        <h3 className="recipe-comments__title">Comments</h3>
        {supportsComments ? (
          <span className="recipe-comments__count">{comments.length}</span>
        ) : null}
      </div>

      {!supportsComments ? (
        <p className="recipe-comments__notice">
          Comments are available on shared community and user recipes.
        </p>
      ) : null}

      {supportsComments && loading ? (
        <p className="recipe-comments__state" aria-live="polite">
          Loading comments…
        </p>
      ) : null}

      {supportsComments && loadError ? (
        <p className="recipe-comments__error" role="alert">
          {loadError}
        </p>
      ) : null}

      {supportsComments && !loading && !loadError && comments.length === 0 ? (
        <p className="recipe-comments__state">No comments yet</p>
      ) : null}

      {supportsComments && !loading && comments.length > 0 ? (
        <ul className="recipe-comments__list">
          {comments.map((comment) => {
            const displayName =
              comment.displayName?.trim() ||
              comment.username?.trim() ||
              'Savora member'
            const canDelete = Boolean(user && user.id === comment.userId)

            return (
              <li key={comment.id} className="recipe-comments__item">
                <CommentAvatar comment={comment} />

                <div className="recipe-comments__body">
                  <div className="recipe-comments__meta">
                    <div className="recipe-comments__author">
                      <span className="recipe-comments__display-name">
                        {displayName}
                      </span>
                      {comment.username ? (
                        <button
                          type="button"
                          className="recipe-comments__username"
                          onClick={() => handleAuthorClick(comment.username)}
                        >
                          @{comment.username}
                        </button>
                      ) : null}
                    </div>

                    <time
                      className="recipe-comments__date"
                      dateTime={comment.createdAt}
                    >
                      {formatCommentDate(comment.createdAt)}
                    </time>
                  </div>

                  <p className="recipe-comments__text">{comment.content}</p>
                </div>

                {canDelete ? (
                  <button
                    type="button"
                    className="recipe-comments__delete"
                    onClick={() => void handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    aria-label="Delete your comment"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      {supportsComments && user ? (
        <form
          className="recipe-comments__form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="recipe-comments__label" htmlFor={`comment-${recipe.id}`}>
            Write a comment…
          </label>
          <textarea
            id={`comment-${recipe.id}`}
            className="recipe-comments__textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a comment…"
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            disabled={posting}
          />
          <div className="recipe-comments__form-footer">
            <span className="recipe-comments__counter">
              {draft.length}/{MAX_COMMENT_LENGTH}
            </span>
            <button
              type="submit"
              className="recipe-comments__submit"
              disabled={posting || draft.trim().length === 0}
            >
              {posting ? 'Posting…' : 'Submit'}
            </button>
          </div>
        </form>
      ) : null}

      {supportsComments && !user ? (
        <p className="recipe-comments__notice">Sign in to write a comment.</p>
      ) : null}
    </section>
  )
}
