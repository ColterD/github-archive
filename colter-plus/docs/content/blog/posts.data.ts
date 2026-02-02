// docs/content/blog/posts.data.ts
import { createContentLoader } from 'vitepress'
import type { ContentData } from 'vitepress'
import { formatDate, FormattedDate } from '../../.vitepress/utils/dateUtils'

export interface PostFrontmatter {
  title: string
  description: string
  date: string
  tags: string[]
  author: string
}

export interface Post extends ContentData {
  frontmatter: PostFrontmatter
  excerpt: string | undefined
  date: FormattedDate
}

export default createContentLoader('blog/*.md', {
  excerpt: true,
  transform(rawData) {
    return rawData
      .sort((a, b) => {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
      })
      .map(post => {
        // Use type assertion to match expected type
        return {
          ...post,
          frontmatter: post.frontmatter as PostFrontmatter,
          date: formatDate(post.frontmatter.date)
        } as Post
      })
  }
})