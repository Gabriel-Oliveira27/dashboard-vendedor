## Patches para js/dashboard.js
## Aplique as 3 substituições abaixo no arquivo original.

### PATCH 1 — SECTION_TITLES (linha ~210)
Substituir:
  const SECTION_TITLES = {
    overview:'Visão Geral', estoque:'Estoque', pedidos:'Pedidos',
    cupons:'Cupons', config:'Configurações de Vendas', relatorio:'Relatório', usuarios:'Usuários',
  };

Por:
  const SECTION_TITLES = {
    overview:'Visão Geral', estoque:'Estoque', pedidos:'Pedidos',
    cupons:'Cupons', config:'Configurações de Vendas',
    descontos:'Descontos', frete:'Modelo de Frete',
    relatorio:'Relatório', usuarios:'Usuários',
  };

---

### PATCH 2 — canView map (dentro de navigateTo)
Substituir:
    const map = {estoque:'estoque',pedidos:'pedidos',cupons:'cupons',config:'config',usuarios:'usuarios'};

Por:
    const map = {estoque:'estoque',pedidos:'pedidos',cupons:'cupons',config:'config',descontos:'config',frete:'config',usuarios:'usuarios'};

---

### PATCH 3 — switch/case (dentro de navigateTo)
Substituir:
    case 'config':    Config.init();   break;
    case 'relatorio': loadRelatorio(); break;
    case 'usuarios':  Usuarios.init(); break;

Por:
    case 'config':    Config.init();    break;
    case 'descontos': Descontos.init(); break;
    case 'frete':     Frete.init();     break;
    case 'relatorio': loadRelatorio();  break;
    case 'usuarios':  Usuarios.init();  break;
