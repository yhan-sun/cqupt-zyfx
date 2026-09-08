import { readFileSync } from 'node:fs';

const json = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
export const site = json('site');
export const join = json('join');
export const content = json('content');
export const official = json('official-posts');
export const members = json('member-media');
export const gallery = json('gallery');
export const baseMedia = json('media');
export const officialMedia = json('official-media');

export function createModel({ media = baseMedia, photoMedia = [] } = {}) {
  const derivatives = new Map(photoMedia.map(item => [item.id, item]));
  const sources = new Map([
    ...media.map(item => [item.id, {
      ...item, kind: 'campus', src: `media/${item.id}.${item.format || 'webp'}`,
      date: item.year, dateLabel: item.year ? `${item.year} 年` : '校园资料',
      scope: '校园赛事', sourceLabel: item.credit
    }]),
    ...officialMedia.map(item => [item.id, {
      ...item, kind: 'official', src: `media/official/${item.id}.webp`,
      source: item.article, date: item.published, dateLabel: `${item.published} 发布`,
      sourceLabel: official.sourceName, scope: '跑团记录'
    }]),
    ...members.items.map(item => [item.id, {
      ...item, kind: 'member', src: `assets/member/${item.file}`,
      date: item.year, dateLabel: `${item.year} 年`,
      source: `sources.html#${item.id}`, sourceLabel: '协会提供', credit: '协会提供',
      license: members.rights
    }])
  ]);
  const seen = new Set();
  const postsById = new Map(official.posts.map(item => [item.id, item]));
  const photos = gallery.items.map(entry => {
    const source = sources.get(entry.id);
    if (!source || seen.has(entry.id)) throw new Error(`Unknown or duplicate gallery image: ${entry.id}`);
    if (!(entry.category in gallery.categories)) throw new Error(`Unknown photo category: ${entry.category}`);
    if (entry.postId && !postsById.has(entry.postId)) throw new Error(`Unknown photo event: ${entry.postId}`);
    seen.add(entry.id);
    const post = postsById.get(entry.postId);
    return {
      ...source, ...entry, ...derivatives.get(entry.id),
      scope: entry.scope || source.scope,
      date: post?.eventDate || source.date,
      dateLabel: post?.eventDate || source.dateLabel
    };
  });
  const posts = official.posts.map(post => ({
    ...post, path: `activities/${post.id}.html`,
    date: post.eventDate || post.published,
    dateLabel: post.eventDate || `${post.published} 发布`,
    photos: photos.filter(photo => photo.postId === post.id)
  })).sort((a, b) => b.date.localeCompare(a.date));
  for (const id of [...site.homePhotos, site.homePhoto]) {
    if (!seen.has(id)) throw new Error(`Unknown home photo: ${id}`);
  }
  for (const id of site.featuredPosts) {
    if (!postsById.has(id)) throw new Error(`Unknown featured post: ${id}`);
  }
  if (!/^https:\/\/qm\.qq\.com\//.test(join.joinUrl) || !/^\d+$/.test(join.groupNumber)) {
    throw new Error('Invalid verified QQ configuration');
  }
  return { site, join, content, official, members, gallery, media, photos, posts };
}
