# Resolve Organizer v2 (React) Implementation Plan

> **For agentic workers:** Execução inline (native). Passos usam checkbox `- [ ]`.

**Goal:** Reescrever o Resolve Organizer em React com interface moderna, PT-BR/EN/DE e a mesma funcionalidade (criar a estrutura de bins no disco).

**Architecture:** Vite + React + TypeScript. Lógica pura em `src/lib` (árvore, sanitização, i18n, sistema de arquivos) com testes em Vitest; componentes em `src/components`; estado da árvore num hook `useBinTree`. Tailwind para estilo, lucide-react para ícones, Motion para animações.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, lucide-react, motion, Vitest, @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-11-19-versao2-react-design.md`

## Global Constraints

- Estrutura padrão idêntica à atual (mesmos nomes, mesma ordem, incluindo `05_Exports` e `05_Documentos`).
- Idiomas: `pt-BR`, `en`, `de`. Fallback: `en`.
- Criação de pastas somente via File System Access API (`showDirectoryPicker`, `getDirectoryHandle` com `create: true`).
- Sanitização de nomes: remover `\ / : * ? " < > |`, colapsar espaços, remover pontos finais.
- Sem backend, sem coleta de dados.

## Review Focus

- Nome de pasta vazio ou só com caracteres inválidos → não adicionar/renomear.
- Remover a pasta selecionada que tem filhos → remove a subárvore inteira, seleção limpa.
- Nome de projeto vazio → não criar, mensagem de erro.
- Navegador sem `showDirectoryPicker` → mensagem clara, app continua usável para editar a árvore.
- Preferência de idioma salva inválida no `localStorage` → cai no idioma detectado.

---

### Task 1: Scaffold do projeto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `src/test/setup.ts`
- Remove: `script.js`, `style.css` (substituídos pelo React)

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test`.

- [ ] **Step 1:** Criar app com `npm create vite@latest` (template react-ts) em diretório temporário e copiar para a raiz, ou criar manualmente os arquivos acima.
- [ ] **Step 2:** `npm i lucide-react motion` e `npm i -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom`.
- [ ] **Step 3:** Configurar `vite.config.ts` com plugin Tailwind e `test: { environment: "jsdom", setupFiles: "src/test/setup.ts" }`.
- [ ] **Step 4:** Verificar: `npm run build` passa.
- [ ] **Step 5:** Commit `chore: scaffold vite react ts app`.

### Task 2: Lógica de sanitização e árvore (pura)

**Files:**
- Create: `src/lib/sanitize.ts`, `src/lib/binTree.ts`
- Test: `src/lib/sanitize.test.ts`, `src/lib/binTree.test.ts`

**Interfaces:**
- Produces:
  - `type BinNode = { name: string; children?: BinNode[] }`
  - `type Path = number[]`
  - `sanitizeName(value: string): string` (retorna `""` se vazio)
  - `DEFAULT_STRUCTURE: BinNode[]`
  - `cloneTree(nodes: BinNode[]): BinNode[]`
  - `getNode(nodes, path): BinNode | null`
  - `insertSibling(nodes, path, name): { nodes: BinNode[]; path: Path }`
  - `insertChild(nodes, path, name): { nodes: BinNode[]; path: Path }`
  - `renameNode(nodes, path, name): BinNode[]`
  - `removeNode(nodes, path): { nodes: BinNode[]; path: null }`
  - `countFolders(nodes): number`

Todas as funções são puras (não mutam a entrada).

- [ ] **Step 1: Testes de sanitização** — `sanitizeName("  a/b:c  ")` → `"a-b-c"`; `sanitizeName("...")` → `""`; `sanitizeName("Nome.")` → `"Nome"`.
- [ ] **Step 2: Rodar, ver falhar.**
- [ ] **Step 3: Implementar `sanitize.ts`** seguindo as regras de Global Constraints.
- [ ] **Step 4: Testes de árvore** — `insertSibling` em `[0]` cria irmão em `[1]`; `insertChild` em `[2]` adiciona em `children`; `removeNode([2])` remove subárvore; operações não mutam a entrada (`expect(original).toEqual(snapshot)`); `countFolders(DEFAULT_STRUCTURE)` = 13.
- [ ] **Step 5: Implementar `binTree.ts`.** Rodar `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: pure bin tree and sanitize helpers`.

### Task 3: i18n

**Files:**
- Create: `src/i18n/messages.ts`, `src/i18n/useLanguage.ts`
- Test: `src/i18n/useLanguage.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = "pt-BR" | "en" | "de"`
  - `messages: Record<Lang, Messages>` (mesmas chaves nos três; `Messages` = tipo derivado do dicionário `en`)
  - `detectLang(navigatorLang: string, stored: string | null): Lang` — `stored` válido tem prioridade; senão `pt*` → `pt-BR`, `de*` → `de`, resto → `en`.
  - `useLanguage(): { lang: Lang; setLang(l: Lang): void; t: Messages }`

- [ ] **Step 1: Testes** — `detectLang("de-DE", null)` = `"de"`; `detectLang("fr", null)` = `"en"`; `detectLang("en", "pt-BR")` = `"pt-BR"`; `detectLang("en", "xx")` = `"en"`; `messages` têm as mesmas chaves nos três idiomas.
- [ ] **Step 2: Falhar.** 
- [ ] **Step 3: Implementar.** Textos: título, subtítulo, rótulos (projeto, destino, criar, limpar, selecionar pasta, adicionar bin, adicionar sub-bin, renomear, remover), status (criado, erro, sem suporte, pasta selecionada, nome obrigatório), diálogos (confirmar remoção, nome da nova pasta, renomear).
- [ ] **Step 4: Passar testes.** Commit `feat: i18n with pt-BR, en, de`.

### Task 4: Sistema de arquivos

**Files:**
- Create: `src/lib/fileSystem.ts`
- Test: `src/lib/fileSystem.test.ts`

**Interfaces:**
- Produces:
  - `supportsDirectoryPicker(): boolean`
  - `pickDirectory(): Promise<FileSystemDirectoryHandle | null>` (null em cancelamento; lança em outros erros)
  - `createProjectTree(parent: FileSystemDirectoryHandle, projectName: string, nodes: BinNode[]): Promise<void>` — cria `projectName` e depois a árvore recursivamente com `getDirectoryHandle(name, { create: true })`.

- [ ] **Step 1: Teste com handles falsos** — objeto com `getDirectoryHandle` que registra chamadas; verificar ordem e nomes criados para `DEFAULT_STRUCTURE` (inclui `Graficos` dentro de `03_Assets`, conforme o padrão atual). Usar `Graficos` como nome padrão, sem acento, igual ao código atual.
- [ ] **Step 2: Falhar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Passar.** Commit `feat: create bin tree on disk via File System Access API`.

### Task 5: Hook da árvore e componentes

**Files:**
- Create: `src/hooks/useBinTree.ts`, `src/components/Header.tsx`, `src/components/LanguageSwitch.tsx`, `src/components/ProjectForm.tsx`, `src/components/BinTree.tsx`, `src/components/BinToolbar.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/NameDialog.tsx`, `src/components/StatusMessage.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- `useBinTree()` → `{ nodes, selected: Path | null, select(path), addSibling(name), addChild(name), rename(name), remove(), reset() }`. Usa as funções de `binTree.ts`.
- `NameDialog` recebe `{ open, title, initialValue, onSubmit(name), onCancel }`.
- `ConfirmDialog` recebe `{ open, message, onConfirm, onCancel }`.
- `App` mantém: `projectName`, `dirHandle`, `status` (`{ kind: "info" | "success" | "error", text }`), `busy`.

- [ ] **Step 1: Teste de App** — renderiza título e 13 pastas; ao clicar "Adicionar bin" e confirmar nome "Teste" no diálogo, aparece "Teste/".
- [ ] **Step 2: Falhar.**
- [ ] **Step 3: Implementar hook e componentes.** Sem `window.prompt`/`window.confirm`. Ícones lucide. Motion para entrada da árvore e status.
- [ ] **Step 4: Passar testes.** Commit `feat: react UI wired to tree and i18n`.

### Task 6: Estilo e identidade visual

**Files:**
- Modify: `src/styles/index.css`, componentes conforme necessário.

**Interfaces:** Tokens de cor em `:root` (`--bg`, `--surface`, `--text`, `--muted`, `--accent` âmbar `#ffb23f`, `--accent-2` ciano `#7dd3fc`), tema escuro padrão com opção clara. Fontes: IBM Plex Mono e Space Grotesk via Google Fonts.

- [ ] **Step 1:** Aplicar as skills de design do projeto (impeccable, taste-skill, frontend-design) para tipografia, paleta, elementos gráficos e responsividade.
- [ ] **Step 2:** Verificar visualmente em 375px, 768px e 1280px (screenshot via Chrome/preview), nos três idiomas.
- [ ] **Step 3:** Commit `feat: visual redesign`.

### Task 7: Verificação final e publicação de branch

- [ ] **Step 1:** `npm test` → todos passam.
- [ ] **Step 2:** `npm run build` → sem erros.
- [ ] **Step 3:** Remover `index.html`/`script.js`/`style.css` antigos se ainda existirem, atualizar README com instruções de desenvolvimento.
- [ ] **Step 4:** Commit final `docs: update README for v2`.
