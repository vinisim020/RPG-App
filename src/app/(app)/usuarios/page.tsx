import { db } from "@/lib/db";
import { exigirMestre } from "@/lib/auth";
import { CabecalhoPagina } from "@/components/ui";
import { Usuarios } from "./Usuarios";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const sessao = await exigirMestre();

  const usuarios = await db.usuario.findMany({
    orderBy: [{ papel: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      login: true,
      papel: true,
      _count: { select: { personagens: true } },
    },
  });

  return (
    <>
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Contas da mesa. Não há cadastro público: você cria e gerencia todas aqui."
      />
      <Usuarios
        euId={sessao.id}
        usuarios={usuarios.map((u) => ({
          id: u.id,
          nome: u.nome,
          login: u.login,
          papel: u.papel,
          personagens: u._count.personagens,
        }))}
      />
    </>
  );
}
