// docs/.vitepress/utils/sitemap.ts
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import glob from 'fast-glob';

export async function generateSitemap(
  baseUrl: string,
  outDir: string,
  contentDir: string
) {
  const contentFiles = await glob(['**/*.md', '!**/node_modules/**'], {
    cwd: contentDir,
    ignore: ['**/node_modules/**', '**/README.md', '**/index.md']
  });

  // Create a stream to write to
  const stream = new SitemapStream({ hostname: baseUrl });

  // Add the home page
  stream.write({ url: '/', changefreq: 'daily', priority: 1.0 });

  // Add content pages
  for (const file of contentFiles) {
    const url = `/${file.replace(/\.md$/, '')}`;
    stream.write({
      url,
      changefreq: 'weekly',
      priority: 0.7
    });
  }

  // Add section index pages
  const sections = ['blog', 'projects', 'guides'];
  for (const section of sections) {
    stream.write({
      url: `/${section}/`,
      changefreq: 'daily',
      priority: 0.8
    });
  }

  // End the stream
  stream.end();

  // Generate sitemap
  const sitemap = await streamToPromise(Readable.from(stream));
  writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap.toString());

  console.log('Sitemap generated successfully!');
}