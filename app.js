const newsSources = [
  { name: "MarkTechPost", url: "http://marktechpost.com/feed/" },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "TechCrunch (General)", url: "https://techcrunch.com/feed/" },
  { name: "Hacker News AI", url: "https://hnrss.org/search?q=AI" },
  { name: "Hacker News (Frontpage)", url: "https://news.ycombinator.com/rss" }
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const MAX_DISPLAY_ITEMS = 15;

async function fetchAndParseFeed(source) {
  const { name, url } = source;
  let currentFetchUrl = url;
  let response;
  let usedProxy = false;

  console.log(`fetchAndParseFeed: Started for source: ${name} (${url})`);

  try {
    // 1. Try direct fetch
    console.log(`fetchAndParseFeed: [${name}] Attempting to fetch directly from: ${url}`);
    try {
      response = await fetch(url);
      console.log(`fetchAndParseFeed: [${name}] Direct fetch response status: ${response.status}, ok: ${response.ok}`);
      if (!response.ok && response.status !== 0) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
       // Check for non-XML content type (e.g. TechCrunch sometimes returns HTML on direct errors)
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("xml") && !contentType.includes("rss")) {
        console.warn(`fetchAndParseFeed: [${name}] Direct fetch returned non-XML content-type: ${contentType}. This might be an error page.`);
        throw new Error(`Direct fetch returned non-XML content-type: ${contentType}`);
      }
    } catch (error) {
      console.warn(`fetchAndParseFeed: [${name}] Direct fetch failed. Error: ${error.message}. Attempting with CORS proxy.`);
      usedProxy = true;
      currentFetchUrl = CORS_PROXY + encodeURIComponent(url); // Ensure URL is encoded for proxy
      console.log(`fetchAndParseFeed: [${name}] Attempting to fetch with proxy: ${currentFetchUrl}`);
      try {
        response = await fetch(currentFetchUrl);
        console.log(`fetchAndParseFeed: [${name}] Proxy fetch response status: ${response.status}, ok: ${response.ok}`);
        if (!response.ok) {
          throw new Error(`HTTP error with proxy! status: ${response.status}`);
        }
      } catch (proxyError) {
        console.error(`fetchAndParseFeed: [${name}] Proxy fetch also failed. Error: ${proxyError.message}`);
        throw new Error(`Failed to fetch from ${name} (direct and proxy). Proxy error: ${proxyError.message}`);
      }
    }

    console.log(`fetchAndParseFeed: [${name}] Fetch successful. Reading text data...`);
    const textData = await response.text();
    // console.log(`fetchAndParseFeed: [${name}] Fetched text data snippet (first 300 chars): ${textData.substring(0, 300)}`);

    console.log(`fetchAndParseFeed: [${name}] Parsing XML data...`);
    const parser = new DOMParser();
    let xmlDoc;
    try {
      xmlDoc = parser.parseFromString(textData, "text/xml");
    } catch (parseError) {
      console.error(`fetchAndParseFeed: [${name}] DOMParser.parseFromString failed. Error: ${parseError.message}`);
      throw new Error(`Error parsing news feed from ${name} (parser.parseFromString).`);
    }

    const parsingError = xmlDoc.querySelector("parsererror");
    if (parsingError) {
      console.error(`fetchAndParseFeed: [${name}] Error parsing XML (parsererror tag found):`, parsingError.textContent);
      if (!usedProxy && !response.url.startsWith(CORS_PROXY.split('?')[0])) {
        console.warn(`fetchAndParseFeed: [${name}] Parsing error with direct fetch data. Trying fetch with CORS proxy for potentially cleaner data.`);
        usedProxy = true;
        currentFetchUrl = CORS_PROXY + encodeURIComponent(url);
        console.log(`fetchAndParseFeed: [${name}] Re-fetching with proxy for parsing: ${currentFetchUrl}`);
        try {
          response = await fetch(currentFetchUrl);
          console.log(`fetchAndParseFeed: [${name}] Proxy re-fetch response status: ${response.status}, ok: ${response.ok}`);
          if (!response.ok) {
            throw new Error(`HTTP error with proxy re-fetch! status: ${response.status}`);
          }
          const proxiedTextData = await response.text();
          xmlDoc = parser.parseFromString(proxiedTextData, "text/xml");
          const proxiedParsingError = xmlDoc.querySelector("parsererror");
          if (proxiedParsingError) {
            console.error(`fetchAndParseFeed: [${name}] Error parsing XML with proxy data as well (parsererror tag found):`, proxiedParsingError.textContent);
            throw new Error(`Failed to parse RSS feed from ${name} even with proxy (parsererror tag found).`);
          }
          console.log(`fetchAndParseFeed: [${name}] Successfully parsed XML data with proxy re-fetch.`);
        } catch (proxyRefetchError) {
          console.error(`fetchAndParseFeed: [${name}] Proxy re-fetch or parsing failed. Error: ${proxyRefetchError.message}`);
          throw new Error(`Failed during proxy re-fetch for parsing from ${name}. Error: ${proxyRefetchError.message}`);
        }
      } else {
        throw new Error(`Failed to parse RSS feed from ${name} (parsererror tag found).`);
      }
    } else {
      console.log(`fetchAndParseFeed: [${name}] Successfully parsed XML data.`);
    }

    const items = Array.from(xmlDoc.querySelectorAll('item, entry')); // 'entry' for Atom feeds
    console.log(`fetchAndParseFeed: [${name}] Found ${items.length} news items in the feed.`);

    if (items.length === 0) {
      console.log(`fetchAndParseFeed: [${name}] No items found.`);
      return []; // Return empty array if no items
    }

    return items.map(item => {
      const title = item.querySelector('title')?.textContent || 'No title';
      const link = item.querySelector('link')?.getAttribute('href') || item.querySelector('link')?.textContent || '#'; // Atom feeds use <link href="...">
      
      let pubDateStr = item.querySelector('pubDate, published')?.textContent; // 'published' for Atom
      let pubDate = new Date(); // Default to now if no date
      if (pubDateStr) {
          try {
            pubDate = new Date(pubDateStr);
            if (isNaN(pubDate.getTime())) { // Check if date is valid
                console.warn(`fetchAndParseFeed: [${name}] Invalid date format for item "${title}": ${pubDateStr}. Using current date.`);
                pubDate = new Date(); // Fallback to current date
            }
          } catch (e) {
            console.warn(`fetchAndParseFeed: [${name}] Error parsing date for item "${title}": ${pubDateStr}. Error: ${e}. Using current date.`);
            pubDate = new Date(); // Fallback
          }
      } else {
          console.warn(`fetchAndParseFeed: [${name}] No publication date for item "${title}". Using current date.`);
      }

      let description = item.querySelector('description, summary, content')?.textContent || 'No description available.'; // 'summary' or 'content' for Atom
      // Basic HTML removal from description
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      description = (tempDiv.textContent || tempDiv.innerText || "").trim();
      if (description.length > 200) { // Truncate long descriptions
        description = description.substring(0, 200) + "...";
      }
      
      return {
        title,
        link,
        pubDate, // This is now a Date object
        description,
        sourceName: name,
      };
    });

  } catch (error) {
    console.error(`fetchAndParseFeed: [${name}] Main error caught:`, error);
    // Optionally add a small note to UI here if needed, or handle globally
    return []; // Return empty array on error to not break Promise.all
  } finally {
    console.log(`fetchAndParseFeed: [${name}] Completed.`);
  }
}

async function displayAggregatedNews() {
  const newsContent = document.getElementById('news-content');
  newsContent.innerHTML = '<p>Loading all news feeds...</p>';
  console.log('displayAggregatedNews: Started');

  let allNewsItems = [];
  const fetchPromises = newsSources.map(source => fetchAndParseFeed(source));

  try {
    const results = await Promise.all(fetchPromises);
    results.forEach(items => {
      if (items && items.length > 0) {
        allNewsItems.push(...items);
      }
    });

    console.log(`displayAggregatedNews: Total items fetched from all sources: ${allNewsItems.length}`);

    if (allNewsItems.length === 0) {
      newsContent.innerHTML = '<p>Could not load news from any source. Please check your internet connection or try again later.</p>';
      console.log('displayAggregatedNews: No items found from any source.');
      return;
    }

    // Sort by publication date, most recent first
    allNewsItems.sort((a, b) => b.pubDate - a.pubDate);

    // Limit the number of displayed items
    const itemsToDisplay = allNewsItems.slice(0, MAX_DISPLAY_ITEMS);

    newsContent.innerHTML = ''; // Clear "Loading..." message
    console.log(`displayAggregatedNews: Displaying ${itemsToDisplay.length} news items...`);

    itemsToDisplay.forEach((item, index) => {
      const article = document.createElement('article');
      article.classList.add('news-item');

      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = item.link;
      a.target = '_blank';
      a.textContent = item.title;
      h3.appendChild(a);

      const pDate = document.createElement('p');
      pDate.classList.add('publication-date');
      pDate.textContent = item.pubDate.toLocaleDateString();

      const pSource = document.createElement('p');
      pSource.classList.add('news-source');
      pSource.textContent = `Source: ${item.sourceName}`;
      
      const pDesc = document.createElement('p');
      pDesc.classList.add('description');
      pDesc.textContent = item.description;

      article.appendChild(h3);
      article.appendChild(pDate);
      article.appendChild(pSource);
      article.appendChild(pDesc);

      newsContent.appendChild(article);
      // console.log(`displayAggregatedNews: Displayed item ${index + 1}: ${item.title} from ${item.sourceName}`);
    });
    console.log('displayAggregatedNews: Finished displaying news items.');

  } catch (error) {
    // This catch block is for errors in Promise.all or subsequent processing,
    // individual feed errors are handled within fetchAndParseFeed.
    console.error('displayAggregatedNews: Error in processing news feeds:', error);
    newsContent.innerHTML = `<p>Sorry, there was an error processing the news feeds. Please try again later.</p>`;
  } finally {
    console.log('displayAggregatedNews: Completed.');
  }
}

window.onload = displayAggregatedNews;
