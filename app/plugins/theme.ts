import { defu } from "defu";
import colors from "tailwindcss/colors";
import { themeIcons, cssVariableDefaults } from "~/utils/theme";

const palette: Record<string, Record<number | string, string>> = {};
for (const [name, val] of Object.entries(colors)) {
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    palette[name] = val as Record<number | string, string>;
  }
}

const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export default defineNuxtPlugin({
  enforce: "pre",
  setup() {
    const appConfig = useAppConfig();

    if (import.meta.client) {
      const primary = localStorage.getItem("nuxt-ui-primary");
      if (primary) appConfig.ui.colors.primary = primary;

      const neutral = localStorage.getItem("nuxt-ui-neutral");
      if (neutral) appConfig.ui.colors.neutral = neutral;

      const icons = localStorage.getItem("nuxt-ui-icons");
      if (icons && icons in themeIcons) {
        Object.assign(appConfig.ui.icons, (themeIcons as Record<string, Record<string, string>>)[icons]);
      }

      function restoreState<T>(key: string) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const state = useState<T>(key);
            state.value = JSON.parse(raw);
          }
        } catch {
          // ignore malformed localStorage
        }
      }

      restoreState("nuxt-ui-ai-theme");
      restoreState("nuxt-ui-custom-colors");
      restoreState("nuxt-ui-css-variables");

      try {
        const extras = JSON.parse(localStorage.getItem("nuxt-ui-ai-theme") || "{}");
        if (extras.colors) {
          for (const [key, value] of Object.entries(extras.colors)) {
            (appConfig.ui.colors as Record<string, unknown>)[key] = value;
          }
        }
        if (extras.ui) {
          onNuxtReady(() => {
            for (const [key, value] of Object.entries(extras.ui)) {
              if (key === "colors" || key === "icons") continue;
              (appConfig.ui as Record<string, unknown>)[key] = defu(
                value as Record<string, unknown>,
                ((appConfig.ui as Record<string, unknown>)[key] || {}) as Record<string, unknown>
              );
            }
          });
        }
      } catch {
        // ignore malformed localStorage
      }
    }

    if (import.meta.server) {
      const paletteJson = JSON.stringify(palette);
      const shadesJson = JSON.stringify(shades);

      useHead({
        script: [
          {
            innerHTML: `
            (function() {
              var primaryColor = localStorage.getItem('nuxt-ui-primary');
              var neutralColor = localStorage.getItem('nuxt-ui-neutral');
              if (!primaryColor && !neutralColor) return;
              var palette = ${paletteJson};
              var shades = ${shadesJson};
              function swapColors(el) {
                var html = el.innerHTML;
                if (primaryColor && primaryColor !== 'black' && palette[primaryColor]) {
                  var p = palette[primaryColor];
                  for (var i = 0; i < shades.length; i++) {
                    var s = shades[i];
                    var reg = new RegExp('(--ui-color-primary-' + s + ':\\\\s*var\\\\(--color-)[^,]+,\\\\s*[^;]+;', 'g');
                    html = html.replace(reg, function(m, prefix) {
                      return prefix + primaryColor + '-' + s + ', ' + p[s] + ');';
                    });
                  }
                }
                if (neutralColor && palette[neutralColor]) {
                  var n = palette[neutralColor];
                  var target = neutralColor === 'neutral' ? 'old-neutral' : neutralColor;
                  for (var j = 0; j < shades.length; j++) {
                    var sn = shades[j];
                    var regN = new RegExp('(--ui-color-neutral-' + sn + ':\\\\s*var\\\\(--color-)[^,]+,\\\\s*[^;]+;', 'g');
                    html = html.replace(regN, function(m, prefix) {
                      return prefix + target + '-' + sn + ', ' + n[sn] + ');';
                    });
                  }
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
            tagPriority: -1,
          },
          {
            innerHTML: `
            if (localStorage.getItem('nuxt-ui-radius')) {
              var el = document.querySelector('style#nuxt-ui-radius');
              if (el) { el.innerHTML = ':root { --ui-radius: ' + localStorage.getItem('nuxt-ui-radius') + 'rem; }'; }
            }
            `.replace(/\s+/g, " "),
            type: "text/javascript",
            tagPriority: -1,
          },
          {
            innerHTML: `
            var bapEl = document.querySelector('style#nuxt-ui-black-as-primary');
            if (bapEl) {
              if (localStorage.getItem('nuxt-ui-black-as-primary') === 'true') {
                bapEl.innerHTML = ':root { --ui-primary: black; } .dark { --ui-primary: white; }';
              } else {
                bapEl.innerHTML = '';
              }
            }
            `.replace(/\s+/g, " "),
            type: "text/javascript",
          },
          {
            innerHTML: [
              "if (localStorage.getItem('nuxt-ui-font')) {",
              "var font = localStorage.getItem('nuxt-ui-font');",
              "var fontEl = document.querySelector('style#nuxt-ui-font');",
              "if (fontEl) { fontEl.innerHTML = ':root { --font-sans: \\'' + font + '\\', sans-serif; }'; }",
              "if (font !== 'Public Sans') {",
              "var lnk = document.createElement('link');",
              "lnk.rel = 'stylesheet';",
              "lnk.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;500;600;700&display=swap';",
              "lnk.id = 'font-' + font.toLowerCase().replace(/\\s+/g, '-');",
              "document.head.appendChild(lnk);",
              "}}",
            ].join(" "),
          },
          {
            innerHTML: `
            (function() {
              var raw = localStorage.getItem('nuxt-ui-custom-colors');
              if (raw) {
                try {
                  var colors = JSON.parse(raw);
                  var vars = [];
                  for (var name in colors) {
                    for (var shade in colors[name]) {
                      vars.push('--color-' + name + '-' + shade + ': ' + colors[name][shade] + ';');
                    }
                  }
                  if (vars.length) {
                    var el = document.getElementById('chat-custom-colors');
                    if (el) { el.textContent = ':root { ' + vars.join(' ') + ' }'; }
                  }
                } catch(e) {}
              }
            })();
            `.replace(/\s+/g, " "),
            type: "text/javascript",
            tagPriority: -1,
          },
          {
            innerHTML: `
            (function() {
              var raw = localStorage.getItem('nuxt-ui-css-variables');
              if (raw) {
                try {
                  var cssVars = JSON.parse(raw);
                  var defaults = ${JSON.stringify(cssVariableDefaults)};
                  function merge(defs, overrides) {
                    var result = [];
                    for (var key in defs) { result.push(key + ': ' + (overrides[key] || defs[key]) + ';'); }
                    for (var key in overrides) { if (!defs[key]) result.push(key + ': ' + overrides[key] + ';'); }
                    return result;
                  }
                  var parts = [];
                  if (cssVars.light && Object.keys(cssVars.light).length) {
                    parts.push('.light { ' + merge(defaults.light, cssVars.light).join(' ') + ' }');
                  }
                  if (cssVars.dark && Object.keys(cssVars.dark).length) {
                    parts.push('.dark { ' + merge(defaults.dark, cssVars.dark).join(' ') + ' }');
                  }
                  if (parts.length) {
                    var el = document.getElementById('chat-css-variables');
                    if (el) { el.textContent = parts.join(' '); }
                  }
                } catch(e) {}
              }
            })();
            `.replace(/\s+/g, " "),
            type: "text/javascript",
            tagPriority: -1,
          },
        ],
      });
    }
  },
});
