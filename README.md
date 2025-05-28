# AI Startup News Website

This project is a simple, dynamically updating website that displays the latest news in AI and startups. It's built with HTML, CSS, and vanilla JavaScript.

## Features

*   **Dynamic News Feed:** Fetches and displays the latest news articles from RSS feeds. Currently configured to pull from MarkTechPost.
*   **Professional Design:** Styled with a clean, modern, dark-themed interface suitable for a tech news site.
*   **Responsive (Basic):** The layout is designed to be usable across different screen sizes.

## Structure

*   `index.html`: The main HTML file containing the structure of the website.
*   `style.css`: Contains all the CSS rules for styling the website.
*   `app.js`: Handles the fetching, parsing, and display of news articles from RSS feeds.

## How it Works

The website uses client-side JavaScript to:
1.  Fetch an RSS feed from a news source (MarkTechPost by default).
2.  A CORS proxy (`api.allorigins.win`) is used to bypass browser cross-origin restrictions when fetching the feed if a direct fetch fails.
3.  The fetched XML data is parsed using `DOMParser`.
4.  Relevant information (title, link, publication date, description) is extracted from the news items.
5.  These items are then dynamically inserted into the main content area of the page.

## Running

Simply open the `index.html` file in a web browser. An internet connection is required to fetch the latest news.

## Customization

### Changing the RSS Feed

To change the news source, you can modify the `feedUrl` variable at the beginning of the `app.js` file:

```javascript
// app.js
async function fetchNews() {
  const newsContent = document.getElementById('news-content');
  const feedUrl = 'YOUR_NEW_RSS_FEED_URL_HERE'; // <--- Change this line
  const corsProxy = 'https://api.allorigins.win/raw?url=';
  // ... rest of the function
}
```
Replace `'YOUR_NEW_RSS_FEED_URL_HERE'` with the URL of the desired RSS feed.
