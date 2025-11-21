
import React from 'react';
import { AppSettings } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface ThemeSwitcherProps {
    theme: AppSettings['theme'];
    onChange: (theme: AppSettings['theme']) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onChange }) => {
    // Determina se o tema visual atual é escuro
    // Se for 'dark', é escuro. Se for 'system', verifica a preferência do navegador.
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const toggleTheme = () => {
        // Lógica simples: Se parece escuro, muda para claro. Se parece claro, muda para escuro.
        // Isso remove o estado 'system' ao clicar, dando controle manual direto ao usuário.
        const newTheme = isDark ? 'light' : 'dark';
        onChange(newTheme);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
            title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        >
            {isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>
    );
};

export default ThemeSwitcher;
