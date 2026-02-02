const config = require('../settings');
const moment = require('moment-timezone');

async function ping2Command(sock, chatId, message) {
    try {
        const start = Date.now();

        // Emojis and styles
        const emojiSets = {
            reactions: ['⚡', '🚀', '💨', '🎯', '🌟', '💎', '🔥', '✨', '🌀', '🔹'],
            bars: [
                '▰▰▰▰▰▰▰▰▰▰',
                '▰▱▱▱▱▱▱▱▱▱',
                '▰▰▱▱▱▱▱▱▱▱',
                '▰▰▰▱▱▱▱▱▱▱',
                '▰▰▰▰▱▱▱▱▱▱'
            ],
            status: ['🟢 ONLINE', '🔵 ACTIVE', '🟣 RUNNING', '🟡 RESPONDING']
        };

        const reactionEmoji = emojiSets.reactions[Math.floor(Math.random() * emojiSets.reactions.length)];
        const statusText = emojiSets.status[Math.floor(Math.random() * emojiSets.status.length)];
        const loadingBar = emojiSets.bars[Math.floor(Math.random() * emojiSets.bars.length)];

        // React with emoji
        await sock.sendMessage(chatId, {
            react: { text: reactionEmoji, key: message.key }
        });

        // Time info
        const responseTime = (Date.now() - start) / 1000;
        const time = moment().tz('Africa/Nairobi').format('HH:mm:ss'); // Changed to Nairobi timezone
        const date = moment().tz('Africa/Nairobi').format('DD/MM/YYYY');

        // Owner & bot name
        const ownerName = config.botOwner || config.author || "NUCH";
        const botName = config.botName || "MAD-MAX";
        const repoLink = "https://github.com/yourusername/mad-max-bot"; // Add your repo link

        // Final output
        const pingMsg = `

*${statusText}*

⚡ *Response Time:* ${responseTime.toFixed(2)}s
⏰ *Time:* ${time}
📅 *Date:* ${date}

💻 *Developer:* ${ownerName}
🤖 *Bot Name:* ${botName}

🌟 MAD-MAX Bot is fully operational!
🔗 Stay tuned for updates!

${loadingBar}
`.trim();

        const sender = message.key.participant || message.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: pingMsg,
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
        console.error("❌ Ping2 command error:", e);
        await sock.sendMessage(chatId, {
            text: `❌ Error: ${e.message}`,
            ...global.channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    ping2Command
};