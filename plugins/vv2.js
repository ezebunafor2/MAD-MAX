async function vv2Command(sock, chatId, message, args, senderIsOwnerOrSudo) {
    try {
        if (!senderIsOwnerOrSudo) {
            return; // Simply return without any response if not owner
        }

        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            await sock.sendMessage(chatId, {
                text: "*🍁 Please reply to a view once message!*",
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
            return;
        }

        // Download the media
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        
        let buffer;
        let mtype;
        let caption = '';
        let mimetype;
        let ptt = false;

        // Determine message type and download
        if (quotedMsg.imageMessage) {
            mtype = "imageMessage";
            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
            caption = quotedMsg.imageMessage.caption || '';
            mimetype = quotedMsg.imageMessage.mimetype || "image/jpeg";
        } 
        else if (quotedMsg.videoMessage) {
            mtype = "videoMessage";
            const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
            caption = quotedMsg.videoMessage.caption || '';
            mimetype = quotedMsg.videoMessage.mimetype || "video/mp4";
        }
        else if (quotedMsg.audioMessage) {
            mtype = "audioMessage";
            const stream = await downloadContentFromMessage(quotedMsg.audioMessage, 'audio');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
            mimetype = "audio/mp4";
            ptt = quotedMsg.audioMessage.ptt || false;
        }
        else {
            await sock.sendMessage(chatId, {
                text: "❌ Only image, video, and audio messages are supported",
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
            return;
        }

        // Prepare message content
        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = {
                    image: buffer,
                    caption: caption,
                    mimetype: mimetype
                };
                break;
            case "videoMessage":
                messageContent = {
                    video: buffer,
                    caption: caption,
                    mimetype: mimetype
                };
                break;
            case "audioMessage":
                messageContent = {
                    audio: buffer,
                    mimetype: mimetype,
                    ptt: ptt
                };
                break;
        }

        // Send to sender's DM (private chat)
        const senderId = message.key.participant || message.key.remoteJid;
        await sock.sendMessage(senderId, messageContent, { quoted: message });

    } catch (error) {
        console.error("vv2 Error:", error);
        await sock.sendMessage(chatId, {
            text: `❌ Error fetching vv message:\n${error.message}`,
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

module.exports = {
    vv2Command
};