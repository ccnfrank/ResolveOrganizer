const DEFAULT_STRUCTURE = [
  { name: "00_Footage" },
  { name: "01_Proxy" },
  {
    name: "02_Audio",
    children: [{ name: "VO" }, { name: "SFX" }, { name: "Music" }],
  },
  {
    name: "03_Assets",
    children: [{ name: "Graficos" }],
  },
  { name: "04_Imagens" },
  { name: "05_Exports" },
  { name: "05_Documentos" },
  { name: "06_Cache_Proxies" },
  { name: "07_Renders" },
];

const projectNameInput = document.getElementById("projectName");
const destPathInput = document.getElementById("destPath");
const selectFolderBtn = document.getElementById("selectFolderBtn");
const createBtn = document.getElementById("createBtn");
const resetBtn = document.getElementById("resetBtn");
const addSiblingBtn = document.getElementById("addSiblingBtn");
const addChildBtn = document.getElementById("addChildBtn");
const renameBtn = document.getElementById("renameBtn");
const removeBtn = document.getElementById("removeBtn");
const statusEl = document.getElementById("status");
const treeEl = document.getElementById("tree");

let structure = cloneStructure(DEFAULT_STRUCTURE);
let selectedDirectory = null;
let selectedPath = null;
let statusTimer = null;

function cloneStructure(nodes) {
  return nodes.map((node) => ({
    name: node.name,
    children: Array.isArray(node.children) ? cloneStructure(node.children) : undefined,
  }));
}

function isSamePath(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function encodePath(path) {
  return encodeURIComponent(JSON.stringify(path));
}

function decodePath(value) {
  return JSON.parse(decodeURIComponent(value));
}

function setStatus(message, type = "info") {
  clearTimeout(statusTimer);
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  if (type !== "error") {
    statusTimer = setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = "";
        statusEl.className = "status";
      }
    }, 3500);
  }
}

function sanitizeProjectName(value) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();
}

function sanitizeFolderName(value) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();
}

function getNodeAtPath(nodes, path) {
  let currentNodes = nodes;
  let parentNodes = null;
  let node = null;
  let index = -1;

  for (const segment of path) {
    parentNodes = currentNodes;
    index = segment;
    node = currentNodes[index];
    if (!node) {
      return null;
    }
    currentNodes = node.children || [];
  }

  return { node, parentNodes, index };
}

function renderTree(nodes, depth = 0, pathPrefix = []) {
  return nodes
    .map((node, index) => {
      const path = [...pathPrefix, index];
      const selected = isSamePath(path, selectedPath) ? " is-selected" : "";
      const children = Array.isArray(node.children) && node.children.length
        ? `<div class="tree-children">${renderTree(node.children, depth + 1, path)}</div>`
        : "";

      return `
        <div class="tree-node" style="--depth:${depth}">
          <button type="button" class="tree-row${selected}" data-path="${encodePath(path)}">
            <span class="tree-row__connector">${depth === 0 ? (index === nodes.length - 1 ? "└─" : "├─") : (index === nodes.length - 1 ? "└─" : "├─")}</span>
            <span class="tree-row__name">${escapeHtml(node.name)}/</span>
          </button>
          ${children}
        </div>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateMetrics() {
  // Intentionally left minimal; the preview is now purely structural.
}

function renderPreview() {
  const projectName = sanitizeProjectName(projectNameInput.value) || "Project_Name";
  treeEl.innerHTML = `
    <div class="tree-root">📁 ${escapeHtml(projectName)}/</div>
    ${renderTree(structure)}
  `;
  treeEl.classList.remove("is-updating");
  void treeEl.offsetWidth;
  treeEl.classList.add("is-updating");
}

function refreshAll() {
  renderPreview();
}

function updateMetrics() {
  // Kept as a small seam in case we add counters back later.
}

function promptForFolderName(actionLabel, initialValue = "") {
  const value = window.prompt(actionLabel, initialValue);
  if (value === null) return null;
  const cleaned = sanitizeFolderName(value);
  return cleaned || null;
}

function insertSibling(path, name) {
  if (path.length === 0) {
    structure.push({ name });
    return [structure.length - 1];
  }

  const parentPath = path.slice(0, -1);
  const parentNodes = parentPath.length === 0 ? structure : getNodeAtPath(structure, parentPath)?.node?.children;
  if (!parentNodes) return null;

  const index = path[path.length - 1];
  parentNodes.splice(index + 1, 0, { name });
  return [...parentPath, index + 1];
}

function insertChild(path, name) {
  if (path.length === 0) {
    structure.push({ name });
    return [structure.length - 1];
  }

  const target = getNodeAtPath(structure, path);
  if (!target) return null;
  target.node.children = target.node.children || [];
  target.node.children.push({ name });
  return [...path, target.node.children.length - 1];
}

function removeNode(path) {
  if (path.length === 0) return false;

  const parentPath = path.slice(0, -1);
  const parentNodes = parentPath.length === 0 ? structure : getNodeAtPath(structure, parentPath)?.node?.children;
  if (!parentNodes) return false;

  parentNodes.splice(path[path.length - 1], 1);
  return true;
}

function renameNode(path, newName) {
  const target = getNodeAtPath(structure, path);
  if (!target) return false;
  target.node.name = newName;
  return true;
}

async function selectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus("Your browser does not support folder selection. Use Chrome, Edge, or a recent Safari build.", "error");
    return;
  }

  try {
    selectedDirectory = await window.showDirectoryPicker({ mode: "readwrite" });
    destPathInput.value = selectedDirectory.name;
    setStatus(`Selected folder: ${selectedDirectory.name}`, "success");
    refreshAll();
  } catch (error) {
    if (error?.name !== "AbortError") {
      setStatus("Could not select the folder.", "error");
    }
  }
}

async function ensureDirectory(parentHandle, folderName) {
  return parentHandle.getDirectoryHandle(folderName, { create: true });
}

async function createStructure(parentHandle, nodes) {
  for (const node of nodes) {
    const currentHandle = await ensureDirectory(parentHandle, node.name);
    if (Array.isArray(node.children) && node.children.length > 0) {
      await createStructure(currentHandle, node.children);
    }
  }
}

async function createProject() {
  const projectName = sanitizeProjectName(projectNameInput.value);

  if (!projectName) {
    setStatus("Enter the project name.", "error");
    return;
  }

  if (!selectedDirectory) {
    setStatus("Select a destination folder before creating the project.", "error");
    return;
  }

  createBtn.disabled = true;
  selectFolderBtn.disabled = true;
  resetBtn.disabled = true;
  addSiblingBtn.disabled = true;
  addChildBtn.disabled = true;
  renameBtn.disabled = true;
  removeBtn.disabled = true;
  setStatus("Creating structure...", "info");

  try {
    const projectHandle = await ensureDirectory(selectedDirectory, projectName);
    await createStructure(projectHandle, structure);
    setStatus(`Project "${projectName}" created successfully.`, "success");
    projectNameInput.value = "";
    selectedPath = null;
    refreshAll();
  } catch (error) {
    setStatus(`Error creating project: ${error.message || error}`, "error");
  } finally {
    createBtn.disabled = false;
    selectFolderBtn.disabled = false;
    resetBtn.disabled = false;
    addSiblingBtn.disabled = false;
    addChildBtn.disabled = false;
    renameBtn.disabled = false;
    removeBtn.disabled = false;
  }
}

function requireSelectedPath() {
  if (!selectedPath) {
    setStatus("Select a folder in the tree first.", "error");
    return false;
  }
  return true;
}

function setSelectedPath(path) {
  selectedPath = path;
  refreshAll();
}

projectNameInput.addEventListener("input", () => {
  refreshAll();
});

projectNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    createProject();
  }
});

selectFolderBtn.addEventListener("click", selectFolder);
createBtn.addEventListener("click", createProject);

resetBtn.addEventListener("click", () => {
  projectNameInput.value = "";
  structure = cloneStructure(DEFAULT_STRUCTURE);
  selectedDirectory = null;
  selectedPath = null;
  destPathInput.value = "No folder selected";
  refreshAll();
  setStatus("Fields cleared.", "info");
});

addSiblingBtn.addEventListener("click", () => {
  const name = promptForFolderName("New sibling folder name:");
  if (!name) return;

  const targetPath = selectedPath || [];
  const createdPath = insertSibling(targetPath, name);
  if (createdPath) {
    setSelectedPath(createdPath);
  }
  setStatus(`Added folder "${name}".`, "success");
});

addChildBtn.addEventListener("click", () => {
  const name = promptForFolderName("New child folder name:");
  if (!name) return;

  if (!selectedPath) {
    setStatus("Select a folder first to add a child.", "error");
    return;
  }

  const createdPath = insertChild(selectedPath, name);
  if (createdPath) {
    setSelectedPath(createdPath);
  } else {
    refreshAll();
  }
  setStatus(`Added subfolder "${name}".`, "success");
});

renameBtn.addEventListener("click", () => {
  if (!requireSelectedPath()) return;

  const current = getNodeAtPath(structure, selectedPath);
  if (!current) {
    setStatus("Selected folder could not be found.", "error");
    return;
  }

  const name = promptForFolderName("Rename folder:", current.node.name);
  if (!name) return;

  renameNode(selectedPath, name);
  refreshAll();
  setStatus(`Renamed to "${name}".`, "success");
});

removeBtn.addEventListener("click", () => {
  if (!requireSelectedPath()) return;

  const current = getNodeAtPath(structure, selectedPath);
  if (!current) {
    setStatus("Selected folder could not be found.", "error");
    return;
  }

  const confirmed = window.confirm(`Remove folder "${current.node.name}"?`);
  if (!confirmed) return;

  const removed = removeNode(selectedPath);
  if (!removed) {
    setStatus("Could not remove the selected folder.", "error");
    return;
  }

  selectedPath = null;
  refreshAll();
  setStatus(`Removed folder "${current.node.name}".`, "success");
});

treeEl.addEventListener("click", (event) => {
  const target = event.target.closest("[data-path]");
  if (!target) return;

  setSelectedPath(decodePath(target.dataset.path));
  const current = getNodeAtPath(structure, selectedPath);
  if (current) {
    setStatus(`Selected "${current.node.name}".`, "info");
  }
});

refreshAll();
