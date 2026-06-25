// discord-notify.js
const https = require('https');
const { URL } = require('url');

async function sendPasswordResetToDiscord(email, code, username) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.log('⚠️ Discord webhook URL not configured');
        return;
    }
    
    const now = new Date().toLocaleString('en-PH', { 
        timeZone: 'Asia/Manila',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    
    const payload = JSON.stringify({
        embeds: [{
            title: '🔑 Password Reset Request',
            color: 0x0a246a,
            fields: [
                { name: '👤 User', value: username || 'Unknown', inline: true },
                { name: '📧 Email', value: email, inline: true },
                { name: '🔢 Reset Code', value: `**${code}**`, inline: false },
                { name: '⏰ Expires', value: '15 minutes', inline: true },
                { name: '🕐 Requested', value: now, inline: true }
            ],
            footer: { text: 'EDPtech Helpdesk v2.0 • Password Reset System' },
            timestamp: new Date().toISOString()
        }]
    });
    
    const url = new URL(webhookUrl);
    
    const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 204 || res.statusCode === 200) {
                    console.log('✅ Reset code sent to Discord');
                    resolve();
                } else {
                    console.error('❌ Discord webhook failed:', res.statusCode, data);
                    reject(new Error(`Status: ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Discord webhook error:', error.message);
            reject(error);
        });
        
        req.write(payload);
        req.end();
    });
}

module.exports = { sendPasswordResetToDiscord };