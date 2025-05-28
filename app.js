async function fetchNews() {
  const newsContent = document.getElementById('news-content');
  const feedUrl = 'http://marktechpost.com/feed/';
  const corsProxy = 'https://api.allorigins.win/raw?url=';

  try {
    let response;
    try {
      response = await fetch(feedUrl);
    } catch (error) {
      // If direct fetch fails, try with CORS proxy
      if (error instanceof TypeError) { // CORS errors are often TypeErrors
        console.warn('Direct fetch failed, trying with CORS proxy.');
        response = await fetch(corsProxy + feedUrl);
      } else {
        throw error; // Re-throw other errors
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textData = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(textData, "text/xml");

    // Check for parsing errors
    const parsingError = xmlDoc.querySelector("parsererror");
    if (parsingError) {
        console.error("Error parsing XML:", parsingError);
        // Attempt to fetch with CORS proxy if direct fetch was used and parsing failed
        if (!response.url.startsWith(corsProxy.split('?')[0])) { // Check if proxy was already used
             console.warn('Direct fetch parsing failed, trying with CORS proxy.');
             response = await fetch(corsProxy + feedUrl);
             if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} (with proxy)`);
             }
             const proxiedTextData = await response.text();
             const proxiedXmlDoc = parser.parseFromString(proxiedTextData, "text/xml");
             const proxiedParsingError = proxiedXmlDoc.querySelector("parsererror");
             if (proxiedParsingError) {
                console.error("Error parsing XML with proxy:", proxiedParsingError);
                throw new Error('Failed to parse RSS feed even with proxy.');
             }
             // If proxy worked, use its doc
             xmlDoc = proxiedXmlDoc;
        } else {
            throw new Error('Failed to parse RSS feed.');
        }
    }


    const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 5); // Get first 5 items

    if (items.length === 0) {
      newsContent.innerHTML = '<p>No news items found.</p>';
      return;
    }

    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || 'No title';
      const link = item.querySelector('link')?.textContent || '#';
      const pubDate = item.querySelector('pubDate')?.textContent ? new Date(item.querySelector('pubDate').textContent).toLocaleDateString() : 'No date';
      const description = item.querySelector('description')?.textContent || 'No description';

      const article = document.createElement('article');
      article.classList.add('news-item');

      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.textContent = title;
      h3.appendChild(a);

      const pDate = document.createElement('p');
      pDate.classList.add('publication-date');
      pDate.textContent = pubDate;

      const pDesc = document.createElement('p');
      pDesc.classList.add('description');
      // Basic HTML removal from description
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      pDesc.textContent = tempDiv.textContent || tempDiv.innerText || "";


      article.appendChild(h3);
      article.appendChild(pDate);
      article.appendChild(pDesc);

      newsContent.appendChild(article);
    });

  } catch (error) {
    console.error('Error fetching or parsing news:', error);
    newsContent.innerHTML = `<p>Sorry, we couldn't fetch the news. Error: ${error.message}</p>`;
  }
}

window.onload = fetchNews;
