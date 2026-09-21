import { Resend } from "resend";

const EMAIL_DESTINO_REDEFINICAO = process.env.EMAIL_REDEFINICAO_SENHA || "vinigusilva@gmail.com";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurada.");
  return new Resend(key);
}

export async function enviarEmailRedefinicaoSenha(link: string) {
  await client().emails.send({
    from: "Gaia: O Prelúdio <onboarding@resend.dev>",
    to: EMAIL_DESTINO_REDEFINICAO,
    subject: "Redefinição de senha — Gaia: O Prelúdio",
    html: `
      <p>Foi solicitada a redefinição da senha de mestre na ferramenta de mesa.</p>
      <p><a href="${link}">Clique aqui para escolher uma nova senha</a>.</p>
      <p>O link expira em 1 hora. Se você não pediu isso, ignore este e-mail.</p>
    `,
  });
}
