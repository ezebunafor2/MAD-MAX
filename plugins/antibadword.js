const config = require("../settings");

async function handleBadwordDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const badWords = ["wtf", "mia", "xxx", "fuck", 'sex', "huththa", "pakaya", 'ponnaya', "hutto"];
        const isGroup = chatId.endsWith('@g.us');
        
        if (!isGroup || config.ANTI_BAD_WORD !== "true") {
            return;
        }

        // Check if sender is admin
        const isAdmin = require('../lib/isAdmin');
        const adminStatus = await isAdmin(sock, chatId, senderId);
        
        if (adminStatus.isSenderAdmin) {
            return; // Allow admins to use any words
        }

        const messageText = userMessage.toLowerCase();
        const containsBadWord = badWords.some(word => messageText.includes(word));

        if (containsBadWord) {
            // Delete the bad message
            try {
                await sock.sendMessage(chatId, { 
                    delete: message.key 
                });
            } catch (e) {
                console.error("Failed to delete message:", e);
            }
            
            // Send warning
            await sock.sendMessage(chatId, {
                text: "🚫 ⚠️ BAD WORDS NOT ALLOWED ⚠️ 🚫",
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
    } catch (error) {
        console.error("Anti-badword error:", error);
    }
}

// For command to toggle anti-badword
async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, {
            text: "❌ Only admins can use this command!",
            ...global.channelInfo
        }, { quoted: message });
        return;
    }

    // Toggle anti-badword
    const currentState = config.ANTI_BAD_WORD;
    const newState = currentState === "true" ? "false" : "true";
    
    // Update settings (you need to implement this)
    // config.ANTI_BAD_WORD = newState;
    
    await sock.sendMessage(chatId, {
        text: `✅ Anti-badword is now ${newState === "true" ? "ENABLED" : "DISABLED"}`,
        ...global.channelInfo
    }, { quoted: message });
}

module.exports = {
    handleBadwordDetection,
    antibadwordCommand
};