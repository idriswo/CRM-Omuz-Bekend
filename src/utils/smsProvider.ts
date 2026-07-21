// Stub — то пайваст кардани провайдери воқеӣ (масалан Osonsms.com) тавассути SMS_API_KEY дар .env
export const smsProvider = {
  async send(phone: string, message: string) {
    console.log(`[SMS stub] -> ${phone}: ${message}`);
  },
};
