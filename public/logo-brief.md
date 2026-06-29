# Brief de Logo — TupperStore

Use este documento para gerar PNGs de logo no ChatGPT (DALL·E), Midjourney, Ideogram ou similar.
Basta copiar o **Prompt pronto** abaixo. As seções seguintes explicam o contexto e os arquivos esperados.

---

## Contexto da marca

- **Nome:** TupperStore
- **Produto:** painel (dashboard) de gestão e venda de potes/recipientes de armazenamento de alimentos (estilo Tupperware) — controle de estoque, pedidos, frete e relatórios.
- **Personalidade:** moderno, limpo, profissional, confiável, levemente premium. Nada infantil.
- **Conceito visual atual (no app):** containers empilhados (remete a estoque/inventário) dentro de um *tile* arredondado com gradiente roxo.

## Paleta

| Uso | Cor |
|-----|-----|
| Roxo primário (accent) | `#8b5cf6` |
| Roxo escuro (gradiente) | `#5b21b6` |
| Fundo escuro do app | `#0c0d12` |
| Branco do ícone | `#ffffff` |

Gradiente sugerido do tile: 140°, de `#8b5cf6` para `#5b21b6`.

## Estilo desejado

- Ícone **geométrico e minimalista**, legível em 16×16 px (favicon) e em 512×512 px.
- Formato: *app icon* em **tile arredondado** (raio ≈ 22% do lado), ícone branco centralizado.
- Sem texto dentro do ícone (o nome aparece ao lado, separado).
- Sombras/efeitos sutis; evitar realismo, fotografia, mascote ou degradês exagerados.
- Conceitos válidos: containers empilhados, potes encaixáveis, camadas de estoque, monograma "TS".

## Não fazer

- Nada de clipart de "comida", emojis, ou bowls realistas.
- Sem bordas grossas ou estilo "selo/carimbo".
- Não usar mais de 2 cores no ícone (branco + 1 detalhe no máximo).

## Arquivos esperados (exportar PNG, fundo transparente onde indicado)

| Arquivo | Tamanho | Observação |
|---------|---------|-----------|
| `icon-512.png` | 512×512 | tile com gradiente |
| `icon-256.png` | 256×256 | tile com gradiente (substitui o atual em `/public`) |
| `icon.png` | 256×256 | usado em `/src/app/icon.png` |
| `favicon.png` | 48×48 | versão simplificada, alto contraste |
| `logo-mark-white.png` | 512×512 | só o ícone branco, **fundo transparente** |

> Dica: gere primeiro em 1024×1024 e reduza, para manter nitidez.

---

## Prompt pronto (copiar e colar)

```
A modern, minimalist app icon for "TupperStore", a SaaS dashboard for selling
and managing food storage containers (Tupperware-style) and inventory.

Icon concept: three stacked rounded containers/boxes of decreasing width,
suggesting organized stock and stackable storage. Clean geometric flat design,
solid white icon shapes, no text.

Placed on a rounded-square tile (corner radius ~22%) with a smooth diagonal
gradient from violet #8b5cf6 (top-left) to deep purple #5b21b6 (bottom-right).
Subtle soft shadow under the tile. Centered, balanced negative space.

Style: premium, professional, vector, flat, high contrast, crisp at small sizes.
No photorealism, no mascot, no food illustration, no lettering inside the icon.
Square 1:1, transparent background outside the tile. 1024x1024.
```

### Variante alternativa — monograma "TS"

```
Same brand and tile/gradient as above, but the icon is an abstract geometric
monogram combining the letters "T" and "S" into a single interlocking mark,
solid white, balanced, minimal. Vector, flat, premium. 1024x1024.
```

---

## Onde aplicar no projeto depois de gerar

- Substituir os PNGs em `/public/` (`icon-256.png`, etc.) e `/src/app/icon.png`, `/src/app/favicon.ico`.
- O ícone vetor usado na interface fica em `src/components/ui/Logo.tsx` (`LogoIcon`). Se quiser, me mande o PNG/SVG final que eu adapto o componente para bater com ele.
