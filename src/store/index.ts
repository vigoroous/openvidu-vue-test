import { createPinia } from "pinia";
import { useUserStore } from "./modules/user.store";
import { useThemeStore } from "./modules/theme.store";

export const store = createPinia();

export const themeStore = useThemeStore(store);
export const userStore = useUserStore(store);