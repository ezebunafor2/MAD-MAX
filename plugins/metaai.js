const axios = require('axios');

async function metaaiCommand(sock, chatId, message, args) {
    try {
        const query = args.join(' ').trim();
        
        if (!query) {
            await sock.sendMessage(chatId, {
                text: "❌ Please provide a question to ask Meta AI.",
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // React: Processing
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        // Show "typing" presence
        await sock.sendPresenceUpdate("composing", chatId);

        // Fetch AI response
        const { data } = await axios.get(`https://apis.davidcyriltech.my.id/ai/metaai?text=${encodeURIComponent(query)}`);

        if (!data.success || !data.response) {
            await sock.sendMessage(chatId, { 
                react: { text: '❌', key: message.key } 
            });
            await sock.sendMessage(chatId, {
                text: "❌ Meta AI failed to respond.",
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // React: Success
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

        // Reply with AI message
        await sock.sendMessage(chatId, {
            text: `💬 *MAD-MAX Meta AI:* ${data.response}`,
            ...global.channelInfo
        }, { quoted: message });

    } catch (e) {
        console.error("MetaAI Error:", e);
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
        await sock.sendMessage(chatId, {
            text: "❌ An error occurred while talking to Meta AI.",
            ...global.channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    metaaiCommand
};