const axios = require('axios');
const ytSearch = require('yt-search');

// Store active download sessions
const downloadSessions = new Map();

// NEW API from your friend's bot
const BASE_URL = 'https://noobs-api.top';

// Main command handler
async function playCommand(sock, chatId, message, args) {
    const query = args.join(' ');
    
    if (!query) {
        return await sock.sendMessage(chatId, {
            text: `❌ Please provide a song/video name.\nExample: .play shape of you`,
            quoted: message
        });
    }

    try {
        // Send processing reaction
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        // Show searching message
        const searchingMsg = await sock.sendMessage(chatId, {
            text: `🎵 Searching for "${query}"...`
        }, { quoted: message });

        // Search YouTube
        const searchResults = await ytSearch(query);
        if (!searchResults.videos.length) {
            await sock.sendMessage(chatId, { 
                react: { text: '❌', key: message.key } 
            });
            return await sock.sendMessage(chatId, {
                text: "❌ No results found for your search."
            }, { quoted: message });
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;

        // Delete searching message
        try {
            await sock.sendMessage(chatId, { delete: searchingMsg.key });
        } catch (e) {}

        // Send success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

        // Create numbered options
        const downloadOptions = `
*📥 DOWNLOAD OPTIONS - Reply with number:*

*1.* 🎵 Download Audio (MP3)
*2.* 🎥 Download Video (MP4)  

_Reply with any number above to proceed_
_This menu stays active - you can use it multiple times_`;

        // Send result with numbered options
        const sentMessage = await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `*${video.title}*\n\n🎬 *Channel:* ${video.author.name}\n⏱️ *Duration:* ${video.timestamp}\n👀 *Views:* ${video.views.toLocaleString()}\n\n${downloadOptions}`,
            contextInfo: {
                externalAdReply: {
                    title: video.title.substring(0, 60),
                    body: `By ${video.author.name}`,
                    mediaType: 2,
                    thumbnailUrl: video.thumbnail,
                    mediaUrl: video.url,
                    sourceUrl: video.url
                }
            }
        }, { quoted: message });

        // Store session data
        const sessionId = sentMessage.key.id;
        downloadSessions.set(sessionId, {
            videoUrl: videoUrl,
            videoTitle: video.title,
            videoThumbnail: video.thumbnail,
            videoId: video.videoId, // Added for API
            dest: chatId,
            userJid: message.key.participant || message.key.remoteJid,
            createdAt: Date.now()
        });

        // Clean up old sessions after 5 minutes
        setTimeout(() => {
            if (downloadSessions.has(sessionId)) {
                downloadSessions.delete(sessionId);
            }
        }, 5 * 60 * 1000);

    } catch (error) {
        console.error("YouTube search error:", error);
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
        await sock.sendMessage(chatId, {
            text: "❌ Error searching for the video."
        }, { quoted: message });
    }
}

// Handle download reply messages
async function handleDownloadReply(sock, update) {
    try {
        const { messages } = update;
        const message = messages[0];
        if (!message?.message) return;

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        
        // Get the original message ID that this is replying to
        const quotedMessageId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (!quotedMessageId) return;

        // Check if this is a reply to a download session
        if (!downloadSessions.has(quotedMessageId)) return;

        const responseText = message.message.extendedTextMessage?.text?.trim() || 
                           message.message.conversation?.trim();
        
        if (!responseText) return;

        const selectedOption = parseInt(responseText);
        const session = downloadSessions.get(quotedMessageId);

        // Verify this user is the same who started the session
        if (session.userJid !== senderId) {
            await sock.sendMessage(chatId, {
                text: "⚠️ This download session belongs to another user. Start your own with `.play [query]`"
            }, { quoted: message });
            return;
        }

        // Send processing reaction
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        const downloadMsg = await sock.sendMessage(chatId, {
            text: selectedOption === 1 ? "🎵 Downloading audio..." : "🎥 Downloading video..."
        }, { quoted: message });

        try {
            if (selectedOption === 1) {
                await downloadAudio(session.videoId, chatId, sock, message, session.videoTitle);
            } else if (selectedOption === 2) {
                await downloadVideo(session.videoUrl, chatId, sock, message, session.videoTitle);
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ Invalid option. Please reply with:\n1 for Audio\n2 for Video`
                }, { quoted: message });
                return;
            }

            // Success reaction
            await sock.sendMessage(chatId, { 
                react: { text: '✅', key: message.key } 
            });

            // Delete download message
            try {
                await sock.sendMessage(chatId, { delete: downloadMsg.key });
            } catch (e) {}

        } catch (downloadError) {
            console.error("Download error:", downloadError);
            await sock.sendMessage(chatId, { 
                react: { text: '❌', key: message.key } 
            });
            await sock.sendMessage(chatId, {
                text: `❌ Download failed. Try again later or use a different search term.`
            }, { quoted: message });
        }

    } catch (error) {
        console.error("Download reply handler error:", error);
    }
}

// Download audio using the new API
async function downloadAudio(videoId, dest, sock, originalMsg, title) {
    try {
        // Use the exact API from your friend's bot
        const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=mp3`;

        console.log(`Calling API: ${apiURL}`);
        
        const response = await axios.get(apiURL, { timeout: 30000 });
        const data = response.data;

        if (!data.downloadLink) {
            throw new Error("No download link in API response");
        }

        const safeTitle = title.replace(/[\\/:*?"<>|]/g, '');
        const fileName = `${safeTitle.substring(0, 50)}.mp3`;

        // Download the audio file
        const audioResponse = await axios.get(data.downloadLink, { 
            responseType: 'arraybuffer',
            timeout: 45000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        await sock.sendMessage(dest, {
            audio: Buffer.from(audioResponse.data),
            mimetype: 'audio/mpeg',
            fileName: fileName,
            contextInfo: {
                externalAdReply: {
                    title: title.substring(0, 30),
                    body: "Downloaded via MAD-MAX",
                    mediaType: 2,
                    thumbnailUrl: "https://files.catbox.moe/dgx6oa.png",
                    mediaUrl: `https://youtube.com/watch?v=${videoId}`,
                    sourceUrl: `https://youtube.com/watch?v=${videoId}`
                }
            }
        }, { quoted: originalMsg });
        
        return true;

    } catch (apiError) {
        console.error(`Audio download failed:`, apiError.message);
        throw new Error(`Audio download failed: ${apiError.message}`);
    }
}

// Download video (keep existing or use video API if available)
async function downloadVideo(videoUrl, dest, sock, originalMsg, title) {
    try {
        // Use the dreaded.site API from play2 command for video
        const apiURL = `https://api.dreaded.site/api/ytdl/video?url=${encodeURIComponent(videoUrl)}`;

        console.log(`Calling video API: ${apiURL}`);
        
        const response = await axios.get(apiURL, { timeout: 30000 });
        const data = response.data;

        if (!data.result?.url) {
            throw new Error("No video URL in API response");
        }

        const safeTitle = title.replace(/[\\/:*?"<>|]/g, '');
        const fileName = `${safeTitle.substring(0, 50)}.mp4`;

        // Download the video file
        const videoResponse = await axios.get(data.result.url, { 
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
            }
        });
        
        await sock.sendMessage(dest, {
            video: Buffer.from(videoResponse.data),
            mimetype: 'video/mp4',
            caption: `🎥 ${title}`,
            fileName: fileName,
            contextInfo: {
                externalAdReply: {
                    title: title.substring(0, 30),
                    body: "Downloaded via MAD-MAX",
                    mediaType: 2,
                    thumbnailUrl: "https://files.catbox.moe/4gjzv5.png",
                    mediaUrl: videoUrl,
                    sourceUrl: videoUrl
                }
            }
        }, { quoted: originalMsg });
        
        return true;

    } catch (apiError) {
        console.error(`Video download failed:`, apiError.message);
        throw new Error(`Video download failed: ${apiError.message}`);
    }
}

// Export functions
module.exports = {
    playCommand,
    handleDownloadReply
};