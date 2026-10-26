# RefrigeraSim — Engenharia do Frio

Site institucional premium e experimental para refrigeração e climatização.
Experiência cinematográfica conduzida pelo scroll, com vídeo controlado pela
posição da página e uma linguagem de animação diferente para cada capítulo.

---

## Os vídeos

Os 5 vídeos foram gerados no Higgsfield, mas o ambiente onde o site foi montado
está atrás de uma política de rede que bloqueia o CDN de vídeo — por isso eles
não vêm dentro do pacote.

**Isso não impede nada.** Cada `<video>` carrega um atributo `data-fallback`
com a URL original: se o arquivo local não existir, `js/video-scroll.js`
troca a origem para o CDN automaticamente. Abrindo `index.html` agora, os
vídeos aparecem — vindos da rede.

Para deixar o projeto autossuficiente (recomendado antes de publicar), baixe os
arquivos uma vez:

- **Windows** — duplo clique em `baixar-videos.bat`
- **macOS / Linux** — `./baixar-videos.sh` no terminal

O script baixa os originais para `assets/videos/originais/` e recomprime para
H.264 em `assets/videos/`, regravando também os posters com o primeiro frame
real de cada vídeo. **Requer `ffmpeg`** (`winget install Gyan.FFmpeg`) — sem
ele os arquivos ficam em HEVC e a página não funciona no Firefox. A partir daí o site usa os
arquivos locais e nunca mais toca no CDN. Os links diretos estão no fim deste
arquivo, caso prefira baixar manualmente.

---

## Como abrir

O projeto é estático. Basta abrir `index.html` no navegador.

Para evitar restrições de `file://` em alguns navegadores (autoplay e cache de
vídeo), prefira servir por HTTP:

```bash
# Python
python3 -m http.server 8080

# ou Node
npx serve .
```

Depois acesse `http://localhost:8080`.

---

## Estrutura

```
frigus/
├── index.html
├── README.md
├── assets/
│   ├── icons/favicon.svg
│   ├── images/          posters (primeiro frame de cada vídeo)
│   └── videos/          hero-scrub.mp4  <- all-intra, so o hero usa
│                        hero.mp4, coil.mp4, frost.mp4, ac.mp4, comfort.mp4
│                        originais/  <- HEVC do CDN, nao publicar
├── css/
│   └── style.css        tokens, capítulos, responsivo, acessibilidade
└── js/
    ├── video-scroll.js  scroll  ->  timeline do vídeo
    ├── animations.js    um capítulo, uma linguagem de animação
    └── main.js          navegação, menu, partículas, boot
```

---

## Vídeo controlado pelo scroll

`js/video-scroll.js` liga a posição da página ao `currentTime` do vídeo:

```
SCROLL ↓  →  o vídeo avança
SCROLL ↑  →  o vídeo retrocede
```

Detalhes da implementação:

- o `seek` é agrupado em um `requestAnimationFrame`, então o scroll nunca
  dispara mais de um salto de quadro por frame;
- espera `loadedmetadata` antes de amarrar a timeline, com _timeout_ de
  segurança para redes lentas;
- em telas pequenas com ponteiro grosso (celular), o scrub por `currentTime` é
  caro: o vídeo entra em modo `loop` silencioso, preservando a atmosfera sem
  travar a rolagem;
- os vídeos secundários só tocam enquanto estão na viewport (`playInView`),
  economizando CPU e bateria.

Os arquivos são codificados em H.264 com `faststart`, sem faixa de áudio.

---

## Linguagem de animação por capítulo

| # | Capítulo    | Animação                                   |
|---|-------------|--------------------------------------------|
| 01 | Hero       | `scale` + `scrub` (vídeo preso ao scroll)  |
| 02 | Introdução | `blur → sharp`, palavra a palavra          |
| 03 | Serviços   | 01 lateral · 02 escala central · 03 máscara `clip-path` · 04 vertical |
| 04 | Galeria    | scroll horizontal com `pin`                |
| 05 | Processo   | `stagger` + linha de progresso             |
| 06 | Tecnologia | parallax multicamada + campo de partículas |
| 07 | Conforto   | `fade` + `scale`, virada para o claro      |
| 08 | Prova      | contadores                                 |
| 09 | CTA        | expansão de máscara (`clip-path`)          |

Nenhuma transição se repete em seções consecutivas.

---

## Dependências

- **GSAP 3.12.5 + ScrollTrigger** — carregados via CDN no final do `index.html`.
- **Google Fonts** — Manrope e Inter.

Nada mais é necessário: sem build, sem bundler, sem framework.

### Uso 100% offline (opcional)

Se o site precisar rodar sem internet, baixe os dois arquivos do GSAP para
`js/vendor/` e troque os `<script>` no fim do `index.html`:

```bash
mkdir -p js/vendor
curl -o js/vendor/gsap.min.js \
  https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
curl -o js/vendor/ScrollTrigger.min.js \
  https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
```

```html
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
```

O mesmo vale para as fontes — baixe os `.woff2` e substitua o `<link>` por um
`@font-face` local.

---

## Degradação graciosa

Se o GSAP não carregar (CDN bloqueado, offline, erro de rede), `main.js` aplica
a classe `no-anim` no `<html>`: todo o conteúdo permanece visível e legível, e
a navegação, o menu e o campo de partículas continuam funcionando. A página
nunca fica em branco por causa de uma animação.

---

## Acessibilidade

- HTML semântico (`header`, `nav`, `main`, `section`, `article`, `footer`).
- `prefers-reduced-motion: reduce` desliga o scrub, o pin horizontal e as
  partículas; o site vira uma leitura vertical simples.
- Foco visível em todos os elementos interativos, navegação por teclado,
  `Esc` fecha o menu mobile.
- `aria-label`, `aria-expanded` e `aria-hidden` nos controles de menu.
- Contraste: as seções claras redefinem os acentos para variantes mais escuras
  (`--tech-ink`, `--metal-ink`) de modo a atingir AA em texto pequeno.
- Vídeos são decorativos, silenciosos e marcados `aria-hidden` onde aplicável.

---

## Conteúdo a substituir antes de publicar

- **Números da seção Prova** (`+16`, `+4.200`, `+9.800`) — são placeholders,
  sinalizados no próprio site pelo aviso abaixo do bloco.
- **Endereço e redes sociais** do rodapé — Instagram e LinkedIn ainda
  apontam para `#`. Telefones e e-mail já são os reais.

---

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#06151C` | fundo escuro principal |
| `--deep` | `#0A2633` | azul profundo, cartões |
| `--tech` | `#2FA8C7` | azul tecnológico, acentos |
| `--ice-cold` | `#8DD5E8` | azul frio, destaques |
| `--ice-pale` | `#D8F1F7` | azul muito claro |
| `--ice-bg` | `#EAF6FA` | fundo claro |
| `--ice-white` | `#F7FCFF` | branco gelo |
| `--metal` | `#AFC1C7` | cinza metálico |

---

## Links diretos dos vídeos

Base: `https://d8j0ntlcm91z4.cloudfront.net/user_3IZOrgGtP6buNjeGHc2EBMXsOHp/`

| Salvar como | Arquivo | Cena |
|---|---|---|
| `assets/videos/hero.mp4` | `hf_20260915_195443_2603e7d6-ff93-47e3-8b3e-03b57417a5f4.mp4` | Geladeira premium abrindo, vapor frio descendo |
| `assets/videos/coil.mp4` | `hf_20260915_195454_162ebfef-450b-43f0-8696-084e2094134c.mp4` | Macro da serpentina, cristais de gelo crescendo |
| `assets/videos/frost.mp4` | `hf_20260915_195443_d4bff3ea-80f3-41ab-b111-6ec9f2aa1d41.mp4` | Fractais de gelo se espalhando no vidro |
| `assets/videos/ac.mp4` | `hf_20260915_195443_63ff9e5c-24e3-4b24-b90d-ec9d534cbd70.mp4` | Ar-condicionado abrindo, ar frio saindo |
| `assets/videos/comfort.mp4` | `hf_20260915_195453_bde72aff-39e4-4e70-9a56-b5f2e261d6d6.mp4` | Sala clara, cortina ao vento |

Todos: 1920×1080, sem áudio, gerados com Seedance 2.5 via Higgsfield.

### Recompressão — obrigatória, não opcional

Os scripts `baixar-videos.sh` / `.bat` já fazem isto. O texto abaixo existe
para ninguém desfazer sem querer.

Os originais saem do gerador em **HEVC (H.265), 1080p, com um único keyframe
no arquivo inteiro** (193 frames, 1 sync sample). Daí vêm três defeitos:

| Sintoma | Causa | 
|---|---|
| Nada aparece no Firefox | Firefox não decodifica HEVC |
| Scrub do hero pula entre poucos frames | 1 keyframe: mostrar o frame N exige decodificar 1..N |
| Vídeo demora a aparecer | `moov` gravado no fim do arquivo |

A correção é reencodar em H.264 com `+faststart` e — só no hero —
**all-intra** (`-g 1 -bf 0`), que faz de cada frame um keyframe:

```bash
# hero: guiado quadro a quadro pelo scroll
ffmpeg -i originais/hero.mp4 -an -c:v libx264 -preset slow -crf 23   -g 1 -bf 0 -pix_fmt yuv420p -movflags +faststart hero-scrub.mp4

# demais: so rodam em loop, GOP normal
ffmpeg -i originais/NOME.mp4 -an -c:v libx264 -preset slow -crf 24   -g 48 -pix_fmt yuv420p -movflags +faststart NOME.mp4
```

Medido no Chrome, 60 seeks ao longo da timeline do hero:

| encode | mediana | pior caso |
|---|---|---|
| HEVC, 1 keyframe | 73,6 ms | 142 ms |
| H.264 all-intra | **3,8 ms** | **16,3 ms** |

A 73,6 ms por seek dá ~13 frames por segundo de scroll — exatamente a sensação
de "poucos frames". A 3,8 ms o seek cabe folgado no orçamento de 16,7 ms de um
quadro a 60 fps.

O all-intra custa tamanho (1,8 MB → 5,7 MB). Por isso **só** o hero usa esse
encode (`hero-scrub.mp4`); as seções de Serviços e Galeria, que apenas tocam
em loop, carregam o `hero.mp4` normal de 1,3 MB.
