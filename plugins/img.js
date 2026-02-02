const axios = require('axios');
const cheerio = require('cheerio'); // You need to install: npm install cheerio

module.exports = async function imgCommand(sock, chatId, message, args) {
    const query = args.join(" ").trim();

    if (!query) {
        await sock.sendMessage(chatId, {
            text: "🖼️ *Image Search*\n\nPlease provide a search query.\n\n*Example:* .img cute cats"
        }, { quoted: message });
        return;
    }

    try {
        const processingMsg = await sock.sendMessage(chatId, {
            text: `🔍 *Searching for:* "${query}"\n\n⏳ Please wait...`
        }, { quoted: message });

        // ====== METHOD 1: Google Images via Public API ======
        try {
            // Use a reliable public Google Images API
            const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&key=AIzaSyC2qGlnBOeCI6dvtPUXK8J8_noxPD7OHIQ&cx=30f53e47d4d134dfa`;
            
            const response = await axios.get(apiUrl, { timeout: 15000 });
            
            if (response.data?.items?.length > 0) {
                const images = response.data.items.slice(0, 5);
                
                await sock.sendMessage(chatId, { delete: processingMsg.key });
                
                // Send success message
                await sock.sendMessage(chatId, {
                    text: `✅ *Found images for:* "${query}"\n\nSending ${images.length} results...`
                }, { quoted: message });
                
                // Send images
                for (let i = 0; i < images.length; i++) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await sock.sendMessage(chatId, {
                            image: { url: images[i].link },
                            caption: `📸 *Image ${i+1}/${images.length}*\n🔍 *Query:* ${query}\n📝 *Title:* ${images[i].title || 'No title'}\n✨ *MAD-MAX Image Search*`
                        });
                    } catch (imgError) {
                        console.log(`Failed to send image ${i+1}:`, imgError.message);
                    }
                }
                return;
            }
        } catch (apiError) {
            console.log("Method 1 failed, trying Method 2...");
        }

        // ====== METHOD 2: Alternative Google Images API ======
        try {
            const altApiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&ijn=0&api_key=1e3ecfbcd39fc8ce4b26f60ed8ae7622ed2c9b73b45a9a9dcdcfe84a0d6f9853`;
            
            const response = await axios.get(altApiUrl, { timeout: 15000 });
            
            if (response.data?.images_results?.length > 0) {
                const images = response.data.images_results.slice(0, 5);
                
                await sock.sendMessage(chatId, { delete: processingMsg.key });
                
                // Send success message
                await sock.sendMessage(chatId, {
                    text: `✅ *Found images for:* "${query}"\n\nSending ${images.length} results...`
                }, { quoted: message });
                
                // Send images
                for (let i = 0; i < images.length; i++) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await sock.sendMessage(chatId, {
                            image: { url: images[i].original },
                            caption: `📸 *Image ${i+1}/${images.length}*\n🔍 *Query:* ${query}\n✨ *MAD-MAX Image Search*`
                        });
                    } catch (imgError) {
                        console.log(`Failed to send image ${i+1}:`, imgError.message);
                    }
                }
                return;
            }
        } catch (altError) {
            console.log("Method 2 failed, trying Method 3...");
        }

        // ====== METHOD 3: DuckDuckGo Images (Reliable & Fast) ======
        try {
            const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
            const htmlResponse = await axios.get(ddgUrl, { timeout: 10000 });
            
            // Parse HTML to extract image URLs
            const $ = cheerio.load(htmlResponse.data);
            const imageUrls = [];
            
            // DuckDuckGo stores images in a JSON object
            const scripts = $('script').toString();
            const imageRegex = /"image":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp))/gi;
            let match;
            
            while ((match = imageRegex.exec(scripts)) !== null && imageUrls.length < 10) {
                const url = match[1].replace(/\\\//g, '/');
                if (!imageUrls.includes(url)) {
                    imageUrls.push(url);
                }
            }
            
            if (imageUrls.length > 0) {
                await sock.sendMessage(chatId, { delete: processingMsg.key });
                
                // Send success message
                await sock.sendMessage(chatId, {
                    text: `✅ *Found images for:* "${query}"\n\nSending ${Math.min(5, imageUrls.length)} results...`
                }, { quoted: message });
                
                // Send images
                for (let i = 0; i < Math.min(5, imageUrls.length); i++) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await sock.sendMessage(chatId, {
                            image: { url: imageUrls[i] },
                            caption: `📸 *Image ${i+1}/${Math.min(5, imageUrls.length)}*\n🔍 *Query:* ${query}\n✨ *Source:* DuckDuckGo\n🎨 *MAD-MAX Image Search*`
                        });
                    } catch (imgError) {
                        console.log(`Failed to send image ${i+1}:`, imgError.message);
                    }
                }
                return;
            }
        } catch (ddgError) {
            console.log("Method 3 failed, trying Method 4...");
        }

        // ====== METHOD 4: Bing Images (Very reliable) ======
        try {
            const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
            const bingResponse = await axios.get(bingUrl, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(bingResponse.data);
            const imageUrls = [];
            
            // Bing stores images in mimg tags
            $('img.mimg').each((i, elem) => {
                if (i < 10) {
                    const src = $(elem).attr('src');
                    if (src && src.startsWith('http')) {
                        imageUrls.push(src);
                    }
                }
            });
            
            if (imageUrls.length > 0) {
                await sock.sendMessage(chatId, { delete: processingMsg.key });
                
                // Send success message
                await sock.sendMessage(chatId, {
                    text: `✅ *Found images for:* "${query}"\n\nSending ${Math.min(5, imageUrls.length)} results...`
                }, { quoted: message });
                
                // Send images
                for (let i = 0; i < Math.min(5, imageUrls.length); i++) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await sock.sendMessage(chatId, {
                            image: { url: imageUrls[i] },
                            caption: `📸 *Image ${i+1}/${Math.min(5, imageUrls.length)}*\n🔍 *Query:* ${query}\n✨ *Source:* Bing\n🎨 *MAD-MAX Image Search*`
                        });
                    } catch (imgError) {
                        console.log(`Failed to send image ${i+1}:`, imgError.message);
                    }
                }
                return;
            }
        } catch (bingError) {
            console.log("Method 4 failed");
        }

        // ====== NO IMAGES FOUND ======
        await sock.sendMessage(chatId, { delete: processingMsg.key });
        
        await sock.sendMessage(chatId, {
            text: `❌ *No images found for:* "${query}"\n\nTry different keywords or try again later.`
        }, { quoted: message });

    } catch (error) {
        console.error('Image command error:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Search failed*\nError: ${error.message}\n\nTry again with different keywords.`
        }, { quoted: message });
    }
};