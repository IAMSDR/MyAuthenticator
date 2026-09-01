// Inline theme icons like docs/app/utils/theme.ts - fallback for icons persistence
const themeIconsFallback: Record<string, Record<string, string>> = {
  lucide: {
    light: "i-lucide-sun",
    dark: "i-lucide-moon",
    system: "i-lucide-monitor",
  },
  phosphor: {
    light: "i-ph-sun",
    dark: "i-ph-moon",
    system: "i-ph-monitor",
  },
  tabler: {
    light: "i-tabler-sun",
    dark: "i-tabler-moon",
    system: "i-tabler-device-desktop",
  },
};

export default defineNuxtPlugin({
  enforce: "post",
  setup() {
    const appConfig = useAppConfig();

    if (import.meta.client) {
      // Restore primary / neutral like docs/app/plugins/theme.ts
      const primary = localStorage.getItem("nuxt-ui-primary");
      if (primary) appConfig.ui.colors.primary = primary;

      const neutral = localStorage.getItem("nuxt-ui-neutral");
      if (neutral) appConfig.ui.colors.neutral = neutral;

      const radius = localStorage.getItem("nuxt-ui-radius");
      if (radius) {
        const parsed = Number.parseFloat(radius);
        if (!Number.isNaN(parsed)) appConfig.theme.radius = parsed;
      }

      const blackAsPrimary = localStorage.getItem("nuxt-ui-black-as-primary");
      if (blackAsPrimary) {
        appConfig.theme.blackAsPrimary = blackAsPrimary === "true";
      }

      // Font & icons - handle both plain and JSON-stringified values
      const tryParseString = (raw: string | null): string | null => {
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === "string") return parsed;
          return raw;
        } catch {
          return raw;
        }
      };

      const fontRaw = localStorage.getItem("nuxt-ui-font");
      const font = tryParseString(fontRaw);
      // font style is handled by app.vue / ThemePicker watchEffect, no need to set appConfig here

      const iconsRaw = localStorage.getItem("nuxt-ui-icons");
      const icons = tryParseString(iconsRaw);
      if (icons) {
        const mapping = themeIconsFallback[icons as keyof typeof themeIconsFallback];
        if (mapping && appConfig.ui.icons) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          appConfig.ui.icons = { ...appConfig.ui.icons, ...mapping } as any;
        }
      }

      // Restore extra states like docs (for reset compatibility)
      const restoreState = <T,>(key: string) => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const state = useState<T>(key);
            state.value = JSON.parse(raw);
          }
        } catch {
          // ignore malformed
        }
      };
      restoreState("nuxt-ui-ai-theme");
      restoreState("nuxt-ui-custom-colors");
      restoreState("nuxt-ui-css-variables");

      // Apply font style immediately if font persisted (FOUC avoid, secondary to server script)
      if (font && font !== "Public Sans") {
        let el = document.getElementById("nuxt-ui-font") as HTMLStyleElement | null;
        if (!el) {
          el = document.createElement("style");
          el.id = "nuxt-ui-font";
          document.head.appendChild(el);
        }
        el.innerHTML = `:root { --font-sans: '${font}', sans-serif; }`;
      }
    }

    if (import.meta.server) {
      // Inline scripts to prevent FOUC - mirrors docs/app/plugins/theme.ts exactly
      // Must run AFTER style#nuxt-ui-colors (critical) so swap is synchronous, not via async observer
      // Use high tagPriority (100) to ensure after critical styles
      useHead({
        script: [
          {
            innerHTML: `
            (function() {
              var primaryColor = localStorage.getItem('nuxt-ui-primary');
              var neutralColor = localStorage.getItem('nuxt-ui-neutral');
              if (!primaryColor && !neutralColor) return;
              function swapColors(el) {
                var html = el.innerHTML;
                if (primaryColor && primaryColor !== 'black') {
                  html = html.replace(
                    /(--ui-color-primary-\\d{2,3}:\\s*var\\(--color-)${appConfig.ui.colors.primary}(-\\d{2,3}.*?\\))/g,
                    \`$1\${primaryColor}$2\`
                  );
                }
                if (neutralColor) {
                  var neutralSearch = "${appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral}";
                  var neutralReplace = neutralColor === 'neutral' ? 'old-neutral' : neutralColor;
                  html = html.replace(
                    new RegExp('(--ui-color-neutral-\\\\d{2,3}:\\\\s*var\\\\(--color-)' + neutralSearch + '(-\\\\d{2,3}.*?\\\\))', 'g'),
                    '$1' + neutralReplace + '$2'
                  );
                }
                el.innerHTML = html;
              }
              var colorsEl = document.querySelector('style#nuxt-ui-colors');
              if (colorsEl) {
                swapColors(colorsEl);
              } else {
                var obs = new MutationObserver(function(mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    for (var j = 0; j < mutations[i].addedNodes.length; j++) {
                      var node = mutations[i].addedNodes[j];
                      if (node.id === 'nuxt-ui-colors') {
                        swapColors(node);
                        obs.disconnect();
                        return;
                      }
                    }
                  }
                });
                obs.observe(document.head, { childList: true });
              }
            })();
            `.replace(/\s+/g, " "),
            type: "text/javascript",
            tagPriority: 100,
          },
          {
            innerHTML: `
            (function(){
              var v = localStorage.getItem('nuxt-ui-radius');
              if (v) {
                var el = document.querySelector('style#nuxt-ui-radius');
                if (el) el.innerHTML = ':root { --ui-radius: ' + v + 'rem; }';
              }
            })();
            `.replace(/\s+/g, " "),
            type: "text/javascript",
            tagPriority: 100,
          },
          {
            innerHTML: `
            (function(){
              var bapEl = document.querySelector('style#nuxt-ui-black-as-primary');
              if (bapEl) {
                if (localStorage.getItem('nuxt-ui-black-as-primary') === 'true') {
                  bapEl.innerHTML = ':root { --ui-primary: black; } .dark { --ui-primary: white; }';
                } else {
                  bapEl.innerHTML = '';
                }
              }
            })();
            `.replace(/\s+/g, " "),
            type: "text/javascript",
            tagPriority: 100,
          },
          {
            innerHTML: `
            (function(){
              var raw = localStorage.getItem('nuxt-ui-font');
              if (!raw) return;
              var font = raw;
              try { var p = JSON.parse(raw); if (typeof p === 'string') font = p; } catch {}
              var fontEl = document.querySelector('style#nuxt-ui-font');
              if (fontEl) fontEl.innerHTML = ':root { --font-sans: \\'' + font + '\\', sans-serif; }';
              if (font !== 'Public Sans') {
                var lnk = document.createElement('link');
                lnk.rel = 'stylesheet';
                lnk.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;500;600;700&display=swap';
                lnk.id = 'font-' + font.toLowerCase().replace(/\\s+/g, '-');
                document.head.appendChild(lnk);
              }
            })();
            `.replace(/\s+/g, " "),
            type: "text/javascript",
            tagPriority: 100,
          },
        ],
      });
    }
  },
});
