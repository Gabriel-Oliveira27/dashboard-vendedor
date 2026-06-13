export type Theme = "dark" | "light" | "violet" | "midnight" | "forest" | "rose";

export interface Permissao {
  ver: boolean;
  editar: boolean;
}

export interface Permissoes {
  estoque: Permissao;
  pedidos: Permissao;
  cupons: Permissao;
  config: Permissao;
  descontos: Permissao;
  frete: Permissao;
  relatorio: Permissao;
  usuarios: Permissao;
}

export interface Usuario {
  id: number;
  nome: string;
  apelido: string;
  email: string;
  foto?: string | null;
  isAdmin: boolean;
  ativo: boolean;
  tema?: Theme;
  permissoes: Permissoes;
}

export interface Produto {
  id: number;
  produto?: string;
  nome?: string;
  linha: string;
  litros?: string;
  cores?: string;
  qtd: number;
  valor: number;
  imagem?: string;
  detalhes?: string;
}

export interface ItemPedido {
  id: string;
  descricao: string;
  cores?: string;
  qty: number;
}

export interface Pedido {
  id: number;
  idRastreio?: string;
  nome: string;
  contato?: string;
  endereco?: string;
  pedido: ItemPedido[];
  subtotal?: number;
  frete?: number;
  cupom?: string;
  parcelas?: number;
  trocoPara?: number;
  totalVenda: number;
  metodoPagamento: string;
  etapa: EtapaPedido;
  pagamento: "PENDENTE" | "REALIZADO";
  dataCompra: string;
}

export type EtapaPedido =
  | "RESERVADO"
  | "CONFIRMADO"
  | "EM_PREPARO"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "CANCELADO";

export interface Cupom {
  id: number;
  cupom?: string;
  codigo?: string;
  desconto: number;
  quantidadeUsos?: number;
  usosRestantes?: number;
  criado_em?: string;
}

export type FreteModelo = "VALOR" | "KM" | "FIXO" | "CIDADE";

export interface TierValor {
  ate: number | null;
  taxa: number;
}

export interface CidadeEspecial {
  nome: string;
  valor: number;
}

export interface FreteConfig {
  modelo: FreteModelo;
  tiersValor?: TierValor[];
  custoKm?: number;
  freteGratisAteKm?: number;
  valorFixo?: number;
  valorCidadeOrigem?: number;
  valorDemais?: number;
  cidadesEspeciais?: CidadeEspecial[];
  origemEndereco?: string;
  origemCep?: string;
  origemNumero?: string;
  origemComplemento?: string;
  origemLat?: string | null;
  origemLon?: string | null;
  origemCidade?: string;
  origemUF?: string;
}

export interface ConfigVendas {
  pix?: string;
  whatsapp?: string;
  WHATSAPP_ATIVO?: string;
  PAGAMENTO_PIX?: string;
  PAGAMENTO_CREDITO?: string;
  PAGAMENTO_DINHEIRO?: string;
  ORIGEM_ENDERECO?: string;
  ORIGEM_CEP?: string;
  ORIGEM_LAT?: string;
  ORIGEM_LON?: string;
  ORIGEM_NUMERO?: string;
  ORIGEM_COMPLEMENTO?: string;
  DESCONTO_GLOBAL?: string;
  [key: string]: string | undefined;
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type Section =
  | "overview"
  | "estoque"
  | "pedidos"
  | "cupons"
  | "config"
  | "descontos"
  | "frete"
  | "relatorio"
  | "usuarios";
