import type {
  Usuario,
  Produto,
  Pedido,
  EtapaPedido,
  Cupom,
  FreteConfig,
  ConfigVendas,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://sublime-react.vercel.app";

async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit & { skipAuthRedirect?: boolean } = {}
): Promise<T> {
  const isFormData = opts.body instanceof FormData;
  const { skipAuthRedirect, ...fetchOpts } = opts;

  const headers: HeadersInit = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers || {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...fetchOpts,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("Sem conexão com o servidor. Verifique sua internet.");
  }

  if (res.status === 401) {
    if (skipAuthRedirect) {
      let msg = "Credenciais inválidas.";
      try {
        const e = await res.json();
        msg = e.erro || e.message || msg;
      } catch {}
      throw new Error(msg);
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("sublime_user");
      window.location.replace("/");
    }
    return null as T;
  }

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const e = await res.json();
      msg = e.erro || e.message || e.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const ct = res.headers.get("Content-Type") || "";
  return ct.includes("application/json") ? res.json() : (res.text() as unknown as T);
}

export const API = {
  // Auth
  login: (email: string, senha: string) =>
    apiFetch<{ usuario: Usuario }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
      skipAuthRedirect: true,
    }),

  logout: () => apiFetch("/api/auth/logout", { method: "POST" }),

  me: () => apiFetch<{ usuario: Usuario }>("/api/auth/me"),

  // Estoque
  getEstoque: () => apiFetch<Produto[]>("/api/estoque"),
  createEstoque: (dados: Partial<Produto>) =>
    apiFetch<Produto>("/api/estoque", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  updateEstoque: (id: number, dados: Partial<Produto>) =>
    apiFetch<Produto>(`/api/estoque/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),
  deleteEstoque: (id: number) =>
    apiFetch(`/api/estoque/${id}`, { method: "DELETE" }),
  uploadImagem: (formData: FormData) =>
    apiFetch<{ url: string }>("/api/upload", {
      method: "POST",
      body: formData,
    }),

  // Pedidos
  getPedidos: () => apiFetch<Pedido[]>("/api/pedidos"),
  updateEtapa: (id: number, etapa: EtapaPedido) =>
    apiFetch(`/api/pedidos/${id}/etapa`, {
      method: "PATCH",
      body: JSON.stringify({ etapa }),
    }),
  updatePagamento: (id: number) =>
    apiFetch(`/api/pedidos/${id}/pagamento`, {
      method: "PATCH",
      body: JSON.stringify({ pagamento: "REALIZADO" }),
    }),
  devolucao: (id: number) =>
    apiFetch(`/api/pedidos/${id}/devolucao`, { method: "POST" }),

  // Cupons
  getCupons: () => apiFetch<Cupom[]>("/api/cupons"),
  createCupom: (dados: { cupom: string; desconto: number; quantidadeUsos: number }) =>
    apiFetch<Cupom>("/api/cupons", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  deleteCupom: (id: number) =>
    apiFetch(`/api/cupons/${id}`, { method: "DELETE" }),

  // Config
  getConfigVendas: () => apiFetch<ConfigVendas>("/api/config/vendas"),
  setConfigKey: (chave: string, valor: string) =>
    apiFetch("/api/config/vendas", {
      method: "PATCH",
      body: JSON.stringify({ chave, valor: String(valor) }),
    }),
  updateConfigVendas: (dados: Partial<ConfigVendas>) =>
    apiFetch("/api/config/vendas", {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),

  // Frete
  getFreteConfig: () => apiFetch<FreteConfig>("/api/frete"),
  saveFreteConfig: (dados: FreteConfig) =>
    apiFetch<FreteConfig>("/api/frete", {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),

  // Usuários
  getUsuarios: () => apiFetch<Usuario[]>("/api/usuarios"),
  createUsuario: (dados: Partial<Usuario> & { senha: string }) =>
    apiFetch<Usuario>("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  updateUsuario: (id: number, dados: Partial<Usuario> & { senha?: string; tema?: string; foto?: string | null }) =>
    apiFetch<Usuario>(`/api/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),
  deleteUsuario: (id: number) =>
    apiFetch(`/api/usuarios/${id}`, { method: "DELETE" }),
};
