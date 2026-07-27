import nodemailer, { Transporter } from "nodemailer";

/**
 * Фиристодани email. Ду провайдер дастгирӣ мешавад — кадомаш интихоб шудан
 * аз .env вобаста аст (ниг. `mailProvider()`):
 *
 *   brevo — HTTP API, порти 443. Провайдери асосӣ барои production.
 *     BREVO_API_KEY   — калид аз brevo.com → SMTP & API → API Keys (бо "xkeysib-" сар мешавад)
 *     MAIL_FROM_EMAIL — суроғаи фиристанда. Бояд дар Brevo ҳамчун sender ТАСДИҚ шуда бошад
 *                       (Senders → Add a sender → пайванди тасдиқ ба ҳамон почта меояд).
 *                       Суроғаи оддии Gmail мешавад — домени худӣ лозим нест.
 *     MAIL_FROM_NAME  — номи фиристанда (пешфарз "Omuz CRM")
 *
 *   gmail — SMTP, порти 587. Танҳо барои dev дар компютери худӣ.
 *     GMAIL_USER         — суроғаи Gmail
 *     GMAIL_APP_PASSWORD — App Password-и 16-аломата (Google Account → Security →
 *                          2-Step Verification → App passwords). Пароли оддӣ кор намекунад.
 *
 * ⚠️ Чаро Gmail дар Render кор намекунад: плани Free-и Render трафики
 * бароварданиро дар портҳои 25/465/587 мебандад, бинобар ин ҳар пайванди SMTP
 * дар production ноком мешавад — гарчанде локалӣ бе мушкил кор мекунад. Brevo
 * тавассути HTTPS мефиристад, ки баста нест.
 *
 * Чаро маҳз Brevo: ройгон 300 email/рӯз ва барои фиристодан ба ҳар кас домени
 * худӣ лозим нест — тасдиқи як суроға кифоя аст. (Барои муқоиса: Resend бе
 * домени тасдиқшуда танҳо ба email-и худи соҳиби ҳисоб мефиристад.)
 *
 * Агар ҳеҷ як провайдер танзим нашуда бошад, барнома дар режими stub кор
 * мекунад: паёмҳо танҳо ба лог мераванд. Ин барои тест лозим аст — вагарна
 * ҳар иҷрои тест лимити рӯзонаро сарф мекард.
 */

/**
 * Google App Password-ро дар шакли "abcd efgh ijkl mnop" нишон медиҳад ва
 * одатан ҳамон тавр нусхабардорӣ мешавад. SMTP фосиларо қабул намекунад,
 * бинобар ин ин ҷо тоза мешавад — то корбар бо форматкунӣ ҷанг накунад.
 */
const appPassword = () => (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");

export type MailProvider = "brevo" | "gmail" | "stub";

/**
 * Brevo аввалин аст: агар ҳарду танзим шуда бошанд, ҳамон интихоб мешавад,
 * то дар production тасодуфан ба SMTP-и басташуда наафтем.
 */
export function mailProvider(): MailProvider {
  if (process.env.BREVO_API_KEY) return "brevo";
  if (process.env.GMAIL_USER && appPassword()) return "gmail";
  return "stub";
}

export const mailEnabled = () => mailProvider() !== "stub";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: appPassword(),
      },
    });
  }
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  /** Варианти матнӣ барои почтаҳое, ки HTML нишон намедиҳанд. */
  text?: string;
}

/**
 * Танҳо ҳамин функсия ба API-и Brevo вобаста аст. Барои гузаштан ба
 * провайдери дигар (Resend, SendGrid) ҳаминро иваз кардан кифоя аст.
 */
async function sendViaBrevo({ to, subject, html, text }: MailMessage): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY as string,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.MAIL_FROM_NAME || "Omuz CRM",
        email: process.env.MAIL_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    // Бе ин як дархости овезон сохтани корбарро дар frontend мунтазир мемонад
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    // Матни хатои Brevo фаҳмо аст ("sender not valid", "unauthorized" ва ғ.) —
    // онро тавре мегузорем, то дар email_error ба корманд расад
    throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

async function sendViaGmail({ to, subject, html, text }: MailMessage): Promise<void> {
  const fromName = process.env.MAIL_FROM_NAME || "Omuz CRM";
  await getTransporter().sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
}

/**
 * Ҳангоми нарасидани паём хато мепартояд — даъваткунанда аз рӯи он
 * failed_count мешуморад ва фиристодани боқимондаро бекор намекунад.
 */
export async function sendEmail({ to, subject, html, text }: MailMessage): Promise<void> {
  const message: MailMessage = { to, subject, html, text: text ?? stripHtml(html) };

  switch (mailProvider()) {
    case "brevo":
      return sendViaBrevo(message);
    case "gmail":
      return sendViaGmail(message);
    default:
      console.log(`[MAIL stub] -> ${to} | ${subject}\n${message.text}`);
  }
}

/** Варианти матнии содда аз HTML — барои `text` ва логи режими stub. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Матни воридотии корбарро бехатар ба HTML мегузорад. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== Шаблонҳо =====

const BRAND = "#1677ff";

/** Пӯшиши умумии ҳамаи email-ҳо. */
function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f1f1f;">
  <table role="presentation" style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border-collapse:collapse;">
    <tr><td style="background:${BRAND};padding:20px 28px;">
      <span style="color:#fff;font-size:18px;font-weight:600;">Omuz CRM</span>
    </td></tr>
    <tr><td style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">${esc(title)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:16px 28px;background:#fafafa;color:#8c8c8c;font-size:12px;">
      Ин паёми худкор аст — ба он ҷавоб надиҳед.
    </td></tr>
  </table>
</body></html>`;
}

/** Логин ва пароли ҳисоби нав. */
export function credentialsEmail(params: {
  full_name?: string | null;
  email: string;
  password: string;
}): MailMessage {
  const greeting = params.full_name ? `${esc(params.full_name)}, салом!` : "Салом!";
  const html = layout(
    "Ҳисоби шумо кушода шуд",
    `<p style="margin:0 0 16px;line-height:1.6;">${greeting}<br>
      Барои шумо дар системаи Omuz CRM ҳисоб кушода шуд. Бо ин маълумот ворид шавед:</p>
     <table role="presentation" style="width:100%;border-collapse:collapse;background:#f5f7fa;border-radius:8px;">
       <tr><td style="padding:12px 16px;color:#595959;font-size:13px;">Логин</td>
           <td style="padding:12px 16px;font-weight:600;font-family:ui-monospace,Consolas,monospace;">${esc(params.email)}</td></tr>
       <tr><td style="padding:12px 16px;color:#595959;font-size:13px;border-top:1px solid #e8e8e8;">Парол</td>
           <td style="padding:12px 16px;font-weight:600;font-family:ui-monospace,Consolas,monospace;border-top:1px solid #e8e8e8;">${esc(params.password)}</td></tr>
     </table>
     <p style="margin:16px 0 0;line-height:1.6;color:#d4380d;">
       Пас аз аввалин ворид шудан паролро ҳатман иваз кунед — то он вақт
       дастрасии шумо маҳдуд аст.</p>`
  );
  return {
    to: params.email,
    subject: "Ҳисоби шумо дар Omuz CRM",
    html,
    text:
      `${params.full_name ? params.full_name + ", " : ""}ҳисоби шумо дар Omuz CRM кушода шуд.\n` +
      `Логин: ${params.email}\nПарол: ${params.password}\n` +
      `Пас аз аввалин ворид шудан паролро иваз кунед.`,
  };
}

/** Коди 6-рақамаи барқарорсозии парол. */
export function resetCodeEmail(params: {
  full_name?: string | null;
  email: string;
  code: string;
  ttl_minutes: number;
}): MailMessage {
  const greeting = params.full_name ? `${esc(params.full_name)}, салом!` : "Салом!";
  const html = layout(
    "Барқарорсозии парол",
    `<p style="margin:0 0 16px;line-height:1.6;">${greeting}<br>
      Барои таъини паролии нав ин кодро ворид кунед:</p>
     <div style="text-align:center;background:#f5f7fa;border-radius:8px;padding:20px;">
       <span style="font-size:32px;font-weight:700;letter-spacing:6px;font-family:ui-monospace,Consolas,monospace;">${esc(params.code)}</span>
     </div>
     <p style="margin:16px 0 0;line-height:1.6;color:#595959;">
       Код <strong>${params.ttl_minutes} дақиқа</strong> эътибор дорад ва танҳо як бор кор мекунад.</p>
     <p style="margin:12px 0 0;line-height:1.6;color:#8c8c8c;font-size:13px;">
       Агар шумо ин дархостро нафиристода бошед, ин паёмро сарфи назар кунед — парол бетағйир мемонад.</p>`
  );
  return {
    to: params.email,
    subject: `Коди барқарорсозии парол: ${params.code}`,
    html,
    text:
      `Коди барқарорсозии парол: ${params.code}\n` +
      `Код ${params.ttl_minutes} дақиқа эътибор дорад ва танҳо як бор кор мекунад.`,
  };
}

/** Паёми озод — барои фиристодани оммавӣ аз модули /api/email. */
export function plainEmail(params: { to: string; subject: string; body: string }): MailMessage {
  const html = layout(
    params.subject,
    `<div style="line-height:1.7;white-space:pre-wrap;">${esc(params.body)}</div>`
  );
  return { to: params.to, subject: params.subject, html, text: params.body };
}
