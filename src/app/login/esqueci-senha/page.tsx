import { FormEsqueciSenha } from "./FormEsqueciSenha";

export default function EsqueciSenhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <h1 className="titulo text-[34px]">Gaia</h1>
          <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-carmim-suave">
            Esqueci minha senha
          </p>
        </div>
        <div className="cartao px-6 py-7">
          <FormEsqueciSenha />
        </div>
        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-faint">
          Só contas de mestre têm senha. Se o usuário informado for de mestre, enviamos um
          link de redefinição por e-mail.
        </p>
      </div>
    </main>
  );
}
