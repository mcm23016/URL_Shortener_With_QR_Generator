// index.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase setup
const appSettings = {
    databaseURL: "https://urlshorter-6f26b-default-rtdb.firebaseio.com/"
};
const app = initializeApp(appSettings);
const database = getDatabase(app);
const urlListInDB = ref(database, "urlList");

// DOM elements
const textInput = document.getElementById("text_input");
const shortenButton = document.getElementById("shorten_button");
const qrCode = document.getElementById("qr_code");
const shortenedUrl = document.getElementById("shortened_url");

// Store URL data locally
let urlDictionary = {};

// Load existing URLs from Firebase
onValue(urlListInDB, (snapshot) => {
    if (snapshot.exists()) {
        urlDictionary = snapshot.val();
        console.log("Loaded URLs:", urlDictionary);
    } else {
        urlDictionary = {};
        console.log("No URLs found.");
    }
});

// Generate random 6-character short code
function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Check if URL was already shortened
function findExistingRecord(longUrl) {
    for (let key in urlDictionary) {
        if (urlDictionary[key].original === longUrl) {
            return { key, ...urlDictionary[key] };
        }
    }
    return null;
}

// Shorten button click
shortenButton.addEventListener("click", async function() {
    const inputValue = textInput.value.trim();
    if (!inputValue) return alert("Please enter a valid URL!");

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)[\w.-]+\.[a-z]{2,}.*$/i;
    if (!urlPattern.test(inputValue)) {
        alert("Please enter a valid URL (must start with http:// or https://)");
        return;
    }

    let shortUrl;
    const existing = findExistingRecord(inputValue);

    if (existing) {
        shortUrl = existing.shortened;
        const redirectClicks = existing.uses || 0;
        alert(`This URL has already been shortened.\n It has been used ${redirectClicks} times.`);
    } else {
        const shortCode = generateShortCode();
        shortUrl = `https://urlshorter-6f26b.web.app/redirect.html?code=${shortCode}`;

        push(urlListInDB, {
            original: inputValue,
            shortened: shortUrl,
            code: shortCode,
            uses: 0 // starts at 0
        });
    }

    textInput.value = "";

    // Display the short link
    shortenedUrl.textContent = shortUrl;
    shortenedUrl.style.cursor = "pointer";
    shortenedUrl.onclick = () => window.open(shortUrl, "_blank");

    // Generate QR code
    try {
        const qrDataURL = await QRCode.toDataURL(shortUrl);
        qrCode.src = qrDataURL;
    } catch (err) {
        console.error("QR generation error:", err);
    }
});
