const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let isClientReady = false;
let targetGroupId = null;
const INVITE_CODE = "G4XPZGakOYH8zHhlsp5WiC";

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "agneya-bot" }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        headless: true
    }
});

client.on('qr', (qr) => {
    console.log('--- WHATSAPP BOT LOGIN ---');
    console.log('Scan the QR code below to link WhatsApp (9656353903):');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ WhatsApp Bot is ready and authenticated!');
    isClientReady = true;

    try {
        targetGroupId = await client.acceptInvite(INVITE_CODE);
        console.log('🟢 Successfully joined/found target group! Target ID:', targetGroupId);
    } catch (error) {
        console.log('⚠️ Could not join group (maybe already joined?). Attempting to find group in chats.');
        const chats = await client.getChats();
        const groupChat = chats.find(chat => chat.isGroup && chat.name.toLowerCase().includes('agneya'));
        if (groupChat) {
            targetGroupId = groupChat.id._serialized;
            console.log('🟢 Found Target Group from Existing Chats:', targetGroupId);
        } else {
            console.log('❌ Failed to find the Agneya target group automatically.');
        }
    }
});

client.initialize().catch(err => console.error("❌ Could not initialize WhatsApp client:", err));

const sendWhatsAppNotification = async (orderData) => {
    if (!isClientReady || !targetGroupId) {
        console.log("⚠️ WhatsApp client is not ready or target group not found. Skipping notification.");
        return;
    }

    try {
        const { order, customer, items, totalAmount } = orderData;
        const gstInfo = order.gstDetails?.gstNumber ? `\nGST No: ${order.gstDetails.gstNumber}` : '';
        const orderTypeStr = order.orderType ? `\nType: ${order.orderType}` : '';
        
        // Check if any item has manual attachments
        const hasManual = items.some(item => item.customData?.mode === 'manual' || item.customData?.manualAttachments?.length > 0);
        const designTag = hasManual ? '\n🎨 *Style: Manual Design Assets Attached*' : (order.orderType === 'Custom' ? '\n🎨 *Style: 3D Studio Design*' : '');

        const message = `📦 *പുതിയ ഓർഡർ!* 🚀\n\nID: ${order.orderId || order._id}${orderTypeStr}${designTag}\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nModel: ${items[0]?.name || 'N/A'}\n*Total:* ₹${totalAmount.toLocaleString('en-IN')}${gstInfo}\n\nAddress: ${customer.shippingAddress}`;
        
        await client.sendMessage(targetGroupId, message);
        console.log(`✅ WhatsApp notification sent successfully for order ${order.orderId || order._id}`);
    } catch (error) {
        console.error("❌ Error sending WhatsApp notification:", error);
    }
};

const sendBulkInquiryNotification = async (inquiryData) => {
    if (!isClientReady || !targetGroupId) {
        console.log("⚠️ WhatsApp client is not ready. Skipping bulk inquiry notification.");
        return;
    }

    try {
        const message = `🏢 *പുതിയ ബൾക്ക് എൻക്വയറി!* 🚀\n\nName: ${inquiryData.contactName}\nCompany: ${inquiryData.companyName || 'N/A'}\nPhone: ${inquiryData.phone}\nEmail: ${inquiryData.email}\nProduct: ${inquiryData.productOfInterest}\nEst. Qty: ${inquiryData.estimatedQuantity}\nMessage: ${inquiryData.message}`;
        
        await client.sendMessage(targetGroupId, message);
        console.log(`✅ WhatsApp bulk notification sent for ${inquiryData.contactName}`);
    } catch (error) {
        console.error("❌ Error sending WhatsApp bulk notification:", error);
    }
};

module.exports = {
    client,
    sendWhatsAppNotification,
    sendBulkInquiryNotification
};
