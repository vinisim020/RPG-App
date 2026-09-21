"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { solicitarRedefinicaoSenha, type EstadoEsqueciSenha } from "../actions";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primario w-full" disabled={pending}>
      {pending ? "Enviando…" : "Enviar link de redefinição"}
    </button>
  );
}

export function FormEsqueciSenha() {
  const [estado, acao] = useActionState<EstadoEsqueciSenha, FormData>(
    solicitarRedefinicaoSenha,
    {}
  );

  if (estado.enviado) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-[13px] text-fg-soft">
          Se o usuário informado for de uma conta de mestre, um e-mail com o link de
          redefinição foi enviado.
        </p>
        <Link href="/login" className="btn btn-mini">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
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
      {estado.erro ? (
        <p className="text-[12.5px] text-carmim-luz">{estado.erro}</p>
      ) : null}
      <Enviar />
      <Link
        href="/login"
        className="text-center text-[12px] text-muted transition-colors hover:text-fg-soft"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
