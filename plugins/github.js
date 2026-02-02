const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {
    // Create website information instead of fetching from GitHub API
    const websiteUrl = 'https://cyberdark.site/';
    
    let txt = `*💀  CYBERDARK SITE  💀*\n\n`;
    txt += `✩  *Website* : CyberDark Site\n`;
    txt += `✩  *Status* : 🟢 Online\n`;
    txt += `✩  *Last Updated* : ${moment().format('DD/MM/YY - HH:mm:ss')}\n`;
    txt += `✩  *URL* : ${websiteUrl}\n`;
    txt += `✩  *Type* : Premium Bot Services\n`;
    txt += `✩  *Features* : WhatsApp Bots & Tools\n\n`;
    txt += `🌐 *Visit our website for premium services!*`;
    txt += `\n\n🔗 ${websiteUrl}`;

    // Try to send with image first, fallback to text only if image fails
    try {
      const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
      
      if (fs.existsSync(imgPath)) {
        const imgBuffer = fs.readFileSync(imgPath);
        await sock.sendMessage(chatId, { 
          image: imgBuffer, 
          caption: txt 
        }, { quoted: message });
      } else {
        // If image doesn't exist, send text with website preview
        await sock.sendMessage(chatId, { 
          text: txt,
          contextInfo: {
            externalAdReply: {
              title: "CyberDark Site",
              body: "Premium WhatsApp Bot Services",
              mediaType: 1,
              thumbnailUrl: "https://img.icons8.com/color/96/000000/internet.png",
              sourceUrl: websiteUrl
            }
          }
        }, { quoted: message });
      }
    } catch (imageError) {
      console.error('Image error, sending text only:', imageError);
      // Fallback to simple text message
      await sock.sendMessage(chatId, { 
        text: txt 
      }, { quoted: message });
    }
    
  } catch (error) {
    console.error('Error in githubCommand:', error);
    
    // Simple fallback with just the website link
    await sock.sendMessage(chatId, { 
      text: `🌐 *CyberDark Site*\n\n` +
            `Visit our website for premium WhatsApp bot services:\n` +
            `🔗 ${websiteUrl}` 
    }, { quoted: message });
  }
}

module.exports = githubCommand;