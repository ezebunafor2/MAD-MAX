const settings = require('../settings'); // Adjust path if needed
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363401269012709@newsletter',
            newsletterName: settings.botName || 'MAD-MAX',
            serverMessageId: -1
        }
    }
};

async function blockCommand(sock, chatId, message, args, senderIsOwnerOrSudo) {
    try {
        // Check if sender is owner/sudo
        if (!senderIsOwnerOrSudo) {
            await sock.sendMessage(chatId, {
                text: "❌ Only the bot owner/sudo can use this command.",
                ...channelInfo
            }, { quoted: message });
            return;
        }

        // Get target user
        let targetJid;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quotedSender = message.message?.extendedTextMessage?.contextInfo?.participant;
        
        if (mentionedJid) {
            targetJid = mentionedJid;
        } else if (quotedSender) {
            targetJid = quotedSender;
        } else if (args[0]) {
            // Clean phone number
            const phone = args[0].replace(/[^0-9]/g, '');
            if (phone.length >= 10) {
                targetJid = phone + '@s.whatsapp.net';
            }
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, {
                text: "❌ Please mention a user or reply to their message.\n\nUsage:\n.block @user\n.block 254123456789\n.block (reply to user)",
                ...channelInfo
            }, { quoted: message });
            return;
        }

        // Block the user
        await sock.updateBlockStatus(targetJid, "block");
        
        await sock.sendMessage(chatId, {
            text: `🚫 Successfully blocked @${targetJid.split("@")[0]}`,
            mentions: [targetJid],
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error("Block command error:", error);
        await sock.sendMessage(chatId, {
            text: "❌ Failed to block the user.",
            ...channelInfo
        }, { quoted: message });
    }
}

async function unblockCommand(sock, chatId, message, args, senderIsOwnerOrSudo) {
    try {
        // Check if sender is owner/sudo
        if (!senderIsOwnerOrSudo) {
            await sock.sendMessage(chatId, {
                text: "❌ Only the bot owner/sudo can use this command.",
                ...channelInfo
            }, { quoted: message });
            return;
        }

        // Get target user
        let targetJid;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quotedSender = message.message?.extendedTextMessage?.contextInfo?.participant;
        
        if (mentionedJid) {
            targetJid = mentionedJid;
        } else if (quotedSender) {
            targetJid = quotedSender;
        } else if (args[0]) {
            // Clean phone number
            const phone = args[0].replace(/[^0-9]/g, '');
            if (phone.length >= 10) {
                targetJid = phone + '@s.whatsapp.net';
            }
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, {
                text: "❌ Please mention a user or reply to their message.\n\nUsage:\n.unblock @user\n.unblock 254123456789\n.unblock (reply to user)",
                ...channelInfo
            }, { quoted: message });
            return;
        }

        // Unblock the user
        await sock.updateBlockStatus(targetJid, "unblock");
        
        await sock.sendMessage(chatId, {
            text: `🔓 Successfully unblocked @${targetJid.split("@")[0]}`,
            mentions: [targetJid],
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error("Unblock command error:", error);
        await sock.sendMessage(chatId, {
            text: "❌ Failed to unblock the user.",
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    blockCommand,
    unblockCommand
};