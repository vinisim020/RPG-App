import { FormLogin } from "./FormLogin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const { de } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <h1 className="titulo text-[34px]">Gaia</h1>
          <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-carmim-suave">
            O Prelúdio
          </p>
        </div>
        <div className="cartao px-6 py-7">
          <FormLogin de={de ?? ""} />
        </div>
        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-faint">
          Ferramenta privada da mesa. As contas são criadas pelo mestre.
        </p>
      </div>
    </main>
  );
}
