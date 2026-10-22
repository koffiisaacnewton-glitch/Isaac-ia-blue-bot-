const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const express = require('express')
const qrcode = require('qrcode')
const P = require('pino')

const app = express()
let qrCodeData = ''
let isConnected = false

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        browser: ['Isaac IA Bleu', 'Chrome', '1.0']
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) { qrCodeData = qr; console.log('QR généré') }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : 0) !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            isConnected = true
            console.log('🔵 Isaac IA Bleu Connecté !')
        }
    })
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const lower = text.toLowerCase()
        if (lower.includes('salut') || lower.includes('bonjour') || lower.includes('hello')) {
            await sock.sendMessage(from, { text: '🔵 Salut ! C’est Isaac IA Bleu 🤖\nJe suis le bot flou intelligent de Koffi Isaac Newton !\n\nTape *menu* pour voir mes commandes.' })
        }
        else if (lower === 'menu' || lower === 'aide') {
            await sock.sendMessage(from, { text: `🔵 *ISAAC IA BLEU - MENU*\n\n🔹 *menu* - voir ce menu\n🔹 *isaac* - qui est Isaac ?\n🔹 *blague* - une blague flou\n🔹 *citation* - citation motivante\n🔹 *heure* - heure actuelle\n🔹 *bot* - infos du bot\n\n🔵 Créé par Koffi Isaac Newton` })
        }
        else if (lower.includes('isaac')) {
            await sock.sendMessage(from, { text: '🔵 Koffi Isaac Newton c’est le boss ! Développeur, créateur de Isaac IA Bleu. Le bot le plus flou et intelligent de Abidjan 🇨🇮' })
        }
        else if (lower.includes('blague')) {
            const blagues = ['Pourquoi les poissons détestent l’ordi ? Parce qu’ils ont peur du net ! 😂', 'C’est Isaac qui rentre dans un bar... le bar bug ! 🔵', 'Flou c’est flou ! Mais IA c’est intelligent !']
            await sock.sendMessage(from, { text: `😂 ${blagues[Math.floor(Math.random()*blagues.length)]}` })
        }
        else if (lower.includes('citation')) {
            await sock.sendMessage(from, { text: '🔵 "Le flou c’est l’avenir, l’IA c’est maintenant." - Isaac Newton' })
        }
        else if (lower.includes('heure')) {
            await sock.sendMessage(from, { text: `🔵 Il est ${new Date().toLocaleTimeString('fr-FR', {timeZone: 'Africa/Abidjan'})} à Abidjan 🇨🇮` })
        }
        else {
            await sock.sendMessage(from, { text: `🔵 J’ai reçu: "${text}"\nTape *menu* !` })
        }
    })
}

app.get('/', async (req, res) => {
    if (isConnected) return res.send('<h1 style="color:blue">🔵 Isaac IA Bleu CONNECTÉ !</h1>')
    if (!qrCodeData) return res.send('<h1>⏳ Génération QR... actualise dans 5s</h1><script>setTimeout(()=>location.reload(),5000)</script>')
    const qrImage = await qrcode.toDataURL(qrCodeData)
    res.send(`<body style="text-align:center;font-family:Arial"><h1 style="color:blue">🔵 ISAAC IA BLEU - SCANNE LE QR</h1><img src="${qrImage}" style="width:300px"><br><p>WhatsApp > Appareils liés > Lier un appareil</p><script>setTimeout(()=>location.reload(),10000)</script></body>`)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Serveur sur ${PORT}`))
startBot()
