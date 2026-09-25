import "server-only";

/** Server-only environment access. Secrets never leave this module's callers. */
export const env = {
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  },
  get authSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
      }
      return "development-only-insecure-secret-change-me-please!!";
    }
    return secret;
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  razorpay: {
    get keyId() {
      return process.env.RAZORPAY_KEY_ID || "";
    },
    get keySecret() {
      return process.env.RAZORPAY_KEY_SECRET || "";
    },
    get webhookSecret() {
      return process.env.RAZORPAY_WEBHOOK_SECRET || "";
    },
    get configured() {
      return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    },
  },
  cloudinary: {
    get cloudName() {
      return process.env.CLOUDINARY_CLOUD_NAME || "";
    },
    get apiKey() {
      return process.env.CLOUDINARY_API_KEY || "";
    },
    get apiSecret() {
      return process.env.CLOUDINARY_API_SECRET || "";
    },
    get folder() {
      return process.env.CLOUDINARY_UPLOAD_FOLDER || "renewbyte/products";
    },
    get configured() {
      return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
      );
    },
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY || "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "RenewByte <orders@example.com>";
  },
  get cronSecret() {
    return process.env.CRON_SECRET || "";
  },
};
