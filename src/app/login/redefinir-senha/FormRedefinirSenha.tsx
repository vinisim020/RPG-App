"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { redefinirSenhaComToken, type EstadoRedefinirSenha } from "../actions";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primario w-full" disabled={pending}>
      {pending ? "Salvando…" : "Salvar nova senha"}
    </button>
  );
}

export function FormRedefinirSenha({ token }: { token: string }) {
  const [estado, acao] = useActionState<EstadoRedefinirSenha, FormData>(
    redefinirSenhaComToken,
    {}
  );

  if (estado.sucesso) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-[13px] text-fg-soft">Senha redefinida com sucesso.</p>
        <Link href="/login" className="btn btn-primario">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="rotulo mb-1.5 block">Nova senha</span>
        <input
          name="senha"
          type="password"
          autoFocus
          autoComplete="new-password"
          className="campo campo-caixa"
          placeholder="mínimo 6 caracteres"
        />
      </label>
      {estado.erro ? (
        <p className="text-[12.5px] text-carmim-luz">{estado.erro}</p>
      ) : null}
      <Enviar />
    </form>
  );
}
