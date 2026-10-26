/**
 * News API utilities for fetching articles
 * 
 * Note: This calls the backend API which securely handles the NewsAPI key.
 * The API key should be stored in the backend's .env file, not the frontend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
  publishedAt: string;
  author?: string;
  urlToImage?: string;
}

/**
 * Fetch news articles from backend API (which proxies to NewsAPI)
 * Requires backend to be running with NEWS_API_KEY configured
 */
export const fetchNewsArticles = async (query?: string, category?: string): Promise<NewsArticle[]> => {
  // Build query parameters
  const params = new URLSearchParams();
  if (query) {
    params.append('query', query);
  }
  if (category) {
    params.append('category', category);
  }
  
  const url = `${API_BASE_URL}/api/news${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `News API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Backend already transforms the data, so we can use it directly
  return data.articles || [];
};

/**
 * Fetch full article content (if needed for detailed view)
 */
export const fetchArticleContent = async (url: string): Promise<string> => {
  // In a real implementation, you might want to fetch and parse the full article
  // For now, we'll just return the URL
  return url;
};

