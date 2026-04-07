let corpusData = [];
let schemaBrowserData = null;

function renderCorpusTable(items) {
  const body = document.getElementById("corpus-table-body");
  const status = document.getElementById("corpus-status");

  if (!body || !status) {
    return;
  }

  if (!items.length) {
    body.innerHTML = '<tr><td colspan="3" class="empty-state">No papers match the current search.</td></tr>';
    status.textContent = "0 papers shown";
    return;
  }

  body.innerHTML = items.map((item) => `
    <tr>
      <td class="paper-title">${item.title}</td>
      <td>${item.year}</td>
      <td><a class="paper-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Open</a></td>
    </tr>
  `).join("");

  status.textContent = `${items.length} papers shown`;
}

function sortCorpus(items, value) {
  const sorted = [...items];

  if (value === "year-asc") {
    sorted.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
  } else if (value === "title-asc") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }

  return sorted;
}

function updateCorpusView() {
  const searchInput = document.getElementById("corpus-search");
  const sortSelect = document.getElementById("corpus-sort");

  if (!searchInput || !sortSelect) {
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const filtered = corpusData.filter((item) => {
    const haystack = `${item.title} ${item.year}`.toLowerCase();
    return haystack.includes(query);
  });

  renderCorpusTable(sortCorpus(filtered, sortSelect.value));
}

async function loadCorpus() {
  const status = document.getElementById("corpus-status");

  try {
    const response = await fetch("static/data/corpus.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    corpusData = await response.json();
    updateCorpusView();
  } catch (error) {
    if (status) {
      status.textContent = "Failed to load corpus data.";
    }
    console.error("Failed to load corpus:", error);
  }
}

function cleanSchemaText(text) {
  return String(text || "")
    .replace(/`/g, "")
    .replace(/^- /, "")
    .trim();
}

function renderSchemaFields(panel, sections) {
  panel.innerHTML = (sections || []).slice(0, 3).map((section) => `
    <section class="schema-field-section">
      <h3>${cleanSchemaText(section.title)}</h3>
      ${(section.objects || []).map((obj) => `
        <div class="schema-object">
          <h4>${cleanSchemaText(obj.title)}</h4>
          <table class="schema-field-table">
            <thead>
              <tr><th>Field</th><th>Type</th><th>Meaning</th></tr>
            </thead>
            <tbody>
              ${(obj.fields || []).map((field) => `
                <tr>
                  <td><code>${cleanSchemaText(field.field)}</code></td>
                  <td>${cleanSchemaText(field.type)}</td>
                  <td>${cleanSchemaText(field.meaning)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}
    </section>
  `).join("");
}

function renderSchemaExamples(panel, examples) {
  panel.innerHTML = `
    <div class="schema-example-grid">
      ${(examples || []).map((example) => `
        <article class="schema-example-card">
          <h3>${cleanSchemaText(example.paperTitle)}</h3>
          <img src="${example.interfaceImage}" alt="${cleanSchemaText(example.id)} interface">
          <div class="schema-json-links">
            <a class="schema-json-link-card" href="${example.paths.system}" target="_blank" rel="noopener noreferrer">system-spec</a>
            <a class="schema-json-link-card" href="${example.paths.workflow}" target="_blank" rel="noopener noreferrer">intended-workflow</a>
            <a class="schema-json-link-card" href="${example.paths.usage}" target="_blank" rel="noopener noreferrer">case-study</a>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

async function loadSchemaBrowser() {
  if (schemaBrowserData) {
    return schemaBrowserData;
  }

  const response = await fetch("static/schema/schema-browser.json");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  schemaBrowserData = await response.json();

  renderSchemaFields(document.querySelector('[data-schema-panel="fields"]'), schemaBrowserData.fieldDictionary);
  renderSchemaExamples(document.querySelector('[data-schema-panel="examples"]'), schemaBrowserData.examples);

  return schemaBrowserData;
}

function activateSchemaTab(tabName) {
  document.querySelectorAll(".schema-tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.schemaTab === tabName);
  });
  document.querySelectorAll(".schema-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.schemaPanel === tabName);
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    return;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (modalId === "schema-browser-modal") {
    loadSchemaBrowser().catch((error) => {
      const panel = document.querySelector('[data-schema-panel="examples"]');
      if (panel) {
        panel.innerHTML = '<p class="schema-intro">Failed to load schema materials.</p>';
      }
      console.error("Failed to load schema browser:", error);
    });
  }
}

function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

window.addEventListener("scroll", () => {
  const scrollButton = document.querySelector(".scroll-to-top");
  if (!scrollButton) {
    return;
  }

  if (window.pageYOffset > 320) {
    scrollButton.classList.add("visible");
  } else {
    scrollButton.classList.remove("visible");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("corpus-search");
  const sortSelect = document.getElementById("corpus-sort");
  const modalTriggers = document.querySelectorAll("[data-modal-trigger]");
  const modalClosers = document.querySelectorAll("[data-modal-close]");
  const schemaTabs = document.querySelectorAll(".schema-tab");

  if (searchInput) {
    searchInput.addEventListener("input", updateCorpusView);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", updateCorpusView);
  }

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.dataset.modalTrigger);
    });
  });

  modalClosers.forEach((closer) => {
    closer.addEventListener("click", () => {
      closeModal(closer.closest(".modal-shell"));
    });
  });

  schemaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateSchemaTab(tab.dataset.schemaTab);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-shell.is-open").forEach((modal) => {
        closeModal(modal);
      });
    }
  });

  loadCorpus();
});
