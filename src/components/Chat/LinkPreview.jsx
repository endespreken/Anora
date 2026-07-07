import React, { useState, useEffect } from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function LinkPreview({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMetadata = async () => {
      if (!url) return;
      
      try {
        // Simple cache check
        const cacheKey = `link_preview_${url}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const parsed = JSON.parse(cached);
          // Check expiration (cache for 24 hours)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setData(parsed.data);
            setLoading(false);
            return;
          }
        }

        setLoading(true);
        setError(false);
        
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        const json = await response.json();
        
        if (json.status === 'success' && json.data && isMounted) {
          const previewData = {
            title: json.data.title,
            description: json.data.description,
            image: json.data.image?.url,
            publisher: json.data.publisher,
            url: json.data.url || url
          };
          
          setData(previewData);
          
          // Save to cache
          localStorage.setItem(cacheKey, JSON.stringify({
            data: previewData,
            timestamp: Date.now()
          }));
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch link preview", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 p-3 bg-secondary/30 border border-border rounded-xl flex items-center space-x-3 animate-pulse">
        <div className="w-12 h-12 bg-secondary/50 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-secondary/50 rounded w-3/4"></div>
          <div className="h-2 bg-secondary/50 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !data || (!data.title && !data.image)) {
    return null; // Don't show anything if failed or no useful data
  }

  return (
    <a 
      href={data.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="mt-2 block overflow-hidden rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors group relative max-w-sm"
    >
      {data.image && (
        <div className="w-full h-32 md:h-40 overflow-hidden bg-secondary">
          <img 
            src={data.image} 
            alt={data.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-3">
        <h4 className="font-bold text-sm text-text line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {data.title || data.url}
        </h4>
        {data.description && (
          <p className="text-[11px] text-textMuted line-clamp-2 mb-2">
            {data.description}
          </p>
        )}
        <div className="flex items-center space-x-1 text-[10px] text-textMuted font-medium uppercase tracking-wider mt-1">
          <LinkIcon size={10} />
          <span className="truncate">{data.publisher || new URL(data.url).hostname.replace('www.', '')}</span>
        </div>
      </div>
      <div className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
        <ExternalLink size={12} />
      </div>
    </a>
  );
}
