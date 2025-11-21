
import React from 'react';
import { createPortal } from 'react-dom';

export interface ActionButton {
    label: string;
    onClick: () => void;
    style?: 'primary' | 'danger' | 'secondary' | 'warning';
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    actions: ActionButton[];
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, onClose, title, message, actions 
}) => {
    if (!isOpen) return null;

    const getButtonClass = (style: ActionButton['style']) => {
        switch (style) {
            case 'primary':
                return 'bg-primary text-white hover:bg-blue-600 shadow-md shadow-blue-500/20';
            case 'danger':
                return 'bg-danger text-white hover:bg-red-600 shadow-md shadow-red-500/20';
            case 'warning':
                return 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20';
            case 'secondary':
            default:
                return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600';
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    {/* Botão de cancelar sempre aparece por padrão */}
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2.5 rounded-xl font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Cancelar
                    </button>
                    {/* Renderiza os botões de ação personalizados */}
                    {actions.map((action, index) => (
                        <button 
                            key={index}
                            onClick={action.onClick} 
                            className={`px-4 py-2.5 rounded-xl font-bold transition-colors ${getButtonClass(action.style)}`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmationModal;
