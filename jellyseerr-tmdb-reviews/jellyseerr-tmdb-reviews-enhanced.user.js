// ==UserScript==
// @name         Jellyseerr TMDb Reviews Enhanced
// @namespace    https://github.com/ColterD/jellyseerr-tmdb-reviews
// @version      1.0.6a
// @description  Add the latest TMDb reviews to Jellyseerr movie and TV show pages with enhancements
// @match        https://request.colter.plus/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.themoviedb.org
// @updateURL    https://raw.githubusercontent.com/ColterD/Jellyseerr-TMDb-Reviews-Enhanced/main/jellyseerr-tmdb-reviews-enhanced.user.js?version=1.0.6a
// @downloadURL  https://raw.githubusercontent.com/ColterD/Jellyseerr-TMDb-Reviews-Enhanced/main/jellyseerr-tmdb-reviews-enhanced.user.js?version=1.0.6a
// ==/UserScript==

(async function() {
    'use strict';

    // ====== User Configuration ======
    let tmdbApiKey = GM_getValue('tmdbApiKey', '');
    if (!tmdbApiKey) {
        tmdbApiKey = prompt('Enter your TMDb API Key:');
        if (tmdbApiKey) {
            GM_setValue('tmdbApiKey', tmdbApiKey);
            logInfo('TMDb API Key stored successfully.');
        } else {
            alert('TMDb API Key is required for the script to function.');
            return;
        }
    }
    const enableCaching = true; // Set to true to enable caching (boolean, not string)
    const logLevel = 'verbose'; // Set to 'off', 'info', or 'verbose'
    const languageCode = 'en-US'; // Replace with your preferred language code
    const maxReviews = 3; // Set the number of reviews to display

    // Verify that enableCaching is a boolean
    if (typeof enableCaching !== 'boolean') {
        console.error('[ERROR] enableCaching should be a boolean value (true or false).');
    }

    // Styling variables
    const styles = {
        reviewContainer: {
            marginTop: '10px'
        },
        reviewItem: {
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            backgroundColor: 'var(--review-bg-color)',
            color: 'var(--review-text-color)'
        },
        reviewHeader: {
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '10px'
        },
        contentDiv: {
            color: 'var(--review-text-color)',
            lineHeight: '1.5'
        },
        ratingBox: {
            backgroundColor: 'var(--rating-bg-color)',
            color: 'var(--rating-text-color)',
            padding: '2px 6px',
            borderRadius: '3px',
            marginRight: '10px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.9em',
            fontWeight: 'bold'
        },
        clearCacheButton: {
            backgroundColor: 'var(--button-bg-color)',
            color: 'var(--button-text-color)',
            border: '1px solid var(--button-border-color)',
            borderRadius: '4px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '0.9em',
            marginTop: '20px',
            transition: 'background-color 0.3s, border-color 0.3s',
            display: 'inline-flex',
            alignItems: 'center'
        },
        clearCacheButtonHover: {
            backgroundColor: 'var(--button-hover-bg-color)',
            borderColor: 'var(--button-hover-border-color)'
        },
        link: {
            textDecoration: 'underline',
            color: 'inherit' // Make link color inherit from parent
        }
    };

    // Accessibility and theme variables
    const themeColors = {
        light: {
            '--review-bg-color': '#f9f9f9',
            '--review-text-color': '#000',
            '--rating-bg-color': '#0073e6',
            '--rating-text-color': '#fff',
            '--button-bg-color': '#e0e0e0',
            '--button-text-color': '#000',
            '--button-border-color': '#bdbdbd',
            '--button-hover-bg-color': '#d5d5d5',
            '--button-hover-border-color': '#a4a4a4'
        },
        dark: {
            '--review-bg-color': 'rgba(255, 255, 255, 0.05)',
            '--review-text-color': '#fff',
            '--rating-bg-color': '#0073e6',
            '--rating-text-color': '#fff',
            '--button-bg-color': '#424242',
            '--button-text-color': '#fff',
            '--button-border-color': '#616161',
            '--button-hover-bg-color': '#616161',
            '--button-hover-border-color': '#757575'
        }
    };

    // ====== Logging Functions ======
    function logInfo(...args) {
        if (logLevel === 'info' || logLevel === 'verbose') {
            console.log('[INFO]', ...args);
        }
    }

    function logVerbose(...args) {
        if (logLevel === 'verbose') {
            console.log('[VERBOSE]', ...args);
        }
    }

    function logError(...args) {
        console.error('[ERROR]', ...args);
    }

    // ====== Helper Functions ======

    // Escape HTML content
    function escapeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Sanitize HTML content
    function sanitizeHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'i', 'b', 'span', 'div', 'a'];

        function traverse(element) {
            const children = Array.from(element.childNodes);
            for (const el of children) {
                if (el.nodeType === Node.ELEMENT_NODE) {
                    if (!allowedTags.includes(el.tagName.toLowerCase())) {
                        // Replace the element with its child nodes
                        const parent = el.parentNode;
                        while (el.firstChild) {
                            parent.insertBefore(el.firstChild, el);
                        }
                        parent.removeChild(el);
                    } else {
                        // Remove all attributes except href and target for <a> tags
                        const attrs = el.attributes;
                        for (let j = attrs.length - 1; j >= 0; j--) {
                            const attrName = attrs[j].name;
                            if (el.tagName.toLowerCase() === 'a' && (attrName === 'href' || attrName === 'target')) {
                                continue;
                            }
                            el.removeAttribute(attrName);
                        }
                        // Recursively traverse child elements
                        traverse(el);
                    }
                }
            }
        }

        traverse(tempDiv);

        return tempDiv.innerHTML;
    }

    // Get cached data
    function getCachedData(key) {
        if (!enableCaching) {
            logVerbose('Caching is disabled. Skipping cache retrieval.');
            return null;
        }

        try {
            const cached = localStorage.getItem(key);
            if (cached) {
                const data = JSON.parse(cached);
                const now = new Date().getTime();
                if (now - data.timestamp < 24 * 60 * 60 * 1000) { // 24 hours cache
                    if (data.value && Array.isArray(data.value.reviews) && typeof data.value.mediaId === 'number') {
                        logVerbose(`Cache hit for key: ${key}`, data.value);
                        return data.value;
                    } else {
                        logError(`Cache data for key: ${key} is malformed.`, data.value);
                        localStorage.removeItem(key);
                    }
                } else {
                    logVerbose(`Cache expired for key: ${key}`);
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {
            logError('Error accessing localStorage:', e);
        }
        return null;
    }

    // Set cached data
    function setCachedData(key, value) {
        if (!enableCaching) return;

        try {
            const data = {
                value: value,
                timestamp: new Date().getTime()
            };
            localStorage.setItem(key, JSON.stringify(data));
            logVerbose(`Data cached under key: ${key}`);
        } catch (e) {
            logError('Error saving to localStorage:', e);
        }
    }

    // Fetch JSON data using GM_xmlhttpRequest
    function fetchJSON(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve(data);
                    } catch (e) {
                        reject('Error parsing response JSON: ' + e);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // Apply styles to an element
    function applyStyles(element, styles) {
        for (const [key, value] of Object.entries(styles)) {
            element.style[key] = value;
        }
    }

    // Detect user's preferred color scheme
    function getColorScheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Set theme variables
    function setThemeVariables() {
        const theme = getColorScheme();
        const root = document.documentElement;
        const colors = themeColors[theme];
        for (const [varName, colorValue] of Object.entries(colors)) {
            root.style.setProperty(varName, colorValue);
        }
        logVerbose(`Theme set to ${theme}`);
    }

    // ====== Main Functions ======

    let lastUrl = location.href;
    let mediaTitle = '';
    let mediaYear = '';
    let mediaType = '';

    function init() {
        setThemeVariables();
        waitForTitleElement().then((titleElement) => {
            processPage(titleElement);
        });
    }

    function checkUrlChange() {
        let timeout = null;
        const observer = new MutationObserver(function(mutations, me) {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                logVerbose("URL changed to:", lastUrl);
                if (isMediaPage()) {
                    logInfo("User navigated to a new media page");
                    const newTitleElement = document.querySelector('h1[data-testid="media-title"]');
                    if (newTitleElement) {
                        if (timeout) clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            processPage(newTitleElement);
                        }, 1000); // 1-second debounce
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        logVerbose("MutationObserver for URL changes has been set up.");
    }

    function isMediaPage() {
        return window.location.pathname.includes('/movie/') || window.location.pathname.includes('/tv/');
    }

    async function waitForTitleElement() {
        return new Promise((resolve) => {
            const observer = new MutationObserver(function(mutations, me) {
                const titleElement = document.querySelector('h1[data-testid="media-title"]');
                if (titleElement) {
                    me.disconnect(); // Stop observing
                    logVerbose("Title element found.");
                    resolve(titleElement);
                }
            });
            observer.observe(document, { childList: true, subtree: true });
            logVerbose("MutationObserver for title element has been set up.");
        });
    }

    async function processPage(titleElement) {
        if (!titleElement) {
            logError('Title element not found.');
            return;
        }

        const fullTitle = titleElement.innerText.trim();
        logVerbose("Full title found:", fullTitle);

        // Extract title and year
        [mediaTitle, mediaYear] = extractTitleAndYear(fullTitle);
        logInfo("Media title:", mediaTitle);
        logInfo("Media year:", mediaYear);

        // Determine if it's a movie or TV show
        mediaType = window.location.pathname.includes('/movie/') ? 'movie' : 'tv';

        // Generate a unique key for caching
        const cacheKey = `tmdb_reviews_${mediaType}_${encodeURIComponent(mediaTitle)}_${mediaYear}_${languageCode}`;

        if (enableCaching) {
            // Check if data is cached
            let cachedData = getCachedData(cacheKey);
            if (cachedData) {
                logInfo("Using cached data for", mediaTitle);
                insertReviews(cachedData.reviews, cachedData.mediaId, mediaType);
                return;
            }
        } else {
            logInfo("Caching is disabled. Fetching fresh data for", mediaTitle);
        }

        // Fetch media ID from TMDb
        try {
            const mediaId = await fetchMediaId(mediaTitle, mediaYear, mediaType);
            if (mediaId) {
                // Fetch reviews for the media
                const reviews = await fetchReviews(mediaId, mediaType);
                if (reviews && reviews.length > 0) {
                    if (enableCaching) {
                        // Cache the data
                        setCachedData(cacheKey, { reviews: reviews, mediaId: mediaId });
                    }

                    // Insert the reviews into the page
                    insertReviews(reviews, mediaId, mediaType);
                } else {
                    displayMessage('No reviews found for this media on TMDb.');
                }
            } else {
                displayMessage('Media not found on TMDb.');
            }
        } catch (error) {
            logError(error);
            displayMessage('An error occurred while fetching reviews.');
        }
    }

    function extractTitleAndYear(fullTitle) {
        const titleMatch = fullTitle.match(/^(.+?)\s*\((\d{4})\)$/);
        let title, year;
        if (titleMatch) {
            title = titleMatch[1];
            year = titleMatch[2];
        } else {
            title = fullTitle;
            year = '';
        }
        return [title, year];
    }

    async function fetchMediaId(title, year, type) {
        logVerbose(`Fetching ${type} data from TMDb`);
        const url = `https://api.themoviedb.org/3/search/${type}?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}&language=${languageCode}`;
        const data = await fetchJSON(url);
        if (data && data.results && data.results.length > 0) {
            const mediaId = data.results[0].id;
            logInfo(`TMDb ${type} ID:`, mediaId);
            return mediaId;
        } else {
            logInfo(`${type.charAt(0).toUpperCase() + type.slice(1)} not found on TMDb.`);
            return null;
        }
    }

    async function fetchReviews(mediaId, mediaType) {
        logVerbose('Fetching reviews from TMDb');
        const url = `https://api.themoviedb.org/3/${mediaType}/${mediaId}/reviews?api_key=${tmdbApiKey}&language=${languageCode}`;
        const data = await fetchJSON(url);
        if (data && data.results && data.results.length > 0) {
            // Sort reviews by created_at in descending order
            data.results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Get the top reviews
            const topReviews = data.results.slice(0, maxReviews);
            return topReviews;
        } else {
            return [];
        }
    }

    function insertReviews(reviews, mediaId, mediaType) {
        // Debugging: Check if 'styles' is defined
        if (typeof styles === 'undefined') {
            logError('Styles object is undefined in insertReviews.');
            return;
        } else {
            logVerbose('Styles object is defined in insertReviews.');
        }

        // Debugging: Check if 'reviews' and 'mediaId' are valid
        if (!Array.isArray(reviews) || !mediaId) {
            logError('Invalid data passed to insertReviews:', { reviews, mediaId });
            return;
        } else {
            logVerbose('Valid data passed to insertReviews.');
        }

        // Remove any existing reviews to prevent duplicates
        const existingReviewContainer = document.getElementById('tmdb-reviews-container');
        if (existingReviewContainer) {
            existingReviewContainer.remove();
            logVerbose('Existing review container removed.');
        }

        // Find the target container
        const overviewLeft = document.querySelector('.media-overview-left');
        if (!overviewLeft) {
            logError('Could not find the overview container to insert reviews.');
            return;
        }

        // Delay the insertion to prevent conflicts with React
        setTimeout(() => {
            logVerbose('Proceeding to insert reviews after delay.');

            // Create a separator line before the reviews section
            const separator = document.createElement('hr');
            separator.style.marginTop = '20px';
            separator.style.marginBottom = '20px';
            overviewLeft.appendChild(separator);
            logVerbose('Separator line added.');

            // Create the reviews container
            const reviewContainer = document.createElement('div');
            applyStyles(reviewContainer, styles.reviewContainer);
            reviewContainer.id = 'tmdb-reviews-container';

            // Create the heading with a link to TMDb reviews page
            const reviewsHeading = document.createElement('h2');
            const mediaUrlType = mediaType === 'movie' ? 'movie' : 'tv';
            reviewsHeading.innerHTML = `Latest Reviews from <a href="https://www.themoviedb.org/${mediaUrlType}/${mediaId}/reviews" target="_blank" aria-label="TMDb reviews page">TMDb</a>`;
            reviewsHeading.style.marginBottom = '10px';
            reviewsHeading.style.color = 'var(--review-text-color)';
            const link = reviewsHeading.querySelector('a');
            if (link) {
                applyStyles(link, styles.link);
                logVerbose('Link styles applied.');
            } else {
                logError('Link element not found in reviewsHeading.');
            }
            reviewContainer.appendChild(reviewsHeading);
            logVerbose('Reviews heading added.');

            // Add each review to the container
            reviews.forEach(review => {
                const reviewItem = createReviewItem(review);
                if (reviewItem) {
                    reviewContainer.appendChild(reviewItem);
                    logVerbose('Review item added.');
                } else {
                    logError('Failed to create review item for:', review);
                }
            });

            // ====== Add Clear TMDb Cache Button Below Reviews ======
            const clearCacheButton = document.createElement('button');
            clearCacheButton.id = 'clear-tmdb-cache-button'; // Assign an ID for future reference
            clearCacheButton.textContent = 'Clear TMDb Cache';
            clearCacheButton.title = 'Clear the cached reviews for this media';

            // Apply the same classes as existing Jellyseerr buttons for consistent styling
            applyStyles(clearCacheButton, styles.clearCacheButton);
            // Add hover effect
            clearCacheButton.addEventListener('mouseover', () => {
                applyStyles(clearCacheButton, styles.clearCacheButtonHover);
            });
            clearCacheButton.addEventListener('mouseout', () => {
                applyStyles(clearCacheButton, styles.clearCacheButton);
            });

            // Add click event to clear cache
            clearCacheButton.onclick = () => {
                if (confirm('Are you sure you want to clear the cached reviews?')) {
                    localStorage.removeItem(`tmdb_reviews_${mediaType}_${mediaTitle}_${mediaYear}_${languageCode}`);
                    logInfo('TMDb cache cleared.');

                    // Refresh reviews
                    const currentTitleElement = document.querySelector('h1[data-testid="media-title"]');
                    if (currentTitleElement) {
                        processPage(currentTitleElement);
                    }
                }
            };

            // Optionally, add an icon to the button (uncomment if needed)
            // const icon = document.createElement('i');
            // icon.classList.add('fa', 'fa-trash'); // Example using FontAwesome
            // clearCacheButton.prepend(icon);

            // Append the button to the reviews container
            reviewContainer.appendChild(clearCacheButton);
            logInfo('Clear TMDb Cache button added below the reviews.');

            // Insert the container after the separator
            overviewLeft.appendChild(reviewContainer);
            logInfo('Inserted reviews into the page.');
        }, 500); // 500ms delay
    }

    function createReviewItem(review) {
        // Debugging: Check if 'styles' is defined
        if (typeof styles === 'undefined') {
            logError('Styles object is undefined in createReviewItem.');
            return null;
        } else {
            logVerbose('Styles object is defined in createReviewItem.');
        }

        const author = escapeHTML(review.author);
        const authorDetails = review.author_details;
        const rating = authorDetails.rating;
        const authorUsername = authorDetails.username;
        const authorProfileUrl = 'https://www.themoviedb.org/u/' + encodeURIComponent(authorUsername);
        const createdAt = new Date(review.created_at);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = createdAt.toLocaleDateString(undefined, options);

        const reviewItem = document.createElement('div');
        applyStyles(reviewItem, styles.reviewItem);
        logVerbose('Review item container created.');

        // Create the header with rating and author info
        const reviewHeader = document.createElement('div');
        applyStyles(reviewHeader, styles.reviewHeader);
        logVerbose('Review header created and styles applied.');

        // Include the star rating if available
        if (rating) {
            const ratingBox = document.createElement('div');
            applyStyles(ratingBox, styles.ratingBox);

            const starIcon = document.createElement('span');
            starIcon.textContent = '★';
            starIcon.style.marginRight = '3px';
            starIcon.style.fontWeight = 'bold';

            const ratingValue = document.createElement('span');
            ratingValue.textContent = (rating * 10) + '%';

            ratingBox.appendChild(starIcon);
            ratingBox.appendChild(ratingValue);
            ratingBox.setAttribute('aria-label', `Rating: ${rating * 10}%`);
            reviewHeader.appendChild(ratingBox);
            logVerbose('Rating box added to review header.');
        }

        // Author name as a link with date
        const authorInfo = document.createElement('p');
        authorInfo.style.margin = '0';

        const strong = document.createElement('strong');
        strong.textContent = 'Written by ';
        authorInfo.appendChild(strong);

        const authorLink = document.createElement('a');
        authorLink.href = authorProfileUrl;
        authorLink.target = '_blank';
        authorLink.textContent = author;
        authorLink.setAttribute('aria-label', `Author profile: ${author}`);
        applyStyles(authorLink, styles.link);
        authorInfo.appendChild(authorLink);

        // Append " on " + formattedDate
        const dateText = document.createTextNode(' on ' + formattedDate);
        authorInfo.appendChild(dateText);

        reviewHeader.appendChild(authorInfo);
        reviewItem.appendChild(reviewHeader);
        logVerbose('Author info added to review header.');

        // Review content, sanitized and truncated if necessary
        const content = sanitizeHTML(review.content);
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = content;
        applyStyles(contentDiv, styles.contentDiv);
        logVerbose('Content div created and styles applied.');

        // Check if content is empty after sanitization
        if (!contentDiv.innerHTML.trim()) {
            logVerbose('Review content is empty after sanitization for review by', author);
            const noContentDiv = document.createElement('div');
            noContentDiv.textContent = 'No review content available.';
            reviewItem.appendChild(noContentDiv);
            return reviewItem;
        }

        // Truncate content to a maximum length
        const maxLength = 600;
        let truncated = false;
        let contentText = contentDiv.textContent || contentDiv.innerText || '';
        if (contentText.length > maxLength) {
            contentText = contentText.substring(0, maxLength);
            truncated = true;
        }

        const truncatedContentDiv = document.createElement('div');
        truncatedContentDiv.textContent = contentText;
        logVerbose('Content truncated if necessary.');

        if (truncated) {
            truncatedContentDiv.textContent += '... ';

            const readMoreLink = document.createElement('a');
            readMoreLink.href = 'https://www.themoviedb.org/review/' + review.id;
            readMoreLink.target = '_blank';
            readMoreLink.textContent = 'keep reading';
            readMoreLink.setAttribute('aria-label', 'Keep reading the full review');
            applyStyles(readMoreLink, styles.link);
            truncatedContentDiv.appendChild(readMoreLink);
            logVerbose('Read more link added to truncated content.');
        }

        reviewItem.appendChild(truncatedContentDiv);
        logVerbose('Review content added to review item.');

        return reviewItem;
    }

    function displayMessage(message) {
        // Debugging: Check if 'styles' is defined
        if (typeof styles === 'undefined') {
            logError('Styles object is undefined in displayMessage.');
            return;
        } else {
            logVerbose('Styles object is defined in displayMessage.');
        }

        const existingReviewContainer = document.getElementById('tmdb-reviews-container');
        if (existingReviewContainer) {
            existingReviewContainer.remove();
            logVerbose('Existing review container removed for message display.');
        }

        const overviewLeft = document.querySelector('.media-overview-left');
        if (!overviewLeft) {
            logError('Could not find the overview container to display message.');
            return;
        }

        const messageDiv = document.createElement('div');
        applyStyles(messageDiv, styles.reviewContainer); // Reusing reviewContainer styles
        messageDiv.id = 'tmdb-reviews-container';
        messageDiv.style.marginTop = '20px';
        messageDiv.style.color = 'var(--review-text-color)';
        messageDiv.textContent = message;

        // Add error reporting link
        const reportLink = document.createElement('a');
        reportLink.href = 'https://github.com/yourusername/jellyseerr-tmdb-reviews/issues';
        reportLink.target = '_blank';
        reportLink.textContent = 'Report an issue';
        reportLink.style.marginLeft = '10px';
        reportLink.setAttribute('aria-label', 'Report an issue on GitHub');
        applyStyles(reportLink, styles.link);
        logVerbose('Report link added to message.');

        messageDiv.appendChild(reportLink);

        overviewLeft.appendChild(messageDiv);
        logVerbose('Message displayed with report link.');
    }

    // ====== Function to Add Styled Clear Cache Button Below Reviews ======
    function addClearCacheButtonBelowReviews(reviewContainer) {
        // Check if the Clear TMDb Cache button already exists to prevent duplicates
        if (reviewContainer.querySelector('#clear-tmdb-cache-button')) {
            logVerbose('Clear TMDb Cache button already exists. Skipping addition.');
            return;
        }

        // Create the button element
        const clearCacheButton = document.createElement('button');
        clearCacheButton.id = 'clear-tmdb-cache-button'; // Assign an ID for future reference
        clearCacheButton.textContent = 'Clear TMDb Cache';
        clearCacheButton.title = 'Clear the cached reviews for this media';

        // Apply the same styles as existing Jellyseerr buttons for consistent styling
        applyStyles(clearCacheButton, styles.clearCacheButton);

        // Add hover effect
        clearCacheButton.addEventListener('mouseover', () => {
            applyStyles(clearCacheButton, styles.clearCacheButtonHover);
        });
        clearCacheButton.addEventListener('mouseout', () => {
            applyStyles(clearCacheButton, styles.clearCacheButton);
        });

        // Add click event to clear cache
        clearCacheButton.onclick = () => {
            if (confirm('Are you sure you want to clear the cached reviews?')) {
                localStorage.removeItem(`tmdb_reviews_${mediaType}_${mediaTitle}_${mediaYear}_${languageCode}`);
                logInfo('TMDb cache cleared.');

                // Refresh reviews
                const currentTitleElement = document.querySelector('h1[data-testid="media-title"]');
                if (currentTitleElement) {
                    processPage(currentTitleElement);
                }
            }
        };

        // Optionally, add an icon to the button (uncomment if needed)
        // const icon = document.createElement('i');
        // icon.classList.add('fa', 'fa-trash'); // Example using FontAwesome
        // clearCacheButton.prepend(icon);

        // Append the button to the review container
        reviewContainer.appendChild(clearCacheButton);
        logInfo('Clear TMDb Cache button added below the reviews.');
    }

    // ====== Script Initialization ======

    if (isMediaPage()) {
        logInfo("User script running on a media page");
        init();
    } else {
        logInfo("Not on a media page");
        checkUrlChange();
    }

    // ====== Modify the insertReviews Function to Include the Clear Cache Button Below Reviews ======
    function insertReviews(reviews, mediaId, mediaType) {
        // Debugging: Check if 'styles' is defined
        if (typeof styles === 'undefined') {
            logError('Styles object is undefined in insertReviews.');
            return;
        } else {
            logVerbose('Styles object is defined in insertReviews.');
        }

        // Debugging: Check if 'reviews' and 'mediaId' are valid
        if (!Array.isArray(reviews) || !mediaId) {
            logError('Invalid data passed to insertReviews:', { reviews, mediaId });
            return;
        } else {
            logVerbose('Valid data passed to insertReviews.');
        }

        // Remove any existing reviews to prevent duplicates
        const existingReviewContainer = document.getElementById('tmdb-reviews-container');
        if (existingReviewContainer) {
            existingReviewContainer.remove();
            logVerbose('Existing review container removed.');
        }

        // Find the target container
        const overviewLeft = document.querySelector('.media-overview-left');
        if (!overviewLeft) {
            logError('Could not find the overview container to insert reviews.');
            return;
        }

        // Delay the insertion to prevent conflicts with React
        setTimeout(() => {
            logVerbose('Proceeding to insert reviews after delay.');

            // Create a separator line before the reviews section
            const separator = document.createElement('hr');
            separator.style.marginTop = '20px';
            separator.style.marginBottom = '20px';
            overviewLeft.appendChild(separator);
            logVerbose('Separator line added.');

            // Create the reviews container
            const reviewContainer = document.createElement('div');
            applyStyles(reviewContainer, styles.reviewContainer);
            reviewContainer.id = 'tmdb-reviews-container';

            // Create the heading with a link to TMDb reviews page
            const reviewsHeading = document.createElement('h2');
            const mediaUrlType = mediaType === 'movie' ? 'movie' : 'tv';
            reviewsHeading.innerHTML = `Latest Reviews from <a href="https://www.themoviedb.org/${mediaUrlType}/${mediaId}/reviews" target="_blank" aria-label="TMDb reviews page">TMDb</a>`;
            reviewsHeading.style.marginBottom = '10px';
            reviewsHeading.style.color = 'var(--review-text-color)';
            const link = reviewsHeading.querySelector('a');
            if (link) {
                applyStyles(link, styles.link);
                logVerbose('Link styles applied.');
            } else {
                logError('Link element not found in reviewsHeading.');
            }
            reviewContainer.appendChild(reviewsHeading);
            logVerbose('Reviews heading added.');

            // Add each review to the container
            reviews.forEach(review => {
                const reviewItem = createReviewItem(review);
                if (reviewItem) {
                    reviewContainer.appendChild(reviewItem);
                    logVerbose('Review item added.');
                } else {
                    logError('Failed to create review item for:', review);
                }
            });

            // ====== Add Clear TMDb Cache Button Below Reviews ======
            addClearCacheButtonBelowReviews(reviewContainer);

            // Insert the container after the separator
            overviewLeft.appendChild(reviewContainer);
            logInfo('Inserted reviews into the page.');
        }, 500); // 500ms delay
    }

})();
