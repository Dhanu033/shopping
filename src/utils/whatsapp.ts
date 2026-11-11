export const DEFAULT_WHATSAPP_NUMBER = '919876543210';
export const WHATSAPP_STORAGE_KEY = 'lakshmi_tassels_whatsapp_number_v1';

export const cleanPhoneForWhatsApp = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};

export const formatWhatsAppOrderUrl = ({
  phone,
  lookNumber,
  lookTitle,
  pieceName,
  price,
  length,
  sareeFabric,
  imageUrl,
  customerName,
  customerNotes,
}: {
  phone: string;
  lookNumber?: number;
  lookTitle?: string;
  pieceName: string;
  price: string;
  length?: string;
  sareeFabric?: string;
  imageUrl?: string;
  customerName?: string;
  customerNotes?: string;
}): string => {
  const cleanNumber = cleanPhoneForWhatsApp(phone) || DEFAULT_WHATSAPP_NUMBER;

  let text = `✨ *LAKSHMI TASSELS — BESPOKE ORDER* ✨\n`;
  text += `--------------------------------------\n`;
  if (lookNumber) {
    text += `👑 *Ensemble*: Look ${lookNumber}${lookTitle ? ` · ${lookTitle}` : ''}\n`;
  }
  text += `🪡 *Tassel Item*: ${pieceName}\n`;
  text += `💰 *Price*: ${price}\n`;
  if (length) {
    text += `📏 *Tassel Length*: ${length}\n`;
  }
  if (sareeFabric) {
    text += `🧵 *Saree Fabric*: ${sareeFabric}\n`;
  }
  if (customerName) {
    text += `👤 *Customer Name*: ${customerName}\n`;
  }
  if (customerNotes) {
    text += `📝 *Custom Request*: ${customerNotes}\n`;
  }
  if (imageUrl) {
    if (imageUrl.startsWith('data:')) {
      text += `📸 *Saree & Tassel Design*: Attached by customer\n`;
    } else {
      text += `📸 *Design Image Preview*: ${imageUrl}\n`;
    }
  }
  text += `--------------------------------------\n`;
  text += `Please confirm my order booking, custom color match, and handcrafting timeframe.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
};

// Helper to copy an image to clipboard if possible
export const copyImageToClipboard = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    // Convert to PNG if needed for clipboard
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard write image not supported or failed', e);
  }
  return false;
};
