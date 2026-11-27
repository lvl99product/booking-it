export interface BookMetadata {
  coverUrl?: string;
  totalPages?: number;
}

/**
 * Fetches a book cover URL and page count, trying Open Library first and falling back to Google Books.
 */
async function fetchFromOpenLibrary(title: string, author: string): Promise<BookMetadata> {
  const params = new URLSearchParams({
    title: title.trim(),
    fields: 'cover_i,isbn,number_of_pages_median',
    limit: '5',
  });
  if (author.trim()) {
    params.set('author', author.trim());
  }

  const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  if (!response.ok) return {};

  const data = await response.json();
  const docs: Array<{ cover_i?: number; isbn?: string[]; number_of_pages_median?: number }> = data.docs || [];

  let coverUrl: string | undefined;
  const withCoverId = docs.find(d => d.cover_i);
  if (withCoverId?.cover_i) {
    coverUrl = `https://covers.openlibrary.org/b/id/${withCoverId.cover_i}-L.jpg?default=false`;
  } else {
    const withIsbn = docs.find(d => d.isbn && d.isbn.length > 0);
    if (withIsbn?.isbn?.[0]) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${withIsbn.isbn[0]}-L.jpg?default=false`;
    }
  }

  const withPages = docs.find(d => typeof d.number_of_pages_median === 'number' && d.number_of_pages_median > 0);
  const totalPages = withPages?.number_of_pages_median;

  return { coverUrl, totalPages };
}

async function fetchFromGoogleBooks(title: string, author: string): Promise<BookMetadata> {
  const parts = [`intitle:${title.trim()}`];
  if (author.trim()) {
    parts.push(`inauthor:${author.trim()}`);
  }
  const params = new URLSearchParams({
    q: parts.join('+'),
    maxResults: '5',
  });

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
  if (!response.ok) return {};

  const data = await response.json();
  const items: Array<{
    volumeInfo?: {
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      pageCount?: number;
    };
  }> = data.items || [];

  let coverUrl: string | undefined;
  let totalPages: number | undefined;

  for (const item of items) {
    if (!coverUrl) {
      const rawUrl = item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail;
      if (rawUrl) {
        coverUrl = rawUrl.replace(/^http:\/\//i, 'https://').replace('&edge=curl', '');
      }
    }
    if (!totalPages && typeof item.volumeInfo?.pageCount === 'number' && item.volumeInfo.pageCount > 0) {
      totalPages = item.volumeInfo.pageCount;
    }
    if (coverUrl && totalPages) break;
  }

  return { coverUrl, totalPages };
}

export async function fetchBookMetadata(title: string, author: string): Promise<BookMetadata> {
  let result: BookMetadata = {};

  try {
    result = await fetchFromOpenLibrary(title, author);
    if (result.coverUrl && result.totalPages) return result;
  } catch (error) {
    console.warn('[coverService] Open Library lookup failed, trying fallback:', error);
  }

  try {
    const fallback = await fetchFromGoogleBooks(title, author);
    return {
      coverUrl: result.coverUrl || fallback.coverUrl,
      totalPages: result.totalPages || fallback.totalPages,
    };
  } catch (error) {
    console.error('[coverService] Google Books fallback failed:', error);
  }

  return result;
}

export async function fetchBookCover(title: string, author: string): Promise<string | undefined> {
  const meta = await fetchBookMetadata(title, author);
  return meta.coverUrl;
}
