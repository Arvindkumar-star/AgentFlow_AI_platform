const BaseIntegration = require('./baseIntegration');

class YouTubeIntegration extends BaseIntegration {
  constructor() {
    super('youtube');
  }

  async execute(action, params, credentials) {
    const apiKey = credentials?.accessToken || credentials?.apiKey;
    if (!apiKey) {
      throw Object.assign(
        new Error('YouTube not connected. Paste your API Key in Integrations.'),
        { code: 'INTEGRATION_NOT_CONNECTED' }
      );
    }

    const resolvedAction = action || params.action || 'search';

    if (resolvedAction === 'search') {
      const query   = params.query || params.keyword || params.search || 'trending';
      const maxResults = params.maxResults || 1;

      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'video');
      url.searchParams.set('maxResults', String(maxResults));
      url.searchParams.set('order', params.order || 'relevance');
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.error) {
        throw new Error(`YouTube API error: ${data.error.message}`);
      }

      const items = (data.items || []).map(item => ({
        videoId:     item.id.videoId,
        title:       item.snippet.title,
        channel:     item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnail:   item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt,
      }));

      // Top result for easy downstream access
      const top = items[0] || null;
      return {
        results: items,
        count: items.length,
        // Flat top-level fields so next nodes can reference them directly
        videoId:     top?.videoId,
        title:       top?.title,
        channel:     top?.channel,
        description: top?.description,
        thumbnail:   top?.thumbnail,
        url:         top?.url,
        videoUrl:    top?.url,
        link:        top?.url,
      };
    }

    if (resolvedAction === 'getVideo' || resolvedAction === 'details') {
      const videoId = params.videoId;
      if (!videoId) throw new Error('YouTube getVideo: missing "videoId" param');

      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'snippet,statistics');
      url.searchParams.set('id', videoId);
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.error) throw new Error(`YouTube API error: ${data.error.message}`);

      const v = data.items?.[0];
      if (!v) throw new Error(`YouTube: video ${videoId} not found`);
      return {
        videoId: v.id,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        views: v.statistics?.viewCount,
        likes: v.statistics?.likeCount,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
      };
    }

    throw new Error(`YouTube action "${resolvedAction}" not supported. Use "search" or "getVideo".`);
  }
}

module.exports = new YouTubeIntegration();
