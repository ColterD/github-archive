// docs/.vitepress/utils/rss.ts
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { Feed } from 'feed';
import glob from 'fast-glob';
import matter from 'gray-matter';
import { readFileSync } from 'fs';

export async function generateRSS(
  baseUrl: string,
  outDir: string,
  contentDir: string
) {
  // Create a new feed
  const feed = new Feed({
    title: 'Colter+',
    description: 'My Digital Universe - Curated. Projects, blogs, and guides by Colter.',
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    image: `${baseUrl}/logo.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `Copyright © ${new Date().getFullYear()} Colter+`,
    feedLinks: {
      rss: `${baseUrl}/rss.xml`,
      json: `${baseUrl}/feed.json`,
      atom: `${baseUrl}/atom.xml`,
    },
    author: {
      name: 'Colter',
      email: 'colter@colter.plus',
      link: baseUrl,
    },
  });

  // Find all blog posts
  const blogFiles = await glob(['blog/**/*.md'], {
    cwd: contentDir,
    ignore: ['**/index.md'],
  });

  // Process each blog post
  for (const file of blogFiles) {
    const filePath = resolve(contentDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const { data, excerpt, content: html } = matter(content, { excerpt: true });

    const url = `${baseUrl}/${file.replace(/\.md$/, '')}`;
    
    feed.addItem({
      title: data.title,
      id: url,
      link: url,
      description: data.description || excerpt,
      content: html,
      author: [
        {
          name: data.author || 'Colter',
          email: 'colter@colter.plus',
          link: baseUrl,
        },
      ],
      date: new Date(data.date),
      image: data.image ? `${baseUrl}${data.image}` : undefined,
      category: data.tags?.map((tag: string) => ({ name: tag })),
    });
  }

  // Write the RSS feed to files
  writeFileSync(resolve(outDir, 'rss.xml'), feed.rss2());
  writeFileSync(resolve(outDir, 'atom.xml'), feed.atom1());
  writeFileSync(resolve(outDir, 'feed.json'), feed.json1());

  console.log('RSS feed generated successfully!');
}