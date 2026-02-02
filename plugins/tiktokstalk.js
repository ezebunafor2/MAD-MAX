const axios = require('axios');

async function tiktokstalkCommand(sock, chatId, message, args) {
    try {
        const username = args.join(' ').trim();
        
        if (!username) {
            await sock.sendMessage(chatId, {
                text: "❎ Please provide a TikTok username.\n\n*Example:* .tiktokstalk mrbeast",
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // Send processing reaction
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        const apiUrl = `https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(username)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) {
            await sock.sendMessage(chatId, {
                text: "❌ User not found. Please check the username and try again.",
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        const user = data.data.user;
        const stats = data.data.stats;

        const profileInfo = `🎭 *MAD-MAX TikTok Profile Stalker* 🎭

👤 *Username:* @${user.uniqueId}
📛 *Nickname:* ${user.nickname}
✅ *Verified:* ${user.verified ? "Yes ✅" : "No ❌"}
📍 *Region:* ${user.region || "Not specified"}
📝 *Bio:* ${user.signature || "No bio available."}
🔗 *Bio Link:* ${user.bioLink?.link || "No link available."}

📊 *Statistics:*
👥 *Followers:* ${stats.followerCount ? stats.followerCount.toLocaleString() : "0"}
👤 *Following:* ${stats.followingCount ? stats.followingCount.toLocaleString() : "0"}
❤️ *Likes:* ${stats.heartCount ? stats.heartCount.toLocaleString() : "0"}
🎥 *Videos:* ${stats.videoCount ? stats.videoCount.toLocaleString() : "0"}

📅 *Account Created:* ${user.createTime ? new Date(user.createTime * 1000).toLocaleDateString() : "Unknown"}
🔒 *Private Account:* ${user.privateAccount ? "Yes 🔒" : "No 🌍"}

🔗 *Profile URL:* https://www.tiktok.com/@${user.uniqueId}`;

        // Try to send with profile image
        if (user.avatarLarger) {
            try {
                await sock.sendMessage(chatId, {
                    image: { url: user.avatarLarger },
                    caption: profileInfo,
                    ...global.channelInfo
                }, { quoted: message });
            } catch (imageError) {
                // Fallback to text-only if image fails
                console.error('Image load failed:', imageError);
                await sock.sendMessage(chatId, {
                    text: profileInfo,
                    ...global.channelInfo
                }, { quoted: message });
            }
        } else {
            // Text-only if no image
            await sock.sendMessage(chatId, {
                text: profileInfo,
                ...global.channelInfo
            }, { quoted: message });
        }

        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error("❌ Error in TikTok stalk command:", error);
        
        // Send error reaction
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
        
        await sock.sendMessage(chatId, {
            text: "⚠️ An error occurred while fetching TikTok profile data.",
            ...global.channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    tiktokstalkCommand
};