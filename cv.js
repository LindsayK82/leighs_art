  // About / CV / Press tabs

  const tabs = [...document.querySelectorAll(".about-tab")];

  function activateTab(name, moveFocus = false) {
    const selected = tabs.find(tab => tab.dataset.tab === name);

    if (!selected) return;

    tabs.forEach(tab => {
      const active = tab === selected;
      const panel = document.getElementById(
        `panel-${tab.dataset.tab}`
      );

      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;

      if (panel) {
        panel.hidden = !active;
      }
    });

    if (moveFocus) {
      selected.focus();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      activateTab(name);
      history.replaceState(null, "", `#${name}`);
    });

    tab.addEventListener("keydown", event => {
      let nextIndex;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();

      const nextTab = tabs[nextIndex];
      activateTab(nextTab.dataset.tab, true);
      history.replaceState(
        null,
        "",
        `#${nextTab.dataset.tab}`
      );
    });
  });

  // Open the correct tab when visiting a URL with a hash
  function activateFromHash() {
    const name = window.location.hash.slice(1) || "about";
    activateTab(name);
  }

  // Respond when the URL hash changes
  window.addEventListener("hashchange", activateFromHash);

  // Open the correct tab when the page first loads
  activateFromHash();