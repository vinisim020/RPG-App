"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrar, type EstadoLogin } from "./actions";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primario w-full" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function FormLogin({ de }: { de: string }) {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="de" value={de} />
      <label className="block">
        <span className="rotulo mb-1.5 block">Usuário</span>
        <input
          name="login"
          autoFocus
          autoComplete="username"
          className="campo campo-caixa"
          placeholder="seu.usuario"
        />
      </label>
      <label className="block">
        <span className="rotulo mb-1.5 block">Senha</span>
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          className="campo campo-caixa"
          placeholder="••••••••"
        />
      </label>
      {estado.erro ? (
        <p className="text-[12.5px] text-carmim-luz">{estado.erro}</p>
      ) : null}
      <Enviar />
    </form>
  );
}
