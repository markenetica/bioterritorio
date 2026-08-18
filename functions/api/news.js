const FEEDS = [
  { url: 'https://www.minambiente.gov.co/feed/', source: 'MinAmbiente Colombia' },
  { url: 'https://news.un.org/feed/subscribe/es/news/topic/climate-change/feed/rss.xml', source: 'ONU · Ambiente' }
];

function extractItems(xml, sourceName, limit) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of blocks.slice(0, limit)) {
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
        source: sourceName
      });
    }
  }
  return items;
}

export async function onRequestGet() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; BioterritorioNewsBot/1.0)' };
  let allItems = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers, cf: { cacheTtl: 1800, cacheEverything: true } });
      if (res.ok) {
        const xml = await res.text();
        allItems = allItems.concat(extractItems(xml, feed.source, 6));
      }
    } catch (e) {
      // Feed no disponible: se omite sin romper la respuesta
    }
  }

  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  return new Response(JSON.stringify({ items: allItems.slice(0, 16), updated: new Date().toISOString() }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=1800',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
