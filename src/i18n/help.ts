import type { Lang } from './messages'

/** A key combination and what it does. */
export type HelpShortcut = readonly [keys: string, action: string]

export type HelpSection = {
  heading: string
  steps?: string[]
  items?: string[]
  shortcuts?: HelpShortcut[]
}

export type HelpContent = { title: string; sections: HelpSection[] }

/** The in-app guide. Every language has the same sections in the same order. */
export const HELP: Record<Lang, HelpContent> = {
  en: {
    title: 'How to use Resolve Organizer',
    sections: [
      {
        heading: 'Start here',
        steps: [
          'Type the project name in Project name.',
          'Choose the destination folder with Choose folder.',
          'Shape the bins in the graph, or start from a template.',
          'Press Render project. Enter in the name field does the same.',
        ],
        items: ['Rendering creates the project folder in the destination, with one folder for every connected bin.'],
      },
      {
        heading: 'The bin graph',
        items: [
          'Each box is a bin. The project name is the root, and top-level bins hang from it.',
          'Drag a bin to move it. Its place is kept until you press Auto-arrange.',
          'Drop a bin onto another bin to nest it. It becomes a sub-bin, joined by a line.',
          'Double-click a bin to rename it.',
          'The + inside a bin adds a loose bin: a new bin with no line to anything.',
          'Loose bins sit in the dashed lane on the right. They are not rendered until you drop them onto a bin.',
          'Select several bins with Shift + click, or Shift + drag over the empty background. Drag one of them to move the group.',
          'Drag the empty background to pan. Zoom and Spacing change how the graph looks.',
          'Undo and Redo sit above the graph. Auto-arrange returns moved bins to the automatic layout. Fit shows the whole graph.',
          'On narrow screens the bins appear as an indented list, with the same actions.',
        ],
      },
      {
        heading: 'Templates',
        items: [
          'Default is the starting structure, with 13 folders. Reset clears the name and destination and brings it back.',
          'Documentary, Commercial and Music video are ready-made structures for those kinds of projects.',
          'Save as template keeps the connected bins as a template of your own. Loose bins are left out.',
          'Export JSON downloads the structure as a file, and Import JSON loads one. Remove your own templates with their × button.',
        ],
      },
      {
        heading: 'Checks',
        items: [
          'The output preview shows the folder path of the selected bin.',
          'A warning appears when bins share a number, such as two 05_ folders.',
          'A warning appears when the folder already exists. Rendering adds the bins inside it; nothing is deleted.',
        ],
      },
      {
        heading: 'Browsers',
        items: [
          'Choosing a folder needs Chrome, Edge or a recent Safari. You can still edit the structure in any browser.',
        ],
      },
      {
        heading: 'Keyboard shortcuts',
        shortcuts: [
          ['N', 'Add a loose bin'],
          ['Enter or F2', 'Rename the selected bin'],
          ['Delete or Backspace', 'Remove the selected bin (asks first)'],
          ['↑ ↓', 'Select the previous or next bin'],
          ['→ ←', 'Go into the first sub-bin, or back to its parent'],
          ['Alt + ↑ ↓', 'Move the selected bin among its siblings'],
          ['L', 'Detach the selected sub-bin, so it becomes loose'],
          ['Ctrl/⌘ + Z', 'Undo'],
          ['Ctrl/⌘ + Y or Ctrl/⌘ + Shift + Z', 'Redo'],
          ['Shift + click', 'Add or remove a bin from the selection'],
          ['Shift + drag', 'Select an area of the graph'],
          ['Enter in the name field', 'Render the project'],
          ['Esc', 'Close a dialog'],
        ],
      },
    ],
  },
  'pt-BR': {
    title: 'Como usar o Resolve Organizer',
    sections: [
      {
        heading: 'Comece aqui',
        steps: [
          'Digite o nome do projeto em Nome do projeto.',
          'Escolha a pasta de destino em Escolher pasta.',
          'Monte os bins no grafo, ou comece de um modelo.',
          'Clique em Renderizar projeto. Enter no campo do nome faz o mesmo.',
        ],
        items: ['Renderizar cria a pasta do projeto no destino, com uma pasta para cada bin conectado.'],
      },
      {
        heading: 'O grafo de bins',
        items: [
          'Cada caixa é um bin. O nome do projeto é a raiz, e os bins do topo saem dele.',
          'Arraste um bin para movê-lo. A posição fica até você clicar em Organizar automaticamente.',
          'Solte um bin sobre outro para aninhá-lo. Ele vira sub-bin, ligado por uma linha.',
          'Clique duas vezes em um bin para renomeá-lo.',
          'O + dentro de um bin adiciona um bin solto: um bin novo, sem linha para nada.',
          'Os bins soltos ficam na faixa tracejada à direita. Só entram na pasta quando você os solta sobre um bin.',
          'Selecione vários com Shift + clique, ou Shift + arrastar sobre o fundo vazio. Arraste um deles para mover o grupo.',
          'Arraste o fundo vazio para deslocar a visão. Zoom e Espaçamento mudam a aparência do grafo.',
          'Desfazer e Refazer ficam acima do grafo. Ajustar mostra o grafo inteiro.',
          'Em telas estreitas os bins aparecem como lista com recuo, com as mesmas ações.',
        ],
      },
      {
        heading: 'Modelos',
        items: [
          'Padrão é a estrutura inicial, com 13 pastas. Limpar apaga o nome e o destino e volta para ela.',
          'Documentário, Comercial e Videoclipe são estruturas prontas para esses tipos de projeto.',
          'Salvar como modelo guarda os bins conectados como um modelo seu. Os bins soltos ficam de fora.',
          'Exportar JSON baixa a estrutura como arquivo, e Importar JSON carrega um. Remova seus modelos com o botão ×.',
        ],
      },
      {
        heading: 'Verificações',
        items: [
          'A prévia de saída mostra o caminho da pasta do bin selecionado.',
          'Um aviso aparece quando bins repetem o número, como duas pastas 05_.',
          'Um aviso aparece quando a pasta já existe. A renderização adiciona os bins dentro dela; nada é apagado.',
        ],
      },
      {
        heading: 'Navegadores',
        items: [
          'Escolher a pasta exige Chrome, Edge ou um Safari recente. Você ainda pode editar a estrutura em qualquer navegador.',
        ],
      },
      {
        heading: 'Atalhos de teclado',
        shortcuts: [
          ['N', 'Adicionar um bin solto'],
          ['Enter ou F2', 'Renomear o bin selecionado'],
          ['Delete ou Backspace', 'Remover o bin selecionado (pede confirmação)'],
          ['↑ ↓', 'Selecionar o bin anterior ou o próximo'],
          ['→ ←', 'Entrar no primeiro sub-bin, ou voltar ao pai'],
          ['Alt + ↑ ↓', 'Mover o bin selecionado entre os irmãos'],
          ['L', 'Desconectar o sub-bin selecionado, deixando-o solto'],
          ['Ctrl/⌘ + Z', 'Desfazer'],
          ['Ctrl/⌘ + Y ou Ctrl/⌘ + Shift + Z', 'Refazer'],
          ['Shift + clique', 'Adicionar ou remover um bin da seleção'],
          ['Shift + arrastar', 'Selecionar uma área do grafo'],
          ['Enter no campo do nome', 'Renderizar o projeto'],
          ['Esc', 'Fechar um diálogo'],
        ],
      },
    ],
  },
  de: {
    title: 'So benutzt du Resolve Organizer',
    sections: [
      {
        heading: 'Los geht’s',
        steps: [
          'Gib den Projektnamen unter Projektname ein.',
          'Wähle den Zielordner mit Ordner wählen.',
          'Baue die Bins im Graphen auf, oder starte mit einer Vorlage.',
          'Klicke auf Projekt rendern. Enter im Namensfeld macht dasselbe.',
        ],
        items: ['Beim Rendern entsteht der Projektordner im Ziel, mit einem Ordner für jeden verbundenen Bin.'],
      },
      {
        heading: 'Der Bin-Graph',
        items: [
          'Jedes Feld ist ein Bin. Der Projektname ist die Wurzel, und die obersten Bins hängen daran.',
          'Ziehe ein Bin, um es zu verschieben. Seine Position bleibt, bis du Automatisch anordnen klickst.',
          'Lege ein Bin auf einem anderen ab, um es zu verschachteln. Es wird ein Unterbin, mit einer Linie verbunden.',
          'Doppelklick auf ein Bin benennt es um.',
          'Das + in einem Bin fügt einen losen Bin hinzu: einen neuen Bin ohne Linie zu irgendetwas.',
          'Lose Bins stehen gestrichelt in der Spalte rechts. Sie werden erst angelegt, wenn du sie auf ein Bin legst.',
          'Mehrere auswählen mit Umschalt + Klick, oder Umschalt + Ziehen über den leeren Hintergrund. Ziehe eines davon, um die Gruppe zu verschieben.',
          'Ziehe den leeren Hintergrund, um den Ausschnitt zu verschieben. Zoom und Abstand ändern das Aussehen des Graphen.',
          'Rückgängig und Wiederholen liegen über dem Graphen. Einpassen zeigt den ganzen Graphen.',
          'Auf schmalen Bildschirmen erscheinen die Bins als eingerückte Liste, mit denselben Aktionen.',
        ],
      },
      {
        heading: 'Vorlagen',
        items: [
          'Standard ist die Startstruktur mit 13 Ordnern. Zurücksetzen leert Namen und Ziel und stellt sie wieder her.',
          'Dokumentation, Werbespot und Musikvideo sind fertige Strukturen für diese Projektarten.',
          'Als Vorlage speichern behält die verbundenen Bins als eigene Vorlage. Lose Bins bleiben außen vor.',
          'JSON exportieren lädt die Struktur als Datei herunter, JSON importieren lädt eine Datei. Eigene Vorlagen entfernst du mit dem ×-Knopf.',
        ],
      },
      {
        heading: 'Prüfungen',
        items: [
          'Die Vorschau der Ausgabe zeigt den Ordnerpfad des gewählten Bins.',
          'Eine Warnung erscheint, wenn Bins dieselbe Nummer tragen, etwa zwei 05_-Ordner.',
          'Eine Warnung erscheint, wenn der Ordner schon existiert. Beim Rendern kommen die Bins hinein; nichts wird gelöscht.',
        ],
      },
      {
        heading: 'Browser',
        items: [
          'Für die Ordnerauswahl brauchst du Chrome, Edge oder einen aktuellen Safari. Die Struktur lässt sich in jedem Browser bearbeiten.',
        ],
      },
      {
        heading: 'Tastenkürzel',
        shortcuts: [
          ['N', 'Losen Bin hinzufügen'],
          ['Enter oder F2', 'Gewählten Bin umbenennen'],
          ['Entf oder Rücktaste', 'Gewählten Bin entfernen (fragt vorher nach)'],
          ['↑ ↓', 'Vorherigen oder nächsten Bin wählen'],
          ['→ ←', 'In den ersten Unterbin wechseln, oder zurück zum Elternbin'],
          ['Alt + ↑ ↓', 'Gewählten Bin unter seinen Geschwistern verschieben'],
          ['L', 'Gewählten Unterbin lösen, sodass er lose wird'],
          ['Strg/⌘ + Z', 'Rückgängig'],
          ['Strg/⌘ + Y oder Strg/⌘ + Umschalt + Z', 'Wiederholen'],
          ['Umschalt + Klick', 'Bin zur Auswahl hinzufügen oder entfernen'],
          ['Umschalt + Ziehen', 'Bereich im Graphen auswählen'],
          ['Enter im Namensfeld', 'Projekt rendern'],
          ['Esc', 'Dialog schließen'],
        ],
      },
    ],
  },
}
