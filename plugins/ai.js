const settings = require('../settings');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');


// Utility functions
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

async function downloadAndSaveImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const tempPath = path.join(__dirname, '..', 'temp', `ai_image_${Date.now()}.jpg`);
        await fs.ensureDir(path.dirname(tempPath));
        await fs.writeFile(tempPath, response.data);
        return tempPath;
    } catch (error) {
        throw new Error(`Failed to download image: ${error.message}`);
    }
}

// Enhanced API response handler
async function fetchAIResponse(url, query) {
    try {
        const response = await axios.get(url + encodeURIComponent(query), {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'MAD-MAX-Bot'
            }
        });
        
        // Handle BK9 API response format
        if (response.data && response.data.BK9) {
            return response.data.BK9;
        }
        
        // Handle other response formats
        const responseData = response.data;
        if (!responseData) return "No response from the API";
        
        if (typeof responseData === 'string') {
            return responseData.trim();
        }
        
        if (typeof responseData === 'object') {
            // Check all possible response fields
            const possibleFields = ['BK9', 'response', 'message', 'answer', 'text', 'content', 'url', 'image'];
            for (const field of possibleFields) {
                if (responseData[field]) {
                    if (typeof responseData[field] === 'string') {
                        return responseData[field].trim();
                    }
                    if (field === 'image' || field === 'url') {
                        return { image: responseData[field] };
                    }
                }
            }
            
            // Fallback to stringify if no known fields found
            const jsonResponse = JSON.stringify(responseData);
            return jsonResponse.length > 500 ? jsonResponse.slice(0, 500) + "..." : jsonResponse;
        }
        
        return "Unexpected API response format";
    } catch (error) {
        console.error("API Error:", error.message);
        throw new Error(`API request failed: ${error.response?.status || error.message}`);
    }
}

// AI command handler
async function handleAICommand(sock, chatId, message, args, command) {
    const PREFIX = settings.PREFIX || '.';
    const query = args.join(' ');

    // AI Commands configuration
    const aiConfigs = {
        'gpt': {
            url: "https://api.bk9.dev/ai/gemini?q=",
            description: "Google Gemini AI"
        },
        'gpt4': {
            url: "https://api.bk9.dev/ai/llama?q=",
            description: "Meta's Llama AI"
        },
        'zoroai': {
            url: "https://api.bk9.dev/ai/BK93?BK9=you%20are%20zoro%20from%20one%20piece&q=",
            description: "Zoro-themed AI"
        },
        'jeeves': {
            url: "https://api.bk9.dev/ai/jeeves-chat?q=",
            description: "Jeeves AI Assistant"
        },
        'jeeves2': {
            url: "https://api.bk9.dev/ai/jeeves-chat2?q=",
            description: "Jeeves AI v2"
        },
        'perplexity': {
            url: "https://api.bk9.dev/ai/Perplexity?q=",
            description: "Perplexity AI"
        },
        'xdash': {
            url: "https://api.bk9.dev/ai/xdash?q=",
            description: "XDash AI"
        },
        'aoyo': {
            url: "https://api.bk9.dev/ai/Aoyo?q=",
            description: "Naruto-themed AI"
        },
        'math': {
            url: "https://api.bk9.dev/ai/mathssolve?q=",
            description: "Math problem solver"
        }
    };

    // Get the command configuration
    const config = aiConfigs[command];
    if (!config) {
        return await sock.sendMessage(chatId, {
            text: `❌ Invalid AI command. Available commands: ${Object.keys(aiConfigs).join(', ')}`
        }, { quoted: message });
    }

    // Check if query is provided
    if (!query.trim()) {
        return await sock.sendMessage(chatId, {
            text: `Please provide a query.\nExample: ${PREFIX}${command} ${command === 'math' ? '2+2' : 'your question here'}`
        }, { quoted: message });
    }

    try {
        // Send processing message
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        // Get AI response
        const response = await fetchAIResponse(config.url, query);
        
        // Send response
        await sock.sendMessage(chatId, {
            text: `*🤖 ${config.description}*\n\n📝 *Query:* ${query}\n\n${response}\n\n─ Mad-Max AI`
        }, { quoted: message });

        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error(`AI command error (${command}):`, error);
        await sock.sendMessage(chatId, {
            text: `❌ Failed to get response from ${config.description}. Please try again.`
        }, { quoted: message });
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
    }
}

// AI help command
async function aiHelpCommand(sock, chatId, message) {
    const PREFIX = settings.PREFIX || '.';
    
    const helpText = `
🤖 *MAD-MAX AI COMMANDS*

*Available AI Models:*
• ${PREFIX}gpt [query] - Google Gemini AI
• ${PREFIX}gpt4 [query] - Meta's Llama AI
• ${PREFIX}zoroai [query] - Zoro-themed AI (One Piece)
• ${PREFIX}jeeves [query] - Jeeves AI Assistant
• ${PREFIX}jeeves2 [query] - Jeeves AI v2
• ${PREFIX}perplexity [query] - Perplexity AI
• ${PREFIX}xdash [query] - XDash AI
• ${PREFIX}aoyo [query] - Naruto-themed AI
• ${PREFIX}math [query] - Math problem solver

*Examples:*
${PREFIX}gpt Explain quantum computing
${PREFIX}math Calculate 15% of 2000
${PREFIX}zoroai Tell me about swordsmanship
${PREFIX}aoyo What is chakra?

*Powered by 404unkown API | MAD-MAX Bot*
`;

    await sock.sendMessage(chatId, {
        text: helpText
    }, { quoted: message });
}

// Export functions
module.exports = {
    handleAICommand,
    aiHelpCommand
};