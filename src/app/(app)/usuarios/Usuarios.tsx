"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cartao, Pilula } from "@/components/ui";
import { BotaoRemover, Campo, Modal } from "@/components/interativos";
import {
  alterarUsuario,
  criarUsuario,
  excluirUsuario,
  redefinirSenha,
} from "./actions";

export type UsuarioItem = {
  id: string;
  nome: string;
  login: string;
  papel: "MESTRE" | "JOGADOR";
  personagens: number;
};

export function Usuarios({
  usuarios,
  euId,
}: {
  usuarios: UsuarioItem[];
  euId: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const [novoAberto, setNovoAberto] = useState(false);
  const [novo, setNovo] = useState({
    nome: "",
    login: "",
    senha: "",
    papel: "JOGADOR" as "MESTRE" | "JOGADOR",
  });

  const [senhaDe, setSenhaDe] = useState<UsuarioItem | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  async function executar(fn: () => Promise<{ erro?: string } | void>) {
    setOcupado(true);
    setErro(null);
    try {
      const r = await fn();
      if (r && r.erro) {
        setErro(r.erro);
        return false;
      }
      router.refresh();
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na operação.");
      return false;
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          className="btn btn-primario"
          onClick={() => {
            setNovo({ nome: "", login: "", senha: "", papel: "JOGADOR" });
            setErro(null);
            setNovoAberto(true);
          }}
        >
          + Nova conta
        </button>
      </div>

      {erro ? <p className="mb-3 text-[12.5px] text-carmim-luz">{erro}</p> : null}

      <Cartao className="overflow-hidden">
        {usuarios.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0"
          >
            <div className="min-w-[180px] flex-1">
              <span className="text-[14px] text-fg-soft">{u.nome}</span>
              <span className="ml-2 font-mono text-[11.5px] text-faint">{u.login}</span>
            </div>

            <Pilula variante={u.papel === "MESTRE" ? "carmim" : "neutra"}>
              {u.papel === "MESTRE" ? "Mestre" : "Jogador"}
            </Pilula>

            <span className="text-[11.5px] text-faint">
              {u.personagens} {u.personagens === 1 ? "personagem" : "personagens"}
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-mini"
                onClick={() => {
                  setSenhaDe(u);
                  setNovaSenha("");
                  setErro(null);
                }}
              >
                Trocar senha
              </button>
              <button
                type="button"
                className="btn btn-mini"
                disabled={ocupado}
                onClick={() =>
                  executar(() =>
                    alterarUsuario(u.id, {
                      papel: u.papel === "MESTRE" ? "JOGADOR" : "MESTRE",
                    })
                  )
                }
              >
                {u.papel === "MESTRE" ? "Tornar jogador" : "Tornar mestre"}
              </button>
              {u.id !== euId ? (
                <BotaoRemover
                  rotulo="Excluir"
                  aoConfirmar={() => executar(() => excluirUsuario(u.id))}
                />
              ) : (
                <span className="text-[11.5px] text-faint">você</span>
              )}
            </div>
          </div>
        ))}
      </Cartao>

      <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
        Excluir uma conta apaga também os personagens dela. Não existe recuperação de senha
        automática: use &ldquo;Trocar senha&rdquo; e passe a nova senha ao jogador.
      </p>

      {/* nova conta */}
      <Modal
        aberto={novoAberto}
        aoFechar={() => setNovoAberto(false)}
        titulo="Nova conta"
        largura={480}
      >
        <div className="flex flex-col gap-3.5">
          <Campo rotulo="Nome">
            <input
              autoFocus
              className="campo campo-caixa text-[13px]"
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </Campo>
          <Campo rotulo="Usuário de acesso">
            <input
              className="campo campo-caixa text-[13px]"
              value={novo.login}
              onChange={(e) => setNovo({ ...novo, login: e.target.value })}
              placeholder="sem espaços, ex.: joao"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Senha inicial">
              <input
                className="campo campo-caixa text-[13px]"
                value={novo.senha}
                onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
                placeholder="mínimo 6 caracteres"
              />
            </Campo>
            <Campo rotulo="Papel">
              <select
                className="campo campo-caixa text-[13px]"
                value={novo.papel}
                onChange={(e) =>
                  setNovo({ ...novo, papel: e.target.value as "MESTRE" | "JOGADOR" })
                }
              >
                <option value="JOGADOR">Jogador</option>
                <option value="MESTRE">Mestre</option>
              </select>
            </Campo>
          </div>
          {erro ? <p className="text-[12.5px] text-carmim-luz">{erro}</p> : null}
          <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
            <button type="button" className="btn" onClick={() => setNovoAberto(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              disabled={ocupado}
              onClick={async () => {
                const ok = await executar(() => criarUsuario(novo));
                if (ok) setNovoAberto(false);
              }}
            >
              Criar conta
            </button>
          </div>
        </div>
      </Modal>

      {/* trocar senha */}
      <Modal
        aberto={senhaDe !== null}
        aoFechar={() => setSenhaDe(null)}
        titulo={`Trocar senha — ${senhaDe?.nome ?? ""}`}
        largura={420}
      >
        <div className="flex flex-col gap-3.5">
          <Campo rotulo="Nova senha">
            <input
              autoFocus
              className="campo campo-caixa text-[13px]"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="mínimo 6 caracteres"
            />
          </Campo>
          {erro ? <p className="text-[12.5px] text-carmim-luz">{erro}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setSenhaDe(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              disabled={ocupado}
              onClick={async () => {
                if (!senhaDe) return;
                const ok = await executar(() => redefinirSenha(senhaDe.id, novaSenha));
                if (ok) setSenhaDe(null);
              }}
            >
              Salvar senha
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
