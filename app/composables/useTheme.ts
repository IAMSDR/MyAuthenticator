import { defu } from "defu";
import { useLocalStorage } from "@vueuse/core";
import { themeIcons, cssVariableDefaults } from "~/utils/theme";
import { omit } from "#ui/utils";
import colors from "tailwindcss/colors";

function readLocalStorage<T>(key: string, fallback: T): T {
  if (!import.meta.client) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const SAFE_NAME = /^[\w -]{1,50}$/;
const SAFE_HEX = /^#[0-9a-f]{3,8}$/i;
const SAFE_CSS_VAR_KEY = /^--[\w-]+$/;
const SAFE_CSS_VAR_VALUE = /^(?:var\(--[\w-]+\)|#[0-9a-f]{3,8}|[a-z]+)$/i;

function sanitizeCustomColors(input: Record<string, unknown>): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [name, shades] of Object.entries(input)) {
    if (!SAFE_NAME.test(name) || typeof shades !== "object" || !shades) continue;
    const safeShades: Record<string, string> = {};
    for (const [shade, hex] of Object.entries(shades as Record<string, unknown>)) {
      if (/^\d{2,3}$/.test(shade) && typeof hex === "string" && SAFE_HEX.test(hex)) {
        safeShades[shade] = hex;
      }
    }
    if (Object.keys(safeShades).length) result[name] = safeShades;
  }
  return result;
}

function sanitizeCSSVariables(input: { light?: Record<string, unknown>; dark?: Record<string, unknown> }): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const clean = (vars?: Record<string, unknown>) => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(vars || {})) {
      if (SAFE_CSS_VAR_KEY.test(key) && typeof value === "string" && SAFE_CSS_VAR_VALUE.test(value)) {
        result[key] = value;
      }
    }
    return result;
  };
  return { light: clean(input.light), dark: clean(input.dark) };
}

export function useTheme() {
  const appConfig = useAppConfig();
  const colorMode = useColorMode();

  const color = computed(() =>
    colorMode.value === "dark"
      ? (colors as Record<string, Record<number, string>>)[appConfig.ui.colors.neutral]?.[950] ?? "#0a0a0a"
      : "white"
  );

  const aiThemeExtras = useState<Record<string, unknown>>("nuxt-ui-ai-theme", () =>
    readLocalStorage<Record<string, unknown>>("nuxt-ui-ai-theme", {})
  );
  const customColorsData = useState<Record<string, Record<string, string>>>(
    "nuxt-ui-custom-colors",
    () => readLocalStorage<Record<string, Record<string, string>>>("nuxt-ui-custom-colors", {})
  );
  const cssVariablesData = useState<{
    light?: Record<string, string>;
    dark?: Record<string, string>;
  }>("nuxt-ui-css-variables", () =>
    readLocalStorage<{
      light?: Record<string, string>;
      dark?: Record<string, string>;
    }>("nuxt-ui-css-variables", {})
  );

  const _radius = useLocalStorage("nuxt-ui-radius", 0.375);
  const _font = useLocalStorage("nuxt-ui-font", "Public Sans");
  const _iconSet = useLocalStorage("nuxt-ui-icons", "lucide");
  const _blackAsPrimary = useLocalStorage("nuxt-ui-black-as-primary", false);

  const neutralColors = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "taupe",
    "mauve",
    "mist",
    "olive",
  ] as const;

  const neutral = computed({
    get() {
      return appConfig.ui.colors.neutral;
    },
    set(option: string) {
      appConfig.ui.colors.neutral = option;
      window.localStorage.setItem("nuxt-ui-neutral", appConfig.ui.colors.neutral);
    },
  });

  const colorsToOmit = [
    "inherit",
    "current",
    "transparent",
    "black",
    "white",
    ...neutralColors,
  ];
  const primaryColors = Object.keys(omit(colors, colorsToOmit as unknown as (keyof typeof colors)[]));

  const primary = computed({
    get() {
      return appConfig.ui.colors.primary;
    },
    set(option: string) {
      appConfig.ui.colors.primary = option;
      window.localStorage.setItem("nuxt-ui-primary", appConfig.ui.colors.primary);
      setBlackAsPrimary(false);
    },
  });

  const radiuses = [0, 0.125, 0.25, 0.375, 0.5];
  const radius = computed({
    get() {
      return _radius.value;
    },
    set(option: number) {
      _radius.value = option;
    },
  });

  const fonts = ["Public Sans", "DM Sans", "Geist", "Inter", "Poppins", "Outfit", "Raleway"];

  const font = computed({
    get() {
      return _font.value;
    },
    set(option: string) {
      _font.value = option;
    },
  });

  const icons = [
    {
      label: "Lucide",
      icon: "i-lucide-feather",
      value: "lucide",
    },
    {
      label: "Phosphor",
      icon: "i-ph-phosphor-logo",
      value: "phosphor",
    },
    {
      label: "Tabler",
      icon: "i-tabler-brand-tabler",
      value: "tabler",
    },
  ] as const;

  const icon = computed({
    get() {
      return _iconSet.value;
    },
    set(option: string) {
      _iconSet.value = option;
      const mapping = (themeIcons as Record<string, Record<string, string>>)[option];
      if (mapping && appConfig.ui.icons) {
        Object.assign(appConfig.ui.icons, mapping);
      }
    },
  });

  const modes = computed(() => [
    { label: "light", icon: (appConfig.ui.icons as Record<string, string> | undefined)?.light ?? "i-lucide-sun" },
    { label: "dark", icon: (appConfig.ui.icons as Record<string, string> | undefined)?.dark ?? "i-lucide-moon" },
    { label: "system", icon: (appConfig.ui.icons as Record<string, string> | undefined)?.system ?? "i-lucide-monitor" },
  ]);

  const mode = computed({
    get() {
      return colorMode.preference;
    },
    set(option: string) {
      colorMode.preference = option;
    },
  });

  const blackAsPrimary = computed(() => _blackAsPrimary.value);

  function setBlackAsPrimary(value: boolean) {
    _blackAsPrimary.value = value;
  }

  const hasCustomColors = computed(() => Object.keys(customColorsData.value).length > 0);
  const hasCSSVariables = computed(
    () =>
      Object.keys(cssVariablesData.value.light || {}).length > 0 ||
      Object.keys(cssVariablesData.value.dark || {}).length > 0
  );

  const radiusStyle = computed(() => `:root { --ui-radius: ${_radius.value}rem; }`);
  const blackAsPrimaryStyle = computed(() =>
    _blackAsPrimary.value
      ? `:root { --ui-primary: black; } .dark { --ui-primary: white; }`
      : ":root {}"
  );
  const fontStyle = computed(() => `:root { --font-sans: '${_font.value}', sans-serif; }`);
  const customColorsStyle = computed(() => {
    const entries = Object.entries(customColorsData.value);
    if (!entries.length) return "";
    const vars = entries.flatMap(([name, shades]) =>
      Object.entries(shades).map(([shade, hex]) => `--color-${name}-${shade}: ${hex};`)
    );
    return `:root { ${vars.join(" ")} }`;
  });
  const cssVariablesStyle = computed(() => {
    const data = cssVariablesData.value;
    const parts: string[] = [];
    if (Object.keys(data.light || {}).length) {
      const full = { ...cssVariableDefaults.light, ...data.light };
      parts.push(`.light { ${Object.entries(full).map(([k, v]) => `${k}: ${v};`).join(" ")} }`);
    }
    if (Object.keys(data.dark || {}).length) {
      const full = { ...cssVariableDefaults.dark, ...data.dark };
      parts.push(`.dark { ${Object.entries(full).map(([k, v]) => `${k}: ${v};`).join(" ")} }`);
    }
    return parts.join(" ");
  });

  const link = computed(() => {
    const name = _font.value;
    if (name === "Public Sans") return [];
    return [
      {
        rel: "stylesheet" as const,
        href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700&display=swap`,
        id: `font-${name.toLowerCase().replace(/\s+/g, "-")}`,
      },
    ];
  });

  const style = [
    { innerHTML: radiusStyle, id: "nuxt-ui-radius", tagPriority: -2 },
    { innerHTML: blackAsPrimaryStyle, id: "nuxt-ui-black-as-primary", tagPriority: -2 },
    { innerHTML: fontStyle, id: "nuxt-ui-font", tagPriority: -2 },
    { innerHTML: customColorsStyle, id: "chat-custom-colors", tagPriority: -2 },
    { innerHTML: cssVariablesStyle, id: "chat-css-variables", tagPriority: -2 },
  ];

  const hasChanges = computed(() => {
    return (
      appConfig.ui.colors.primary !== "green" ||
      appConfig.ui.colors.neutral !== "neutral" ||
      _radius.value !== 0.375 ||
      _font.value !== "Public Sans" ||
      _iconSet.value !== "lucide" ||
      _blackAsPrimary.value ||
      hasCustomColors.value ||
      hasCSSVariables.value ||
      Object.keys(aiThemeExtras.value).length > 0
    );
  });

  function resetTheme() {
    primary.value = "green";
    window.localStorage.removeItem("nuxt-ui-primary");

    neutral.value = "neutral";
    window.localStorage.removeItem("nuxt-ui-neutral");

    _radius.value = 0.375;
    window.localStorage.removeItem("nuxt-ui-radius");

    _font.value = "Public Sans";
    window.localStorage.removeItem("nuxt-ui-font");

    _iconSet.value = "lucide";
    window.localStorage.removeItem("nuxt-ui-icons");
    if (appConfig.ui.icons) {
      Object.assign(appConfig.ui.icons, themeIcons.lucide);
    }

    // Clean up auxiliary colors added by AI theme
    const colorKeys = ["secondary", "success", "info", "warning", "error"] as const;
    for (const c of colorKeys) {
      if ((appConfig.ui.colors as Record<string, unknown>)[c]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (appConfig.ui.colors as Record<string, unknown>)[c];
      }
    }

    setBlackAsPrimary(false);
    window.localStorage.removeItem("nuxt-ui-black-as-primary");

    window.localStorage.removeItem("nuxt-ui-ai-theme");
    window.localStorage.removeItem("nuxt-ui-custom-colors");
    window.localStorage.removeItem("nuxt-ui-css-variables");
    aiThemeExtras.value = {};
    customColorsData.value = {};
    cssVariablesData.value = {};

    if (import.meta.client) {
      document.getElementById("chat-css-variables")?.replaceChildren();
      document.getElementById("chat-custom-colors")?.replaceChildren();
    }
  }

  function injectCustomColors(customColors: Record<string, Record<string, string>>) {
    const merged = { ...customColorsData.value, ...customColors };
    customColorsData.value = merged;
    window.localStorage.setItem("nuxt-ui-custom-colors", JSON.stringify(merged));
  }

  function injectCSSVariables(cssVariables: { light?: Record<string, string>; dark?: Record<string, string> }) {
    const merged = {
      light: { ...cssVariablesData.value.light, ...cssVariables.light },
      dark: { ...cssVariablesData.value.dark, ...cssVariables.dark },
    };
    cssVariablesData.value = merged;
    window.localStorage.setItem("nuxt-ui-css-variables", JSON.stringify(merged));
  }

  function applyThemeSettings(settings: Record<string, unknown>) {
    if (settings.customColors && typeof settings.customColors === "object") {
      const safeCustomColors = sanitizeCustomColors(settings.customColors as Record<string, unknown>);
      if (Object.keys(safeCustomColors).length) injectCustomColors(safeCustomColors);
    }

    if (settings.cssVariables && typeof settings.cssVariables === "object") {
      injectCSSVariables(sanitizeCSSVariables(settings.cssVariables as { light?: Record<string, unknown>; dark?: Record<string, unknown> }));
    }

    if (typeof settings.primary === "string" && SAFE_NAME.test(settings.primary)) primary.value = settings.primary;
    if (typeof settings.neutral === "string" && (neutralColors as readonly string[]).includes(settings.neutral)) neutral.value = settings.neutral;
    if (settings.radius !== undefined && Number.isFinite(Number(settings.radius))) radius.value = Number(settings.radius);
    if (typeof settings.font === "string" && SAFE_NAME.test(settings.font)) font.value = settings.font;
    if (typeof settings.icons === "string" && settings.icons in themeIcons) icon.value = settings.icons;
    if (settings.blackAsPrimary !== undefined) setBlackAsPrimary(!!settings.blackAsPrimary);

    const colorKeys = ["secondary", "success", "info", "warning", "error"] as const;
    const savedExtras: Record<string, unknown> = { ...aiThemeExtras.value };

    for (const c of colorKeys) {
      const val = settings[c];
      if (typeof val === "string" && SAFE_NAME.test(val)) {
        (appConfig.ui.colors as Record<string, unknown>)[c] = val;
        savedExtras.colors = (savedExtras.colors || {}) as Record<string, unknown>;
        (savedExtras.colors as Record<string, unknown>)[c] = val;
      }
    }

    if (settings.ui && typeof settings.ui === "object") {
      savedExtras.ui = (savedExtras.ui || {}) as Record<string, unknown>;
      for (const [key, value] of Object.entries(settings.ui as Record<string, unknown>)) {
        if (key === "colors" || key === "__proto__" || key === "constructor" || key === "prototype") continue;

        const merged = defu(
          value as Record<string, unknown>,
          ((appConfig.ui as Record<string, unknown>)[key] || {}) as Record<string, unknown>,
          ((savedExtras.ui as Record<string, unknown>)[key] || {}) as Record<string, unknown>
        );
        (appConfig.ui as Record<string, unknown>)[key] = merged;
        (savedExtras.ui as Record<string, unknown>)[key] = merged;
      }
    }

    aiThemeExtras.value = savedExtras;
    window.localStorage.setItem("nuxt-ui-ai-theme", JSON.stringify(savedExtras));
  }

  return {
    color,
    style,
    link,
    neutralColors,
    neutral,
    primaryColors,
    primary,
    blackAsPrimary,
    setBlackAsPrimary,
    radiuses,
    radius,
    fonts,
    font,
    icon,
    icons,
    modes,
    mode,
    hasChanges,
    applyThemeSettings,
    resetTheme,
  };
}
