import { exigirSessao } from "@/lib/auth";
import { sair } from "../login/actions";
import { Navegacao } from "@/components/Navegacao";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Navegacao papel={sessao.papel} nome={sessao.nome} aoSair={sair} />
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-11 sm:py-9">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
