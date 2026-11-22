/**
 * Fetches a book cover URL, trying Open Library first and falling back to Google Books.
 */
async function fetchFromOpenLibrary(title: string, author: string): Promise<string | undefined> {
  const params = new URLSearchParams({
    title: title.trim(),
    fields: 'cover_i,isbn',
    limit: '5',
  });
  if (author.trim()) {
    params.set('author', author.trim());
  }

  const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  if (!response.ok) return undefined;

  const data = await response.json();
  const docs: Array<{ cover_i?: number; isbn?: string[] }> = data.docs || [];

  // Prefer an explicit cover_i match first
  const withCoverId = docs.find(d => d.cover_i);
  if (withCoverId?.cover_i) {
    return `https://covers.openlibrary.org/b/id/${withCoverId.cover_i}-L.jpg?default=false`;
  }

  // Fallback to ISBN cover if available
  const withIsbn = docs.find(d => d.isbn && d.isbn.length > 0);
  if (withIsbn?.isbn?.[0]) {
    return `https://covers.openlibrary.org/b/isbn/${withIsbn.isbn[0]}-L.jpg?default=false`;
  }

  return undefined;
}

async function fetchFromGoogleBooks(title: string, author: string): Promise<string | undefined> {
  const parts = [`intitle:${title.trim()}`];
  if (author.trim()) {
    parts.push(`inauthor:${author.trim()}`);
  }
  const params = new URLSearchParams({
    q: parts.join('+'),
    maxResults: '5',
  });

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
  if (!response.ok) return undefined;

  const data = await response.json();
  const items: Array<{ volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }> =
    data.items || [];

  for (const item of items) {
    const rawUrl = item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail;
    if (rawUrl) {
      return rawUrl.replace(/^http:\/\//i, 'https://').replace('&edge=curl', '');
    }
  }

  return undefined;
}

export async function fetchBookCover(title: string, author: string): Promise<string | undefined> {
  try {
    const openLibraryUrl = await fetchFromOpenLibrary(title, author);
    if (openLibraryUrl) return openLibraryUrl;
  } catch (error) {
    console.warn('[coverService] Open Library lookup failed, trying fallback:', error);
  }

  try {
    const googleUrl = await fetchFromGoogleBooks(title, author);
    if (googleUrl) return googleUrl;
  } catch (error) {
    console.error('[coverService] Google Books fallback failed:', error);
  }

  return undefined;
}
