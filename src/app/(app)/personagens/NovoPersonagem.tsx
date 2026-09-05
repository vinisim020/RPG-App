"use client";

import { useState } from "react";
import { Modal } from "@/components/interativos";
import { criarPersonagem } from "./actions";

export function NovoPersonagem({
  jogadores,
}: {
  jogadores?: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-primario" onClick={() => setAberto(true)}>
        + Novo personagem
      </button>
      <Modal aberto={aberto} aoFechar={() => setAberto(false)} titulo="Novo personagem" largura={460}>
        <form action={criarPersonagem} className="flex flex-col gap-4">
          <label className="block">
            <span className="rotulo mb-1.5 block">Nome</span>
            <input name="nome" autoFocus className="campo campo-caixa" placeholder="Nome do personagem" />
          </label>
          {jogadores ? (
            <label className="block">
              <span className="rotulo mb-1.5 block">Jogador</span>
              <select name="usuarioId" className="campo campo-caixa" defaultValue={jogadores[0]?.id}>
                {jogadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nome}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn" onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario">
              Criar ficha
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
