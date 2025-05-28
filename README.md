# AI Startup News Website

This project is a simple, dynamically updating website that displays the latest news in AI and startups. It's built with HTML, CSS, and vanilla JavaScript.

## Features

*   **Multi-Source Dynamic News Feed:** Fetches and displays the latest news articles from a variety of RSS/Atom feeds, including MarkTechPost, TechCrunch (AI and General), and Hacker News (AI Search and Frontpage).
*   **News Aggregation & Sorting:** News items from all configured sources are aggregated, sorted by publication date (most recent first), and then displayed.
*   **Professional Design:** Styled with a clean, modern, dark-themed interface suitable for a tech news site.
*   **Responsive (Basic):** The layout is designed to be usable across different screen sizes.

## Structure

*   `index.html`: The main HTML file containing the structure of the website.
*   `style.css`: Contains all the CSS rules for styling the website.
*   `app.js`: Handles the fetching, parsing, aggregation, sorting, and display of news articles.

## How it Works

The website uses client-side JavaScript (`app.js`) to:
1.  Manage an array of predefined news source objects, each containing a name and a feed URL.
2.  Concurrently fetch all news feeds using `Promise.all` for efficiency.
3.  A CORS proxy (`api.allorigins.win`) is used to bypass browser cross-origin restrictions when fetching feeds if a direct fetch fails.
4.  The fetched data is parsed using `DOMParser`. The script supports both RSS (e.g., `<item>`, `<pubDate>`) and Atom (e.g., `<entry>`, `<published>`) feed formats.
5.  Relevant information (title, link, publication date, description, source name) is extracted from the news items.
6.  All fetched items are aggregated into a single list, sorted by publication date (most recent first).
7.  A limited number of the latest items are then dynamically inserted into the main content area of the page.

## Configured News Sources

The following news sources are currently configured in `app.js`:

*   **MarkTechPost:** General AI and tech news.
*   **TechCrunch AI:** Focused on Artificial Intelligence news from TechCrunch.
*   **TechCrunch (General):** General technology news from TechCrunch.
*   **Hacker News (AI Search):** Articles matching "AI" from Hacker News (via `hnrss.org`).
*   **Hacker News (Frontpage):** Top stories from Hacker News's frontpage (official RSS feed).

The script is designed to pull from these specific feeds. The variety helps ensure a good mix of content.

## Running

Simply open the `index.html` file in a web browser. An internet connection is required to fetch the latest news.

## Customization

### Changing or Adding News Sources

To change or add news sources, you can modify the `newsSources` array at the beginning of the `app.js` file:

```javascript
// app.js
const newsSources = [
  { name: "MarkTechPost", url: "http://marktechpost.com/feed/" },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  // Add or modify sources here, for example:
  // { name: "Your Custom Source", url: "YOUR_RSS_OR_ATOM_FEED_URL_HERE" },
];
// ... rest of the script
```
Replace or add objects with `name` (for display) and `url` (the feed's web address). Ensure the URL points to a valid RSS or Atom feed.
