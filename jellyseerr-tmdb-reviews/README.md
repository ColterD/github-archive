# Jellyseerr TMDb Reviews Enhanced

> **Archived** - This project is deprecated and unmaintained. Issues and pull requests are no longer accepted.

## 📚 Overview

**Jellyseerr TMDb Reviews Enhanced** is a userscript that integrates the latest reviews from [The Movie Database (TMDb)](https://www.themoviedb.org/) directly into your [Jellyseerr](https://github.com/Fallenbagel/jellyseerr) movie and TV show pages. Enhance your content discovery with up-to-date reviews seamlessly embedded in your Jellyseerr interface.

## 🎯 Features

- **Latest TMDb Reviews:** Automatically fetches and displays recent reviews for movies and TV shows on Jellyseerr pages.
- **Customizable Settings:** Configure the number of reviews, language, and caching preferences directly within the script.
- **Cache Management:** Efficient caching mechanism to store fetched reviews for 24 hours, reducing API calls and improving performance.
- **Clear Cache Button:** Convenient "Clear TMDb Cache" button located below the reviews section for easy cache management.
- **Responsive Design:** Adapts to both Jellyseerr's light and dark themes for a consistent look and feel.
- **Auto-Updating:** Automatically checks for and applies updates via userscript managers like Tampermonkey and Violentmonkey.
- **Error Handling:** User-friendly messages and logging for seamless troubleshooting.

## 🚀 Installation

### 🛠 Prerequisites

Ensure you have a userscript manager extension installed in your browser. The following are recommended:

- **[Violentmonkey](https://violentmonkey.github.io/)** (**Recommended!** Open-Source)
- **[Tampermonkey](https://www.tampermonkey.net/)** (Closed Source - Chrome, Firefox, Edge, Safari, etc.)
- **[Greasemonkey](https://www.greasespot.net/)** (**Outdated**)


### 🔗 One-Click Installation

1. **Click the Installation Link:**

   [Install Jellyseerr TMDb Reviews Enhanced](https://raw.githubusercontent.com/ColterD/Jellyseerr-TMDb-Reviews-Enhanced/main/jellyseerr-tmdb-reviews-enhanced.user.js)

2. **Confirm Installation:**
   
   - Your userscript manager (e.g., Violentmonkey, Tampermonkey) will detect the script and prompt you with installation details.
   - Click **"Install"** or **"Save"** to add the script to your manager.

3. **Go to the Jellyseerr Website and Pick a Movie:**
   
   - After installation, go to the Jellyseerr website.
   - Pick a movie you want to read reviews for.
   - A dialog box will pop up asking you for your TMDB API Key.
   - Either ask me (if I'm giving you this script) or provide your own TMDB API Key.
   - Click ok.


## ⚙️ Configuration

1. **Obtain a TMDb API Key:**
   
   - Sign up on [TMDb](https://www.themoviedb.org/).
   - Navigate to your account settings and generate an API key.

2. **Edit the Userscript:**
   
   - Open your userscript manager dashboard.
   - Edit **"Jellyseerr TMDb Reviews Enhanced"**.
   - Replace `'YOUR_TMDB_API_KEY'` with your TMDb API Key.
   - Modify other settings as needed:
     - **Enable Caching:**
       ```javascript
       const enableCaching = true; // Set to true to enable caching
       ```
     - **Log Level:**
       ```javascript
       const logLevel = 'off'; // Options: 'off', 'info', 'verbose'
       ```
     - **Language Code:**
       ```javascript
       const languageCode = 'en-US'; // Replace with your preferred language code
       ```
     - **Maximum Reviews to Display:**
       ```javascript
       const maxReviews = 3; // Set the number of reviews to display
       ```
   - Save the script after making changes.

---

### 🌐 Custom Installation for Other Sites

If you wish to use **Jellyseerr TMDb Reviews Enhanced** on your own website or a different URL pattern, follow these steps:

1. **Open the Userscript Manager:**
   
   - Go to your userscript manager dashboard (Violentmonkey, Tampermonkey, Greasemonkey).

2. **Edit the Script:**
   
   - Find **"Jellyseerr TMDb Reviews Enhanced"** in your scripts list.
   - Click **"Edit"**.

3. **Modify the `@match` Pattern:**
   
   - Locate the `@match` directive in the metadata block:
     ```javascript
     // @match        https://request.colter.plus/*
     ```
   - Replace `https://request.colter.plus/*` with the URL pattern of your website.
     - **Example for `https://yourwebsite.com/*`:**
       ```javascript
       // @match        https://yourwebsite.com/*
       ```
   - **Note:** Ensure that the match pattern correctly corresponds to the pages where you want the script to run.

4. **Save the Script:**
   
   - After making changes, save the script to apply the new match pattern.

## 📣 Recommendations

- **Use Violentmonkey:**  
  Among userscript managers, [Violentmonkey](https://violentmonkey.github.io/) is **Recommended!** for its open-source nature and robust feature set.

## 🛠️ Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📞 Contact

For any questions or feedback, feel free to reach out via [GitHub Issues](https://github.com/ColterD/Jellyseerr-TMDb-Reviews-Enhanced/issues).

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---
