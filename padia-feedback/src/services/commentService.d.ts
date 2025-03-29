import { Comment } from '../db/models'

export interface CommentService {
  createComment(issueId: number, userId: number, content: string): Promise<Comment | null>
  getIssueComments(issueId: number, page?: number, pageSize?: number): Promise<{
    comments: Comment[]
    total: number
  }>
}

declare const commentService: CommentService
export default commentService 