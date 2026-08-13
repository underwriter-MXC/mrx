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
  authorSlug: string;
  publishedAt: string;
  readingMinutes: number;
  heroImage: string;
  heroAlt: string;
  featured: boolean;
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
  const categories = useMemo(
    () =>
      [...new Map(posts.map((post) => [post.category, post.categoryLabel])).entries()].sort(
        (a, b) => a[1].localeCompare(b[1]),
      ),
    [posts],
  );
  const tags = useMemo(() => [...new Set(posts.flatMap((post) => post.tags))].sort(), [posts]);
  const authors = useMemo(() => [...new Set(posts.map((post) => post.author))].sort(), [posts]);
  const results = useMemo(
    () =>
      posts.filter((post) => {
        const needle = query.trim().toLowerCase();
        const matchesQuery =
          !needle ||
          `${post.title} ${post.description} ${post.excerpt} ${post.categoryLabel} ${post.tags.join(' ')} ${post.author}`
            .toLowerCase()
            .includes(needle);
        return (
          matchesQuery &&
          (!category || post.category === category) &&
          (!tag || post.tags.includes(tag)) &&
          (!author || post.author === author)
        );
      }),
    [posts, query, category, tag, author],
  );

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

  function toggleFilter(
    value: string,
    current: string,
    set: (value: string) => void,
    filterType: string,
  ) {
    const next = current === value ? '' : value;
    set(next);
    track('article_filter', { filter_type: filterType, filter_value: next || 'all' });
  }

  return (
    <div className="learning-browser">
      <div className="learning-tools">
        <form
          className="learning-search"
          onSubmit={(event) => {
            event.preventDefault();
            track('article_search', { search_term: query, result_count: results.length });
          }}
        >
          <label htmlFor="learning-search-input">Search the Learning Center</label>
          <div>
            <input
              id="learning-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask a question or search a topic"
            />
            <button type="submit">Search</button>
          </div>
        </form>
      </div>
      <div className="learning-filters" aria-label="Filter Learning Center articles">
        <div className="learning-filter-group" role="group" aria-labelledby="topic-filter-label">
          <strong id="topic-filter-label">Topic</strong>
          <div>
            <button
              type="button"
              className={!category ? 'active' : ''}
              aria-pressed={!category}
              onClick={() => toggleFilter('', category, setCategory, 'category')}
            >
              All
            </button>
            {categories.map(([slug, label]) => (
              <button
                type="button"
                className={category === slug ? 'active' : ''}
                aria-pressed={category === slug}
                key={slug}
                onClick={() => toggleFilter(slug, category, setCategory, 'category')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="learning-filter-group" role="group" aria-labelledby="tag-filter-label">
          <strong id="tag-filter-label">Tag</strong>
          <div>
            <button
              type="button"
              className={!tag ? 'active' : ''}
              aria-pressed={!tag}
              onClick={() => toggleFilter('', tag, setTag, 'tag')}
            >
              All
            </button>
            {tags.map((item) => (
              <button
                type="button"
                className={tag === item ? 'active' : ''}
                aria-pressed={tag === item}
                key={item}
                onClick={() => toggleFilter(item, tag, setTag, 'tag')}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="learning-filter-group" role="group" aria-labelledby="author-filter-label">
          <strong id="author-filter-label">Author</strong>
          <div>
            <button
              type="button"
              className={!author ? 'active' : ''}
              aria-pressed={!author}
              onClick={() => toggleFilter('', author, setAuthor, 'author')}
            >
              All
            </button>
            {authors.map((item) => (
              <button
                type="button"
                className={author === item ? 'active' : ''}
                aria-pressed={author === item}
                key={item}
                onClick={() => toggleFilter(item, author, setAuthor, 'author')}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="learning-results-head">
        <p role="status" aria-live="polite">
          <strong>{results.length}</strong> {results.length === 1 ? 'article' : 'articles'}
        </p>
        {(query || category || tag || author) && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('');
              setTag('');
              setAuthor('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {results.length ? (
        <div className="learning-results">
          {results.map((post, index) => (
            <article className="learning-card" key={post.slug}>
              <a
                className="learning-card__image"
                href={`/blog/${post.slug}/`}
                aria-label={`Read ${post.title}`}
                onClick={() =>
                  track('article_click', {
                    article_slug: post.slug,
                    source: 'learning_center_image',
                  })
                }
              >
                <img
                  src={post.heroImage}
                  alt={post.heroAlt}
                  width="1200"
                  height="630"
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </a>
              <div className="learning-card__body">
                <div className="learning-card__meta">
                  <span>{post.categoryLabel}</span>
                  <span>{post.readingMinutes} min read</span>
                </div>
                <h2>
                  <a
                    href={`/blog/${post.slug}/`}
                    onClick={() =>
                      track('article_click', { article_slug: post.slug, source: 'learning_center' })
                    }
                  >
                    {post.title}
                  </a>
                </h2>
                <p>{post.excerpt}</p>
                <footer>
                  <span>
                    By <a href={`/authors/${post.authorSlug}/`}>{post.author}</a>
                  </span>
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  <a href={`/blog/${post.slug}/`}>Read article →</a>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="learning-empty">
          <h2>No close article match yet</h2>
          <p>Tommy can answer the question directly and point to any useful sources.</p>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('mrx:open-chat', { detail: { prompt: query } }))
            }
          >
            Ask Tommy this question
          </button>
        </div>
      )}
    </div>
  );
}
