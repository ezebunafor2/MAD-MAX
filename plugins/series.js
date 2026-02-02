const axios = require('axios');
const https = require('https');
const config = require('../settings');

// Configure axios with better timeout and retry settings
const apiClient = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({ 
    rejectUnauthorized: false,
    maxFreeSockets: 1,
    keepAlive: false
  }),
  maxRedirects: 2
});

async function seriesCommand(sock, chatId, message, args) {
    try {
        const text = args.join(' ').trim();
        
        // Input validation
        if (!text) {
            await sock.sendMessage(chatId, {
                text: `📺 *Usage:* ${config.PREFIX || '.'}series <series> <season> <episode>\n\nExamples:\n${config.PREFIX || '.'}series "Money Heist" 1 1\n${config.PREFIX || '.'}series Breaking Bad S01E01`,
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // Send processing reaction
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        // Parse input (supports both formats)
        let seriesName, seasonNum, episodeNum;
        
        // Format 1: "series S01E01"
        const seasonEpisodeMatch = text.match(/(.+?)\s*s(\d+)e(\d+)/i);
        if (seasonEpisodeMatch) {
            seriesName = seasonEpisodeMatch[1];
            seasonNum = seasonEpisodeMatch[2].padStart(2, '0');
            episodeNum = seasonEpisodeMatch[3].padStart(2, '0');
        } 
        // Format 2: "series 1 1"
        else {
            const parts = text.trim().split(/\s+/);
            if (parts.length >= 3) {
                seriesName = parts.slice(0, -2).join(' ');
                seasonNum = parts[parts.length-2].padStart(2, '0');
                episodeNum = parts[parts.length-1].padStart(2, '0');
            }
        }

        if (!seriesName || !seasonNum || !episodeNum) {
            await sock.sendMessage(chatId, {
                text: '📺 *Invalid format!*\n\nUse:\n.series <series> <season> <episode>\nOR\n.series <series> S01E01',
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // API request
        const apiUrl = `http://www.omdbapi.com/?apikey=742b2d09&t=${encodeURIComponent(seriesName)}&season=${seasonNum}&episode=${episodeNum}&plot=full`;
        const { data } = await apiClient.get(apiUrl);

        if (!data?.download_link) {
            await sock.sendMessage(chatId, {
                text: '📺 *Episode not found!*\nCheck your inputs or try another series',
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // Prepare episode info
        const episodeInfo = `🎬 *${data.Title || seriesName}*\n\n` +
                   `*Episode:* S${seasonNum}E${episodeNum}\n` +
                   `*Title:* ${data.Title || 'N/A'}\n` +
                   `*Released:* ${data.Released || 'N/A'}\n` +
                   `*Runtime:* ${data.Runtime || 'N/A'}\n` +
                   `*IMDB Rating:* ${data.imdbRating || 'N/A'}\n` +
                   `*Plot:* ${data.Plot || 'No plot available'}\n\n` +
                   `> Data from OMDB API`;

        // Send episode info
        await sock.sendMessage(chatId, {
            text: episodeInfo,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401269012709@newsletter',
                    newsletterName: 'MAD-MAX',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

        // Try to send poster image if available
        if (data.Poster && data.Poster !== 'N/A') {
            try {
                const imageResponse = await axios.get(data.Poster, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                });
                
                await sock.sendMessage(chatId, {
                    image: imageResponse.data,
                    caption: `🎬 ${data.Title} - S${seasonNum}E${episodeNum}`,
                    ...global.channelInfo
                });
            } catch (imgError) {
                console.log('Could not download poster:', imgError.message);
            }
        }

        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error('Series Command Error:', error);
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
        await sock.sendMessage(chatId, {
            text: `📺 *Error:* ${error.message || 'Failed to fetch series episode'}`,
            ...global.channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    seriesCommand
};