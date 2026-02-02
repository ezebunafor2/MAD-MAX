const { runtime } = require('../lib/functions');
const settings = require('./settings');

async function uptimeCommand(sock, chatId, message) {
    try {
        const uptime = runtime(process.uptime());
        const startTime = new Date(Date.now() - process.uptime() * 1000);

        const timeReport = `
╭───⏱️ *ᴜᴘᴛɪᴍᴇ ʀᴇᴘᴏʀᴛ* ⏱️
│
│ 🔋 *Online for:* ${uptime}
│ 🕰️ *Since:* ${startTime.toLocaleString()}
│ 🧩 *Status:* Online & stable
│
╰─➤ ${settings.DESCRIPTION || 'Bot Powered By 404TECH.'}
        `.trim();

        await sock.sendMessage(chatId, { 
            text: timeReport,
            contextInfo: {
                mentionedJid: [message.key.participant || message.key.remoteJid],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401269012709@newsletter',
                    newsletterName: settings.botName || 'MAD-MAX',
                    serverMessageId: 143
                }
            }
        }, { quoted: message });

        // Add reaction (optional)
        await sock.sendMessage(chatId, {
            react: { text: '⏱️', key: message.key }
        });

    } catch (error) {
        console.error('Uptime command error:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Error: ${error.message}`,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true
            }
        }, { quoted: message });
    }
}

module.exports = uptimeCommand;