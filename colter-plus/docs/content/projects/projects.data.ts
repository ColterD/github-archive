import { createContentLoader } from 'vitepress'

export default createContentLoader('projects/*/index.md', {
  transform(rawData) {
    return rawData
      .sort((a, b) => {
        // Sort by date (newest first)
        const dateA = new Date(a.frontmatter.date || '1970-01-01')
        const dateB = new Date(b.frontmatter.date || '1970-01-01')
        return dateB.getTime() - dateA.getTime()
      })
      .map((page) => {
        // Extract project directory name from URL
        const urlParts = page.url.split('/')
        const projectDir = urlParts[urlParts.length - 2] || ''
        
        // Extract date information
        const date = new Date(page.frontmatter.date || '')
        
        return {
          ...page,
          dir: projectDir,
          date: {
            raw: page.frontmatter.date,
            formatted: date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
          }
        }
      })
  }
})