const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

// Function to clear a single directory (only if it exists)
function clearDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            // Return success even if directory doesn't exist (it's already "clean")
            return { 
                success: true, 
                message: `Directory does not exist: ${path.basename(dirPath)}`, 
                exists: false,
                count: 0 
            };
        }
        
        const files = fs.readdirSync(dirPath);
        
        // If directory is empty
        if (files.length === 0) {
            return { 
                success: true, 
                message: `Directory already empty: ${path.basename(dirPath)}`, 
                exists: true,
                count: 0 
            };
        }
        
        let deletedCount = 0;
        let errors = 0;
        
        for (const file of files) {
            try {
                const filePath = path.join(dirPath, file);
                const stat = fs.lstatSync(filePath);
                
                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
                deletedCount++;
            } catch (err) {
                errors++;
                console.error(`Error deleting ${file}:`, err.message);
            }
        }
        
        return { 
            success: errors === 0, 
            message: `Cleared ${deletedCount} files in ${path.basename(dirPath)}${errors > 0 ? ` (${errors} errors)` : ''}`, 
            exists: true,
            count: deletedCount,
            errors: errors
        };
    } catch (error) {
        console.error('Error in clearDirectory:', error);
        return { 
            success: false, 
            message: `Failed to clear ${path.basename(dirPath)}`, 
            error: error.message,
            exists: false,
            count: 0 
        };
    }
}

// Function to clear both tmp and temp directories (only if they exist)
async function clearTmpDirectory() {
    const baseDir = process.cwd();
    const tmpDir = path.join(baseDir, 'tmp');
    const tempDir = path.join(baseDir, 'temp');
    
    const results = [];
    results.push(clearDirectory(tmpDir));
    results.push(clearDirectory(tempDir));
    
    // Filter to only show results for directories that exist or had files
    const existingResults = results.filter(r => r.exists || r.count > 0);
    
    if (existingResults.length === 0) {
        return { 
            success: true, 
            message: '✅ No temporary directories found to clean.',
            count: 0 
        };
    }
    
    // Check if all operations were successful
    const success = existingResults.every(r => r.success);
    const totalDeleted = existingResults.reduce((sum, r) => sum + (r.count || 0), 0);
    
    // Create a user-friendly message
    let message = '🧹 *Temporary Files Cleanup:*\n\n';
    
    for (const result of existingResults) {
        if (result.exists) {
            message += `• ${result.message}\n`;
        }
    }
    
    if (totalDeleted > 0) {
        message += `\n✅ Total cleaned: ${totalDeleted} files`;
    } else {
        message += `\n✅ Already clean!`;
    }
    
    return { 
        success, 
        message, 
        count: totalDeleted,
        details: existingResults
    };
}

// Function to handle manual command
async function clearTmpCommand(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command is only available for the owner!' 
            });
            return;
        }

        // Send processing indicator
        await sock.sendMessage(chatId, { 
            react: { text: '⏳', key: msg.key } 
        });

        const result = await clearTmpDirectory();
        
        // Remove reaction and send result
        await sock.sendMessage(chatId, { 
            react: { text: result.success ? '✅' : '❌', key: msg.key } 
        });
        
        await sock.sendMessage(chatId, { 
            text: result.message 
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in cleartmp command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to clear temporary files!' 
        }, { quoted: msg });
    }
}

// Start automatic clearing every 6 hours (only if directories exist)
function startAutoClear() {
    console.log('[🧹] Starting automatic temporary file cleanup...');
    
    // Check which directories exist
    const baseDir = process.cwd();
    const tmpDir = path.join(baseDir, 'tmp');
    const tempDir = path.join(baseDir, 'temp');
    
    const directories = [];
    if (fs.existsSync(tmpDir)) directories.push('tmp');
    if (fs.existsSync(tempDir)) directories.push('temp');
    
    if (directories.length === 0) {
        console.log('[🧹] No temporary directories found (tmp/ or temp/)');
        return;
    }
    
    console.log(`[🧹] Will clean: ${directories.join(', ')} every 6 hours`);
    
    // Run immediately on startup
    clearTmpDirectory().then(result => {
        if (result.count > 0) {
            console.log(`[🧹] Initial cleanup: ${result.count} files deleted`);
        } else {
            console.log('[🧹] Initial cleanup: No files to delete');
        }
    }).catch(err => {
        console.error('[🧹] Initial cleanup error:', err.message);
    });

    // Set interval for every 6 hours
    setInterval(async () => {
        try {
            const result = await clearTmpDirectory();
            if (result.count > 0) {
                console.log(`[🧹] Auto cleanup: ${result.count} files deleted`);
            }
        } catch (err) {
            console.error('[🧹] Auto cleanup error:', err.message);
        }
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
}

// Start the automatic clearing
startAutoClear();

module.exports = clearTmpCommand;