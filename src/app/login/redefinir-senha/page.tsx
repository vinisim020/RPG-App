import { FormRedefinirSenha } from "./FormRedefinirSenha";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <h1 className="titulo text-[34px]">Gaia</h1>
          <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-carmim-suave">
            Nova senha
          </p>
        </div>
        <div className="cartao px-6 py-7">
          {token ? (
            <FormRedefinirSenha token={token} />
          ) : (
            <p className="text-[13px] text-carmim-luz">Link inválido: token ausente.</p>
          )}
        </div>
      </div>
    </main>
  );
}
