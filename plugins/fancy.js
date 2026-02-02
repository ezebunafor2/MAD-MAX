const axios = require('axios');

async function fancy(sock, chatId, message, args) {
    try {
        const text = args.join(' ').trim();
        
        if (!text) {
            await sock.sendMessage(chatId, {
                text: "❎ Please provide text to convert into fancy fonts.\n\n*Example:* .fancy Hello World",
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // Send processing reaction
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: message.key } 
        });

        // Try multiple APIs for better reliability
        const apiUrls = [
            `https://api.lolhuman.xyz/api/fancy?apikey=${process.env.LOLHUMAN_KEY || 'YOUR_API_KEY'}&text=${encodeURIComponent(text)}`,
            `https://api.dhamzxploit.my.id/api/fancy?text=${encodeURIComponent(text)}`,
            `https://api.alandikasaputra.repl.co/fancy?text=${encodeURIComponent(text)}`
        ];
        
        let response;
        let apiIndex = 0;
        
        // Try each API until one works
        while (apiIndex < apiUrls.length) {
            try {
                response = await axios.get(apiUrls[apiIndex], { timeout: 5000 });
                if (response.data && response.data.result) {
                    break;
                }
            } catch (err) {
                console.log(`API ${apiIndex} failed: ${err.message}`);
                apiIndex++;
            }
        }
        
        // If all APIs fail, use local font generator
        if (!response || !response.data || !response.data.result) {
            console.log("All APIs failed, using local font generator");
            const fonts = generateFancyFontsLocally(text);
            const resultText = `✨ *MAD-MAX Fancy Fonts* ✨\n\n${fonts}\n\n> Powered By 404unkon`;
            
            await sock.sendMessage(chatId, {
                text: resultText,
                ...global.channelInfo
            }, { quoted: message });
            
            await sock.sendMessage(chatId, { 
                react: { text: '✅', key: message.key } 
            });
            return;
        }

        // Format the response from API
        let fonts;
        if (Array.isArray(response.data.result)) {
            fonts = response.data.result.slice(0, 10).map((item, index) => 
                `*Font ${index + 1}:*\n\`\`\`${item}\`\`\``
            ).join("\n\n");
        } else if (typeof response.data.result === 'object') {
            fonts = Object.entries(response.data.result).slice(0, 10).map(([name, font]) => 
                `*${name}:*\n\`\`\`${font}\`\`\``
            ).join("\n\n");
        } else {
            fonts = `*Result:*\n\`\`\`${response.data.result}\`\`\``;
        }
        
        const resultText = `✨ *MAD-MAX Fancy Fonts Converter* ✨\n\n${fonts}\n\n> Powered By 404unkon`;

        await sock.sendMessage(chatId, {
            text: resultText,
            ...global.channelInfo
        }, { quoted: message });

        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error("❌ Error in fancy command:", error);
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
        await sock.sendMessage(chatId, {
            text: "⚠️ An error occurred while fetching fonts. Using local generator...",
            ...global.channelInfo
        }, { quoted: message });
        
        // Fallback to local generator
        const text = args.join(' ').trim();
        const fonts = generateFancyFontsLocally(text);
        const resultText = `✨ *MAD-MAX Fancy Fonts (Local)* ✨\n\n${fonts}\n\n> Powered By 404unkon`;
        
        await sock.sendMessage(chatId, {
            text: resultText,
            ...global.channelInfo
        }, { quoted: message });
    }
}

// Local fancy font generator (fallback)
function generateFancyFontsLocally(text) {
    const fonts = {
        "Small Caps": text.toUpperCase().split('').map(c => {
            const smallCaps = {
                'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ',
                'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ',
                'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 'ꜱ', 'T': 'ᴛ', 'U': 'ᴜ',
                'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
            };
            return smallCaps[c] || c;
        }).join(''),
        
        "Bubble": text.split('').map(c => {
            const bubble = {
                'a': '🅐', 'b': '🅑', 'c': '🅒', 'd': '🅓', 'e': '🅔', 'f': '🅕', 'g': '🅖',
                'h': '🅗', 'i': '🅘', 'j': '🅙', 'k': '🅚', 'l': '🅛', 'm': '🅜', 'n': '🅝',
                'o': '🅞', 'p': '🅟', 'q': '🅠', 'r': '🅡', 's': '🅢', 't': '🅣', 'u': '🅤',
                'v': '🅥', 'w': '🅦', 'x': '🅧', 'y': '🅨', 'z': '🅩',
                'A': '🅐', 'B': '🅑', 'C': '🅒', 'D': '🅓', 'E': '🅔', 'F': '🅕', 'G': '🅖',
                'H': '🅗', 'I': '🅘', 'J': '🅙', 'K': '🅚', 'L': '🅛', 'M': '🅜', 'N': '🅝',
                'O': '🅞', 'P': '🅟', 'Q': '🅠', 'R': '🅡', 'S': '🅢', 'T': '🅣', 'U': '🅤',
                'V': '🅥', 'W': '🅦', 'X': '🅧', 'Y': '🅨', 'Z': '🅩'
            };
            return bubble[c] || c;
        }).join(''),
        
        "Square": text.toUpperCase().split('').map(c => {
            const square = {
                'A': '🄰', 'B': '🄱', 'C': '🄲', 'D': '🄳', 'E': '🄴', 'F': '🄵', 'G': '🄶',
                'H': '🄷', 'I': '🄸', 'J': '🄹', 'K': '🄺', 'L': '🄻', 'M': '🄼', 'N': '🄽',
                'O': '🄾', 'P': '🄿', 'Q': '🅀', 'R': '🅁', 'S': '🅂', 'T': '🅃', 'U': '🅄',
                'V': '🅅', 'W': '🅆', 'X': '🅇', 'Y': '🅈', 'Z': '🅉'
            };
            return square[c] || c;
        }).join(''),
        
        "Monospace": text.split('').map(c => {
            const mono = {
                'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎', 'f': '𝚏', 'g': '𝚐',
                'h': '𝚑', 'i': '𝚒', 'j': '𝚓', 'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗',
                'o': '𝚘', 'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝', 'u': '𝚞',
                'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢', 'z': '𝚣',
                'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶',
                'H': '𝙷', 'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽',
                'O': '𝙾', 'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄',
                'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉'
            };
            return mono[c] || c;
        }).join(''),
        
        "Cursive": text.split('').map(c => {
            const cursive = {
                'a': '𝒶', 'b': '𝒷', 'c': '𝒸', 'd': '𝒹', 'e': '𝑒', 'f': '𝒻', 'g': '𝑔',
                'h': '𝒽', 'i': '𝒾', 'j': '𝒿', 'k': '𝓀', 'l': '𝓁', 'm': '𝓂', 'n': '𝓃',
                'o': '𝑜', 'p': '𝓅', 'q': '𝓆', 'r': '𝓇', 's': '𝓈', 't': '𝓉', 'u': '𝓊',
                'v': '𝓋', 'w': '𝓌', 'x': '𝓍', 'y': '𝓎', 'z': '𝓏',
                'A': '𝒜', 'B': '𝐵', 'C': '𝒞', 'D': '𝒟', 'E': '𝐸', 'F': '𝐹', 'G': '𝒢',
                'H': '𝐻', 'I': '𝐼', 'J': '𝒥', 'K': '𝒦', 'L': '𝐿', 'M': '𝑀', 'N': '𝒩',
                'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': '𝑅', 'S': '𝒮', 'T': '𝒯', 'U': '𝒰',
                'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵'
            };
            return cursive[c] || c;
        }).join('')
    };
    
    return Object.entries(fonts).map(([name, font]) => 
        `*${name}:*\n\`\`\`${font}\`\`\``
    ).join("\n\n");
}

module.exports = {
    fancy
};