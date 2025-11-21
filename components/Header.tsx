
import React from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { AppSettings } from '../types';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
    title: string;
    subtitle: string;
    theme: AppSettings['theme'];
    onAddTransaction: () => void;
    onOpenSettings: () => void;
    onThemeChange: (theme: AppSettings['theme']) => void;
    isMutating?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, theme, onAddTransaction, onOpenSettings, onThemeChange, isMutating }) => {
  return (
    <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
            </p>
        </div>
        <div className="flex items-center gap-4">
            <button
                onClick={onAddTransaction}
                disabled={isMutating}
                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-900 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-wait"
            >
                {isMutating ? 'Salvando...' : 'Adicionar Transação'}
            </button>
            <ThemeSwitcher theme={theme} onChange={onThemeChange} />
            <button
                onClick={onOpenSettings}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
                aria-label="Configurações"
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
        </div>
    </header>
  );
};

export default Header;
