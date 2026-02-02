// lib/helper2.js
function createContext(sender, options = {}) {
    const {
        title = "MAD-MAX Audio Bot",
        body = "Voice Assistant",
        thumbnail = "https://files.catbox.moe/dgx6oa.png",
        sourceUrl = "https://cyberdark.site"
    } = options;

    return {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: title,
                body: body,
                thumbnailUrl: thumbnail,
                sourceUrl: sourceUrl,
                mediaType: 2, // Audio type
                renderLargerThumbnail: true,
                showAdAttribution: true
            },
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363401269012709@newsletter",
                newsletterName: "MAD-MAX",
                serverMessageId: Math.floor(Math.random() * 1000000) + 100000
            }
        }
    };
}

function createMessageContext(options = {}) {
    const {
        mentionedJid = [],
        forwardingScore = 1,
        isForwarded = true
    } = options;

    return {
        contextInfo: {
            mentionedJid: mentionedJid,
            forwardingScore: forwardingScore,
            isForwarded: isForwarded,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363401269012709@newsletter",
                newsletterName: "MAD-MAX",
                serverMessageId: -1
            }
        }
    };
}

module.exports = {
    createContext,
    createMessageContext
};