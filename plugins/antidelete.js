const { setAnti, getAnti } = require('../data/antidel');

// Store deleted messages in memory
const deletedMessages = new Map();

async function antideleteCommand(sock, chatId, message, args, senderIsOwnerOrSudo) {
    try {
        if (!senderIsOwnerOrSudo) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is only for the bot owner/sudo',
                ...global.channelInfo
            }, { quoted: message });
            return;
        }
        
        const currentStatus = await getAnti();
        const action = args[0]?.toLowerCase();
        
        if (!action || action === 'status') {
            await sock.sendMessage(chatId, {
                text: `🛡️ *MAD-MAX AntiDelete Status:* ${currentStatus ? '✅ ON' : '❌ OFF'}\n\n` +
                      `Usage:\n• ${global.PREFIX || '.'}antidelete on - Enable\n• ${global.PREFIX || '.'}antidelete off - Disable`,
                ...global.channelInfo
            }, { quoted: message });
            return;
        }
        
        if (action === 'on') {
            const success = await setAnti(true);
            if (success) {
                await sock.sendMessage(chatId, {
                    text: '✅ Anti-delete has been enabled',
                    ...global.channelInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Failed to enable anti-delete',
                    ...global.channelInfo
                }, { quoted: message });
            }
        } 
        else if (action === 'off') {
            const success = await setAnti(false);
            if (success) {
                await sock.sendMessage(chatId, {
                    text: '❌ Anti-delete has been disabled',
                    ...global.channelInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Failed to disable anti-delete',
                    ...global.channelInfo
                }, { quoted: message });
            }
        } 
        else {
            await sock.sendMessage(chatId, {
                text: `Invalid command. Usage:\n• ${global.PREFIX || '.'}antidelete on\n• ${global.PREFIX || '.'}antidelete off\n• ${global.PREFIX || '.'}antidelete status`,
                ...global.channelInfo
            }, { quoted: message });
        }
    } catch (e) {
        console.error("Error in antidelete command:", e);
        await sock.sendMessage(chatId, {
            text: "❌ An error occurred while processing your request.",
            ...global.channelInfo
        }, { quoted: message });
    }
}

// Store messages for anti-delete
async function storeMessage(sock, message) {
    try {
        const isEnabled = await getAnti();
        if (!isEnabled) return;
        
        const key = `${message.key.remoteJid}:${message.key.id}`;
        deletedMessages.set(key, {
            message: message,
            timestamp: Date.now()
        });
        
        // Clean old messages (older than 5 minutes)
        setTimeout(() => {
            if (deletedMessages.has(key)) {
                deletedMessages.delete(key);
            }
        }, 5 * 60 * 1000);
    } catch (error) {
        console.error('Error storing message:', error);
    }
}

// Get stored message
function getStoredMessage(chatId, messageId) {
    const key = `${chatId}:${messageId}`;
    return deletedMessages.get(key);
}

// Handle message deletion
async function handleMessageRevocation(sock, message) {
    try {
        const isEnabled = await getAnti();
        if (!isEnabled) return;
        
        const revokedMessage = message.message?.protocolMessage;
        if (!revokedMessage) return;
        
        const chatId = message.key.remoteJid;
        const deletedMsgId = revokedMessage.key?.id;
        
        if (!deletedMsgId) return;
        
        // Get the stored message
        const storedMessage = getStoredMessage(chatId, deletedMsgId);
        if (!storedMessage || !storedMessage.message) return;
        
        const originalMsg = storedMessage.message;
        const sender = originalMsg.key.participant || originalMsg.key.remoteJid;
        const senderName = originalMsg.pushName || 'Unknown';
        
        // Prepare caption
        let caption = `🚫 *Message Deleted Detection*\n\n`;
        caption += `👤 *Sender:* @${sender.split('@')[0]}\n`;
        caption += `📝 *Name:* ${senderName}\n`;
        caption += `⏰ *Time (Original):* ${new Date(originalMsg.messageTimestamp * 1000).toLocaleTimeString()}\n`;
        caption += `🗑️ *Deleted Message:*\n`;
        
        // Get message content
        let messageContent = '';
        if (originalMsg.message?.conversation) {
            messageContent = originalMsg.message.conversation;
        } else if (originalMsg.message?.extendedTextMessage?.text) {
            messageContent = originalMsg.message.extendedTextMessage.text;
        } else if (originalMsg.message?.imageMessage?.caption) {
            messageContent = `[Image] ${originalMsg.message.imageMessage.caption}`;
        } else if (originalMsg.message?.videoMessage?.caption) {
            messageContent = `[Video] ${originalMsg.message.videoMessage.caption}`;
        } else {
            messageContent = '[Media Message]';
        }
        
        caption += messageContent;
        
        // Send notification
        await sock.sendMessage(chatId, {
            text: caption,
            mentions: [sender],
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401269012709@newsletter',
                    newsletterName: 'MAD-MAX',
                    serverMessageId: -1
                }
            }
        });
        
    } catch (error) {
        console.error('Error handling message revocation:', error);
    }
}

module.exports = {
    antideleteCommand,
    storeMessage,
    handleMessageRevocation
};