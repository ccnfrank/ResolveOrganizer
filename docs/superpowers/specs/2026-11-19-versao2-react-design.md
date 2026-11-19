# Resolve Organizer v2 — Design

Data: 2026-11-19
Branch: `versao2`
Status: aguardando aprovação

## Intenção

O Resolve Organizer cria, em uma pasta escolhida pelo usuário, a estrutura padrão de bins/pastas para projetos do DaVinci Resolve. A versão 2 reescreve a interface em React com aparência moderna, interação fluida e suporte a três idiomas (português, inglês e alemão). A funcionalidade central não muda.

## Objetivos

- Reescrever a interface em React (Vite + TypeScript).
- Interface moderna: tipografia, paleta de cores, ícones, elementos gráficos e animações sutis.
- Layout responsivo (celular, tablet e desktop), sem rolagem horizontal.
- Interação mais rica: arrastar para reordenar, editar pastas inline (sem `window.prompt`), confirmação de remoção em diálogo próprio, feedback visual ao criar o projeto.
- Três idiomas: PT-BR, EN e DE, com troca na própria tela. Idioma inicial detectado pelo navegador; se não for um dos três, inglês.
- Preservar o comportamento atual: seleção de pasta de destino, árvore editável, criação das pastas no disco via File System Access API.
- Publicar no Netlify (o link atual `resolveorganizer.netlify.app` continua válido).

## Não-objetivos

- Não adicionar backend, login, banco de dados ou coleta de dados.
- Não mudar os nomes padrão das pastas nesta versão.
- Não integrar diretamente com o DaVinci Resolve.

## Antimetas (o que faria a v2 falhar mesmo funcionando)

- Perder a capacidade de criar a estrutura no disco ou quebrar o fluxo de seleção de pasta.
- Interface bonita que fica ruim em telas pequenas ou exige rolagem horizontal.
- Textos traduzidos de forma incompleta ou com mistura de idiomas.

## Restrições

- A criação de pastas depende da File System Access API (`showDirectoryPicker`), disponível no Chrome e no Edge. No Safari e no Firefox a aplicação deve mostrar uma mensagem clara, como já faz hoje.
- Sem servidor: tudo roda no navegador.

## Abordagens

1. **Vite + React + TypeScript + Tailwind CSS + lucide-react + Motion** — *recomendada*. Build rápido, componentes organizados, estilo e animação prontos para a interface moderna, publicação simples no Netlify.
2. **Next.js com exportação estática** — funciona, mas acrescenta complexidade (roteamento, SSR) que este app não usa.
3. **React carregado por CDN, sem build** — mantém o modelo atual sem ferramentas, porém limita a organização do código e a interatividade pretendida.

Escolhi a 1 porque atende ao pedido de interface moderna e interativa com o menor custo de manutenção.

## Estrutura de pastas do projeto (proposta)

```
src/
  components/   (Header, ProjectForm, FolderPicker, BinTree, BinNode, Toolbar, LanguageSwitch, ConfirmDialog, StatusToast)
  i18n/         (dicionários pt-BR, en, de e hook useTranslation simples, sem biblioteca)
  lib/          (fileSystem.ts, sanitize.ts, binTree.ts com funções puras de inserir/remover/renomear)
  styles/       (tema e tokens de cor)
  App.tsx, main.tsx
```

A lógica de árvore fica em funções puras e testáveis, separada da interface.

## Idiomas

- Dicionário próprio, sem biblioteca de i18n (são apenas três idiomas e poucas dezenas de textos).
- Preferência salva no `localStorage` do navegador (conveniência local, não dado sensível).
- Nomes das pastas padrão continuam os mesmos em todos os idiomas. Só os textos da interface mudam.

## Decisões tomadas por mim (podem ser revistas)

- Stack: Vite + React + TypeScript + Tailwind CSS, ícones com lucide-react, animações com Motion.
- Tipografia: manter IBM Plex Mono e Space Grotesk, para preservar a identidade atual, com uma escala mais refinada.
- Paleta: manter o âmbar como cor de destaque e o azul-ciano como cor secundária, em tema escuro com opção clara.
- Estrutura padrão: a mesma de hoje, com os nomes atuais.
- Remoção, renomeação e criação de pastas passam a usar diálogos e campos inline no lugar de `prompt` e `confirm`.

## Pontos em aberto para revisão

- A estrutura padrão tem duas pastas com prefixo `05_` (Exports e Documentos). Mantive como está; se quiser renumerar (por exemplo `06_Documentos`), é uma mudança pequena.

## Verificação

- Testes unitários das funções de árvore e de sanitização.
- Verificação manual da criação de pastas no Chrome.
- Verificação visual em larguras de celular, tablet e desktop, nos três idiomas.
- Build de produção sem erros.

## O que fica para o construtor

- Escolha exata de cores, espaçamentos e animações, seguindo as skills de design do projeto.
- Ícones específicos para cada ação.
