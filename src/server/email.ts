import "server-only";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/format";

type Email = { to: string; subject: string; html: string; text: string };

/**
 * Transactional email. Uses Resend's HTTP API when RESEND_API_KEY is set,
 * otherwise logs to the server console (development). Failures never break checkout.
 */
export async function sendEmail(email: Email) {
  if (!env.resendApiKey) {
    console.info(`[email:dev] To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: email.to, subject: email.subject, html: email.html, text: email.text }),
    });
    if (!res.ok) console.error("[email] send failed", res.status, await res.text());
  } catch (err) {
    console.error("[email] send error", err);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function orderConfirmationEmail(order: {
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  items: { name: string; quantity: number; total: number }[];
  url: string;
}): Omit<Email, "to"> {
  const lines = order.items.map((i) => `${i.quantity} × ${i.name} — ${formatPrice(i.total)}`);
  const text = [
    `Hi ${order.customerName},`,
    "",
    `Thanks for your order ${order.orderNumber}. We'll let you know when it ships.`,
    "",
    ...lines,
    "",
    `Total: ${formatPrice(order.total)} (${order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"})`,
    "",
    `View your order: ${order.url}`,
  ].join("\n");
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111827;max-width:560px">
    <h1 style="font-size:20px">Thanks for your order, ${escapeHtml(order.customerName)}</h1>
    <p>Order <strong>${escapeHtml(order.orderNumber)}</strong> is confirmed. We'll email you when it ships.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${order.items
        .map(
          (i) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${i.quantity} × ${escapeHtml(i.name)}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right">${formatPrice(i.total)}</td></tr>`,
        )
        .join("")}
      <tr><td style="padding:12px 0;font-weight:600">Total</td><td style="padding:12px 0;text-align:right;font-weight:600">${formatPrice(order.total)}</td></tr>
    </table>
    <p><a href="${escapeHtml(order.url)}" style="background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">View order</a></p>
  </div>`;
  return { subject: `Order ${order.orderNumber} confirmed`, html, text };
}
