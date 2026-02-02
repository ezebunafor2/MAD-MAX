const config = require('../settings');

async function pingCommand(sock, chatId, message) {
    try {
        const startTime = Date.now();

        const emojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹', '💎', '🏆', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        // React instantly with a random emoji
        await sock.sendMessage(chatId, {
            react: { text: randomEmoji, key: message.key }
        });

        const ping = Date.now() - startTime;

        // Speed categorization
        let badge = '🐢 Slow', color = '🔴';
        if (ping <= 150) {
            badge = '🚀 Super Fast';
            color = '🟢';
        } else if (ping <= 300) {
            badge = '⚡ Fast';
            color = '🟡';
        } else if (ping <= 600) {
            badge = '⚠️ Medium';
            color = '🟠';
        }

        const sender = message.key.participant || message.key.remoteJid;

        // Final response
        await sock.sendMessage(chatId, {
            text: `> *MAD-MAX RESPONSE: ${ping} ms ${randomEmoji}*\n> *sᴛᴀᴛᴜs: ${color} ${badge}*\n> *ᴠᴇʀsɪᴏɴ: ${config.version || "2.0.0"}*`,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401269012709@newsletter',
                    newsletterName: "MAD-MAX",
                    serverMessageId: 143
                }
            }
        }, { quoted: message });

    } catch (e) {
        console.error("❌ Error in ping command:", e);
        await sock.sendMessage(chatId, {
            text: `⚠️ Error: ${e.message}`,
            ...global.channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    pingCommand
};