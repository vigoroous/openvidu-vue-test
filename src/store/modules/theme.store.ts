import { theme } from '@src/consts/theme.consts';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

type ThemeMode = 'dark' | 'light';

export const useThemeStore = defineStore('theme', () => {
    const themeMode = ref<ThemeMode>((localStorage.getItem('themeMode') as ThemeMode) ?? 'light');

    const toggleTheme = () => {
        localStorage.setItem(
            'themeMode',
            themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
        );

    };

    const colors = computed(() => ({
        ...theme.colors.common,
        ...theme.colors[themeMode.value],
    }));

    return {
        //states
        themeMode,
        colors,

        //actions
        toggleTheme,
    };
});
