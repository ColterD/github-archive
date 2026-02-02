// contentlayer.config.js
import { defineDocumentType, makeSource } from 'contentlayer/source-files';

const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `blog/**/*.md`,
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    description: { type: 'string', required: true },
    tags: { type: 'list', of: { type: 'string' }, required: true },
    author: { type: 'string', required: true }
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => `/blog/${post._raw.flattenedPath.replace('blog/', '')}`
    }
  }
}));

const Project = defineDocumentType(() => ({
  name: 'Project',
  filePathPattern: `projects/**/*.md`,
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'date', required: true },
    status: {
      type: 'enum',
      options: ['in-progress', 'completed', 'planned'],
      required: true
    },
    tags: { type: 'list', of: { type: 'string' }, required: true }
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (project) => `/projects/${project._raw.flattenedPath.replace('projects/', '')}`
    }
  }
}));

export default makeSource({
  contentDirPath: 'docs/content',
  documentTypes: [Post, Project]
});