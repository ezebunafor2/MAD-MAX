const axios = require('axios');

async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q || q.trim() === '') {
            return await sock.sendMessage(chatId, {
                text: `📱 *Pair Command*\n\nUsage: \`.pair <whatsapp-number>\`\nExample: \`.pair 254769769295\`\n\nMultiple numbers: \`.pair 254769769295,254712345678\`\n\n🔗 pair manually: https://pair-1-3xsl.onrender.com/pair`,
                quoted: message
            });
        }

        const numbers = q.split(',')
            .map(num => num.trim().replace(/[^0-9]/g, ''))
            .filter(num => num.length >= 9 && num.length <= 15);

        if (numbers.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid number(s)!\n\nFormat: 9-15 digits\nExample: \`.pair 254769769295\`\nExample: \`.pair 254712345678,254798765432\``,
                quoted: message
            });
        }

        let successResults = [];
        let failedResults = [];

        for (const number of numbers) {
            try {
                // Check if number exists on WhatsApp
                const whatsappID = number + '@s.whatsapp.net';
                const result = await sock.onWhatsApp(whatsappID);
                
                if (!result[0]?.exists) {
                    failedResults.push(`${number} ❌ Not on WhatsApp`);
                    continue;
                }

                // Get pairing code from API
                console.log(`🔍 Fetching code for: ${number}`);
                const response = await axios.get(`https://pair-1-3xsl.onrender.com/code?number=${number}`, {
                    timeout: 15000,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'WhatsApp-Bot/1.0'
                    }
                });

                if (response.data && response.data.code) {
                    const code = response.data.code;
                    successResults.push(`✅ ${number}: *${code}*`);
                    
                    // Send individual code
await sock.sendMessage(chatId, {
    text: code,
    quoted: message
});
                    
                    // Wait a bit between numbers
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } else {
                    failedResults.push(`${number} ❌ No code received`);
                }
                
            } catch (error) {
                console.error(`Error for ${number}:`, error.message);
                
                if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
                    // API is down, stop processing
                    failedResults.push(`${number} ❌ Service unavailable`);
                    break;
                } else {
                    failedResults.push(`${number} ❌ ${error.message}`);
                }
            }
        }

        // Send summary
        let summaryText = `📊 *Pairing Summary*\n\n`;
        
        if (successResults.length > 0) {
            summaryText += `✅ *Successful:*\n${successResults.join('\n')}\n\n`;
        }
        
        if (failedResults.length > 0) {
            summaryText += `❌ *Failed:*\n${failedResults.join('\n')}\n\n`;
        }
        
        if (failedResults.length > 0 && successResults.length === 0) {
            summaryText += `🔧 *Try:*\n• Visit: https://pair-1-3xsl.onrender.com/pair\n• Enter numbers manually\n• Contact bot owner`;
        } else if (successResults.length > 0) {
            summaryText += `💡 *Instructions:*\nUse codes above within 30 seconds!`;
        }
        
        if (successResults.length + failedResults.length > 1) {
            await sock.sendMessage(chatId, {
                text: summaryText,
                quoted: message
            });
        }

    } catch (error) {
        console.error('Pair command error:', error);
        
        await sock.sendMessage(chatId, {
            text: `❌ *Error*\n\n${error.message}\n\n🔗 *Alternative:*\nVisit https://pair-1-3xsl.onrender.com/pair\nEnter your number manually`,
            quoted: message
        });
    }
}

module.exports = pairCommand;