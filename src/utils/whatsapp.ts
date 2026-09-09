/**
 * WhatsApp 1-Click Direct Notification Helper
 * 100% Free - Generates instant direct chat link with pre-formatted message
 */

export const sanitizePhone = (phone?: string): string => {
  if (!phone) return '';
  // Remove spaces, hyphens, plus, parenthesis
  let clean = phone.replace(/[\s\-\+\(\)]/g, '');
  // If 10 digits without country code, prepend India's 91
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
};

export const openWhatsApp = (phone: string, message: string) => {
  const cleanNumber = sanitizePhone(phone);
  if (!cleanNumber) {
    alert('Customer mobile number is not available or invalid.');
    return;
  }
  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${cleanNumber}?text=${encodedText}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

export const whatsappTemplates = {
  // 1. Monthly Payment Reminder
  paymentReminder: (customerName: string, amount: number | string, upiId: string = 'shivamstm01@kotak') => {
    return `Namaste ${customerName || 'Customer'} ji 🙏\n\n` +
      `🍱 *TIFFIN SERVICE - MONTHLY BILL REMINDER*\n` +
      `-----------------------------------------\n` +
      `Aapka is mahine ka total pending tiffin bill: *Rs. ${Number(amount).toFixed(2)}* hai.\n\n` +
      `💳 *Payee Details:*\n` +
      `• Name: *Shivam Kumar*\n` +
      `• Kotak UPI: *${upiId}*\n` +
      `• PhonePe UPI: *shivamstm01@ybl*\n` +
      `• Amazon Pay: *6201763368@apl*\n` +
      `• CRED UPI: *6201763368@yescred*\n\n` +
      `📲 Payment karne ke baad portal par *UTR Number* submit karein ya is WhatsApp par receipt screenshot bhej dein. Dhanyawad! ✨`;
  },

  // 2. Request Approved
  requestApproved: (customerName: string, serviceDate: string, mealType: string) => {
    return `Namaste ${customerName || 'Customer'} ji 🙏\n\n` +
      `✅ *TIFFIN REQUEST APPROVED*\n` +
      `-----------------------------------------\n` +
      `Aapki tiffin request approve ho gayi hai:\n` +
      `📅 *Date:* ${serviceDate}\n` +
      `🍱 *Meal Type:* ${mealType}\n` +
      `🚀 *Status:* Approved & Preparing\n\n` +
      `Aapka tiffin time par deliver ho jayega. Dhanyawad! 🍱✨`;
  },

  // 3. Request Rejected
  requestRejected: (customerName: string, serviceDate: string, reason?: string) => {
    return `Namaste ${customerName || 'Customer'} ji 🙏\n\n` +
      `⚠️ *TIFFIN REQUEST UPDATE*\n` +
      `-----------------------------------------\n` +
      `Aapki *${serviceDate}* ki tiffin request admin dwara decline ki gayi hai.\n` +
      (reason ? `📌 *Reason:* ${reason}\n\n` : '\n') +
      `Kisi bhi query ke liye aap direct contact kar sakte hain. Dhanyawad!`;
  },

  // 4. Payment Verified & Approved
  paymentVerified: (customerName: string, amount: number | string, utr?: string) => {
    return `Namaste ${customerName || 'Customer'} ji 🙏\n\n` +
      `🎉 *PAYMENT RECEIVED & VERIFIED*\n` +
      `-----------------------------------------\n` +
      `Aapka payment successfully verify aur approve ho gaya hai:\n` +
      `💰 *Amount:* Rs. ${Number(amount).toFixed(2)}\n` +
      (utr ? `🔢 *UTR / Ref:* ${utr}\n` : '') +
      `✅ *Status:* Settled & Account Updated\n\n` +
      `Tiffin service use karne ke liye dhanyawad! 🙏✨`;
  },

  // 5. User to Admin Help / Order
  userHelp: () => {
    return `Namaste Shivam ji 🙏\nMujhe Tiffin Service ke regarding query / payment ke liye contact karna hai.`;
  }
};