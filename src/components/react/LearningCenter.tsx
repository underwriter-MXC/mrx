import { useEffect, useMemo, useState } from 'react';
import './LearningCenter.css';

export interface LearningPost {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readingMinutes: number;
}

interface Props {
  posts: LearningPost[];
  initialFilters?: { q?: string; category?: string; tag?: string; author?: string };
}

function initial(name: string) {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) || '';
}

export default function LearningCenter({ posts, initialFilters = {} }: Props) {
  const [query, setQuery] = useState(() => initialFilters.q ?? initial('q'));
  const [category, setCategory] = useState(() => initialFilters.category ?? initial('category'));
  const [tag, setTag] = useState(() => initialFilters.tag ?? initial('tag'));
  const [author, setAuthor] = useState(() => initialFilters.author ?? initial('author'));
  const categories = useMemo(() => [...new Map(posts.map((post) => [post.category, post.categoryLabel])).entries()], [posts]);
  const tags = useMemo(() => [...new Set(posts.flatMap((post) => post.tags))].sort(), [posts]);
  const authors = useMemo(() => [...new Set(posts.map((post) => post.author))].sort(), [posts]);
  const results = useMemo(() => posts.filter((post) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || `${post.title} ${post.description} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase().includes(needle);
    return matchesQuery && (!category || post.category === category) && (!tag || post.tags.includes(tag)) && (!author || post.author === author);
  }), [posts, query, category, tag, author]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (author) params.set('author', author);
    history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
  }, [query, category, tag, author]);

  function track(event: string, detail: Record<string, unknown>) {
    const push = (window as any).__mrxPush;
    if (typeof push === 'function') push({ event, ...detail });
  }

  function toggle(value: string, current: string, set: (value: string) => void, filterType: string) {
    const next = current === value ? '' : value;
    set(next);
    track('article_filter', { filter_type: filterType, filter_value: next || 'all' });
  }

  return <div className="learning-browser">
    <label className="learning-search"><span>What do you want to understand?</span><div><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “Is this offer fair?” or “I inherited mineral rights”" /><button type="button" onClick={() => track('article_search', { search_term: query, result_count: results.length })}>Search</button></div></label>
    <div className="learning-filters" aria-label="Filter learning center articles">
      <div><strong>Categories</strong><span><button className={!category ? 'active' : ''} onClick={() => setCategory('')}>All</button>{categories.map(([slug, label]) => <button className={category === slug ? 'active' : ''} key={slug} onClick={() => toggle(slug, category, setCategory, 'category')}>{label}</button>)}</span></div>
      <div><strong>Tags</strong><span><button className={!tag ? 'active' : ''} onClick={() => setTag('')}>All</button>{tags.map((item) => <button className={tag === item ? 'active' : ''} key={item} onClick={() => toggle(item, tag, setTag, 'tag')}>{item}</button>)}</span></div>
      <div><strong>Authors</strong><span><button className={!author ? 'active' : ''} onClick={() => setAuthor('')}>All</button>{authors.map((item) => <button className={author === item ? 'active' : ''} key={item} onClick={() => toggle(item, author, setAuthor, 'author')}>{item}</button>)}</span></div>
    </div>
    <div className="learning-results-head"><p><strong>{results.length}</strong> {results.length === 1 ? 'guide' : 'guides'}</p>{(query || category || tag || author) && <button type="button" onClick={() => { setQuery(''); setCategory(''); setTag(''); setAuthor(''); }}>Clear filters</button>}</div>
    {results.length ? <div className="learning-results">{results.map((post) => <article key={post.slug}><div><span>{post.categoryLabel}</span><span>{post.readingMinutes} min read</span></div><h2><a href={`/blog/${post.slug}/`} onClick={() => track('article_click', { article_slug: post.slug, source: 'learning_center' })}>{post.title}</a></h2><p>{post.excerpt}</p><footer><span>By <a href="/authors/mrx-editorial-team/">{post.author}</a></span><time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time><a href={`/blog/${post.slug}/`}>Read guide →</a></footer></article>)}</div> : <div className="learning-empty"><h2>No close article match yet</h2><p>Tommy can answer the question directly and point to any useful sources.</p><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('mrx:open-chat', { detail: { prompt: query } }))}>Ask Tommy this question</button></div>}
  </div>;
}
