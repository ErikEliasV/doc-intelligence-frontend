import { describe, expect, it, vi } from "vitest";
import { ApiRequestError, NetworkError } from "@/lib/api/client";
import { DocumentStatus, type Document } from "@/lib/api/types";
import {
  adicionar,
  atualizar,
  criarItens,
  enviarFila,
  itensEnviaveis,
  limpar,
  mensagemDeFalha,
  remover,
  resumir,
  type QueueDeps,
  type QueuedFile,
  type UploadPort,
} from "./uploadQueue";

function fakeDeps(): QueueDeps & { revoked: string[] } {
  let n = 0;
  const revoked: string[] = [];
  return {
    revoked,
    makeId: () => `q${++n}`,
    makePreviewUrl: (file) => (file.type.startsWith("image/") ? `blob:${file.name}` : null),
    revokePreviewUrl: (url) => {
      revoked.push(url);
    },
  };
}

function pdf(name = "peticao.pdf"): File {
  return new File(["conteudo"], name, { type: "application/pdf" });
}

function jpg(name = "rg-frente.jpg"): File {
  return new File(["bytes"], name, { type: "image/jpeg" });
}

function documento(id: string): Document {
  return {
    id,
    nome: "x.pdf",
    tipoMime: "application/pdf",
    tamanhoBytes: 8,
    status: DocumentStatus.RECEBIDO,
    enviadoEm: "2026-01-15T12:00:00.000Z",
    atualizadoEm: "2026-01-15T12:00:00.000Z",
    campos: [],
    erro: null,
    versao: 1,
    revisaoEmAndamento: null,
  };
}

/** Accepts everything. */
function portOk(): UploadPort {
  let n = 0;
  return { enviar: async () => documento(`doc_${++n}`) };
}

/** Rejects the files whose name is listed, accepts the rest. */
function portFalhando(nomesQueFalham: string[], erro: unknown = new Error("boom")): UploadPort {
  let n = 0;
  return {
    enviar: async (file) => {
      if (nomesQueFalham.includes(file.name)) throw erro;
      return documento(`doc_${++n}`);
    },
  };
}

function handlers(fila: QueuedFile[]) {
  return {
    fila,
    onStart: (id: string) => {
      fila.splice(0, fila.length, ...atualizar(fila, id, { state: "uploading", erro: null }));
    },
    onSuccess: (id: string, documentId: string) => {
      fila.splice(0, fila.length, ...atualizar(fila, id, { state: "sent", documentId }));
    },
    onError: (id: string, mensagem: string) => {
      fila.splice(0, fila.length, ...atualizar(fila, id, { state: "error", erro: mensagem }));
    },
  };
}

describe("seleção múltipla", () => {
  it("cria um item por arquivo, preservando a ordem", () => {
    const deps = fakeDeps();

    const itens = criarItens([pdf("a.pdf"), jpg("b.jpg"), pdf("c.pdf")], deps);

    expect(itens).toHaveLength(3);
    expect(itens.map((i) => i.nome)).toEqual(["a.pdf", "b.jpg", "c.pdf"]);
    expect(itens.every((i) => i.state === "pending")).toBe(true);
    expect(itens.every((i) => i.erro === null && i.documentId === null)).toBe(true);
  });

  it("dá id distinto para arquivos de mesmo nome", () => {
    const deps = fakeDeps();

    const itens = criarItens([pdf("igual.pdf"), pdf("igual.pdf")], deps);

    expect(itens[0].id).not.toBe(itens[1].id);
    expect(itens).toHaveLength(2);
  });

  it("acumula seleções sucessivas em vez de substituir", () => {
    const deps = fakeDeps();

    let fila = adicionar([], criarItens([pdf("a.pdf")], deps));
    fila = adicionar(fila, criarItens([jpg("b.jpg"), pdf("c.pdf")], deps));

    expect(fila.map((i) => i.nome)).toEqual(["a.pdf", "b.jpg", "c.pdf"]);
  });

  it("gera preview só para imagem — PDF fica sem", () => {
    const deps = fakeDeps();

    const [documentoPdf, imagem] = criarItens([pdf("a.pdf"), jpg("b.jpg")], deps);

    expect(documentoPdf.previewUrl).toBeNull();
    expect(imagem.previewUrl).toBe("blob:b.jpg");
  });

  it("libera o preview ao remover um item", () => {
    const deps = fakeDeps();
    const fila = criarItens([jpg("a.jpg"), jpg("b.jpg")], deps);

    const restante = remover(fila, fila[0].id, deps);

    expect(restante.map((i) => i.nome)).toEqual(["b.jpg"]);
    expect(deps.revoked).toEqual(["blob:a.jpg"]);
  });

  it("libera todos os previews ao limpar a fila", () => {
    const deps = fakeDeps();
    const fila = criarItens([jpg("a.jpg"), pdf("b.pdf"), jpg("c.jpg")], deps);

    expect(limpar(fila, deps)).toEqual([]);
    expect(deps.revoked).toEqual(["blob:a.jpg", "blob:c.jpg"]);
  });

  it("resume a fila por estado", () => {
    const deps = fakeDeps();
    let fila = criarItens([pdf("a.pdf"), pdf("b.pdf"), pdf("c.pdf")], deps);
    fila = atualizar(fila, fila[0].id, { state: "sent" });
    fila = atualizar(fila, fila[1].id, { state: "uploading" });

    expect(resumir(fila)).toEqual({
      total: 3,
      pendentes: 1,
      enviando: 1,
      enviados: 1,
      comErro: 0,
      ocupado: true,
    });
  });
});

describe("erro de envio", () => {
  it("marca só o arquivo que falhou e envia o resto", async () => {
    const deps = fakeDeps();
    const fila = criarItens([pdf("ok1.pdf"), pdf("ruim.pdf"), pdf("ok2.pdf")], deps);
    const h = handlers([...fila]);

    const resultado = await enviarFila(fila, portFalhando(["ruim.pdf"]), h);

    expect(resultado).toEqual({ enviados: 2, falhas: 1 });
    expect(h.fila.map((i) => i.state)).toEqual(["sent", "error", "sent"]);
  });

  it("uma falha no meio não interrompe a fila", async () => {
    const deps = fakeDeps();
    const fila = criarItens([pdf("ruim.pdf"), pdf("ok1.pdf"), pdf("ok2.pdf")], deps);
    const port = portFalhando(["ruim.pdf"]);
    const enviar = vi.spyOn(port, "enviar");

    await enviarFila(fila, port, handlers([...fila]));

    expect(enviar).toHaveBeenCalledTimes(3);
  });

  it("nunca falha em silêncio — todo erro deixa mensagem legível", async () => {
    const deps = fakeDeps();
    const fila = criarItens([pdf("ruim.pdf")], deps);
    const h = handlers([...fila]);

    await enviarFila(fila, portFalhando(["ruim.pdf"], new NetworkError("Servidor fora do ar.")), h);

    expect(h.fila[0].state).toBe("error");
    expect(h.fila[0].erro).toBe("Servidor fora do ar.");
  });

  it("propaga a mensagem do contrato quando o servidor recusa", async () => {
    const deps = fakeDeps();
    const fila = criarItens([pdf("ruim.pdf")], deps);
    const h = handlers([...fila]);
    const recusa = new ApiRequestError("nenhum_arquivo", "Nenhum arquivo recebido.", 400);

    await enviarFila(fila, portFalhando(["ruim.pdf"], recusa), h);

    expect(h.fila[0].erro).toBe("Nenhum arquivo recebido.");
  });

  it("não deixa um arquivo preso em 'enviando' quando falha", async () => {
    const deps = fakeDeps();
    const fila = criarItens([pdf("ruim.pdf")], deps);
    const h = handlers([...fila]);

    await enviarFila(fila, portFalhando(["ruim.pdf"]), h);

    expect(resumir(h.fila).enviando).toBe(0);
    expect(resumir(h.fila).ocupado).toBe(false);
  });

  it("guarda o id do servidor no arquivo aceito", async () => {
    const deps = fakeDeps();
    const fila = criarItens([pdf("a.pdf")], deps);
    const h = handlers([...fila]);

    await enviarFila(fila, portOk(), h);

    expect(h.fila[0]).toMatchObject({ state: "sent", documentId: "doc_1", erro: null });
  });

  it("reenvio cobre só o que falhou, não o que já foi aceito", async () => {
    const deps = fakeDeps();
    let fila = criarItens([pdf("ok.pdf"), pdf("ruim.pdf")], deps);
    fila = atualizar(fila, fila[0].id, { state: "sent", documentId: "doc_1" });
    fila = atualizar(fila, fila[1].id, { state: "error", erro: "Falha no envio." });

    const paraReenviar = itensEnviaveis(fila);

    expect(paraReenviar.map((i) => i.nome)).toEqual(["ruim.pdf"]);
  });

  it("limpa a mensagem antiga ao reenviar um arquivo que falhou", async () => {
    const deps = fakeDeps();
    let fila = criarItens([pdf("ruim.pdf")], deps);
    fila = atualizar(fila, fila[0].id, { state: "error", erro: "Falha anterior." });
    const h = handlers([...fila]);

    await enviarFila(itensEnviaveis(fila), portOk(), h);

    expect(h.fila[0]).toMatchObject({ state: "sent", erro: null });
  });

  it("relata falha em todos quando o servidor está fora", async () => {
    const deps = fakeDeps();
    const fila = criarItens([pdf("a.pdf"), pdf("b.pdf")], deps);
    const h = handlers([...fila]);

    const resultado = await enviarFila(
      fila,
      portFalhando(["a.pdf", "b.pdf"], new NetworkError("Sem conexão.")),
      h,
    );

    expect(resultado).toEqual({ enviados: 0, falhas: 2 });
    expect(resumir(h.fila).comErro).toBe(2);
  });
});

describe("mensagemDeFalha", () => {
  it("usa a mensagem do contrato numa recusa do servidor", () => {
    expect(mensagemDeFalha(new ApiRequestError("x", "Status desconhecido.", 400))).toBe(
      "Status desconhecido.",
    );
  });

  it("usa a mensagem de rede quando a requisição não chega", () => {
    expect(mensagemDeFalha(new NetworkError("Não foi possível falar com o servidor."))).toBe(
      "Não foi possível falar com o servidor.",
    );
  });

  it("tem texto para o que não é Error", () => {
    expect(mensagemDeFalha("string solta")).toBe("Falha no envio.");
    expect(mensagemDeFalha(undefined)).toBe("Falha no envio.");
  });
});
