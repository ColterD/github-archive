import { createContentLoader } from 'vitepress'

export default createContentLoader('guides/*.md', {
  excerpt: true,
  transform(rawData) {
    // Filter out index.md
    const guides = rawData.filter(page => !page.url.endsWith('/'))
    
    // Sort by date (newest first) and then by title
    return guides.sort((a, b) => {
      // Improved date handling with proper fallback
      const dateA = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0;
      const dateB = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0;
      
      const dateComparison = dateB - dateA;
      if (dateComparison !== 0) return dateComparison;
      
      // Fallback to title sort with null checks
      return (a.frontmatter.title || '').localeCompare(b.frontmatter.title || '')
    }).map(guide => {
      // Extract date information
      const date = new Date(guide.frontmatter.date || '');
      
      return {
        ...guide,
        date: {
          raw: guide.frontmatter.date,
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