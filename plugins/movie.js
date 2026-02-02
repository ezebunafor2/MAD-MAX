const axios = require('axios');
const https = require('https');
const config = require('../settings');

// Create custom HTTPS agent for the problematic API only
const insecureAgent = new https.Agent({  
  rejectUnauthorized: false // Only for this specific API
});

// Normal secure axios instance for other requests
const secureAxios = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent() // Default secure agent
});

// Insecure axios instance only for the movie API
const movieAxios = axios.create({
  timeout: 30000,
  httpsAgent: insecureAgent,
  maxContentLength: 200 * 1024 * 1024
});

async function movieCommand(sock, chatId, message, args) {
    try {
        const text = args.join(' ').trim();
        
        if (!text) {
            await sock.sendMessage(chatId, {
                text: `🎬 *Usage:* ${config.PREFIX || '.'}movie <movie title>\n\nExample: ${config.PREFIX || '.'}movie spiderman 2`,
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // Send processing reaction
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        // 1. Get movie metadata (using insecure agent only for this API)
        const apiUrl = `http://www.omdbapi.com/?apikey=742b2d09&t=${text}&plot=full`;  
        const { data } = await movieAxios.get(apiUrl);
        
        if (!data?.download_link) {
            await sock.sendMessage(chatId, {
                text: '🎬 *Movie not found!* Try another title',
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // 2. Prepare info message
        const yearMatch = data.title ? data.title.match(/\((\d{4})\)/) : null;
        const cleanTitle = data.title ? data.title.replace(/\s*\|\s*Download.*$/, '').trim() : text;
        const shortDesc = data.description ? 
            data.description.substring(0, 150) + (data.description.length > 150 ? '...' : '') : 
            'No description available';

        const infoMsg = `🎬 *MAD-MAX Movie Downloader*\n\n` +
                       `*Title:* ${cleanTitle} ${yearMatch ? `(${yearMatch[1]})` : ''}\n` +
                       `*Description:* ${shortDesc}\n\n` +
                       `> Powered By MAD-MAX Bot`;

        // 3. Check file size (using secure axios for the download link)
        let fileSizeMB;
        try {
            const headRes = await secureAxios.head(data.download_link);
            fileSizeMB = headRes.headers['content-length'] ? 
                Math.round(headRes.headers['content-length'] / (1024 * 1024)) : null;
        } catch (e) {
            console.log('Size check failed, defaulting to link');
            fileSizeMB = null;
        }

        // 4. Send file or link based on size
        if (fileSizeMB && fileSizeMB <= 200) {
            try {
                const response = await secureAxios.get(data.download_link, {
                    responseType: 'arraybuffer',
                    maxContentLength: 200 * 1024 * 1024
                });

                await sock.sendMessage(chatId, {
                    document: response.data,
                    fileName: `${cleanTitle.replace(/[^\w\s]/gi, '')}.mp4`,
                    mimetype: 'video/mp4',
                    caption: infoMsg,
                    ...global.channelInfo
                });
            } catch (downloadError) {
                console.error('Download failed, falling back to link', downloadError);
                await sock.sendMessage(chatId, {
                    text: infoMsg + `\n\n📥 *Download Link:* ${data.download_link}\n` +
                          `⚠️ *Couldn't send file directly*`,
                    ...global.channelInfo
                }, { quoted: message });
            }
        } else {
            await sock.sendMessage(chatId, {
                text: infoMsg + `\n\n📥 *Download Link:* ${data.download_link}\n` +
                      `💡 *File too large for direct send*`,
                ...global.channelInfo
            }, { quoted: message });
        }

        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error('Movie Command Error:', error);
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
        await sock.sendMessage(chatId, {
            text: `🎬 *Error:* ${error.message || 'Failed to process request'}`,
            ...global.channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    movieCommand
};