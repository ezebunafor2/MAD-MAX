const config = require("../settings");
const os = require("os");
const { runtime } = require('../lib/functions');
const moment = require("moment");

const ALIVE_IMG = "https://files.catbox.moe/4gjzv5.png";

module.exports = {
    name: "alive",
    alias: ["status", "online"],
    desc: "Check  bot's status & uptime",
    category: "main",
    react: "💡",
    
    async execute(sock, chatId, message, args) {
        try {
            const pushname = message.pushName || "User";
            const now = moment();
            const currentTime = now.format("HH:mm:ss");
            const currentDate = now.format("dddd, MMMM Do YYYY");
            const uptime = runtime(process.uptime());

            const toTinyCap = (text) =>
                text.split("").map(char => {
                    const tiny = {
                        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ',
                        h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ',
                        o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ',
                        v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
                    };
                    return tiny[char.toLowerCase()] || char;
                }).join("");

            const msg = `
╭──❖ 「 *${toTinyCap("MAD-MAX status")}* 」 ❖─
│
│ 👤 ʜɪ: *${pushname}*
│ 🕓 ᴛɪᴍᴇ: *${currentTime}*
│ 📆 ᴅᴀᴛᴇ: *${currentDate}*
│ 🧭 ᴜᴘᴛɪᴍᴇ: *${uptime}*
│ ⚙️ ᴍᴏᴅᴇ: *${config.MODE || "public"}*
│ 🔰 ᴠᴇʀsɪᴏɴ: *${config.version || "1.0.0"}*
│
╰─────────❖

✅ *MAD-MAX is alive & operational!*
🚀 *System: Stable & running smooth!*
✨ *Thank you for checking in!*
            `.trim();

            await sock.sendMessage(chatId, {
                image: { url: ALIVE_IMG },
                caption: msg,
                contextInfo: {
                    mentionedJid: [message.key.participant || message.key.remoteJid],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363401269012709@newsletter',
                        newsletterName: 'MAD-MAX',
                        serverMessageId: 143
                    }
                }
            }, { quoted: message });

        } catch (err) {
            console.error("Error in alive command:", err);
            await sock.sendMessage(chatId, {
                text: `❌ *Alive Command Error:*\n${err.message}`,
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
        }
    }
};