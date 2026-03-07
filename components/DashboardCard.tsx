import React, { useRef, useState, useEffect } from 'react';
import { MoveIcon } from './icons/MoveIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';

interface DashboardCardProps {
    title: string;
    children: React.ReactNode;
    cardKey: string;
    cardColor?: string;
    onColorChange?: (cardKey: string, color: string) => void;
    onQuickAdd?: () => void;
    onTitleChange?: (cardKey: string, newTitle: string) => void;
    isAutoHeight?: boolean;
    totalAmount?: number;
    amountType?: 'income' | 'expense' | 'neutral';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, cardKey, cardColor, onColorChange, onQuickAdd, onTitleChange, isAutoHeight = false, totalAmount, amountType = 'neutral' }) => {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(title);

    useEffect(() => {
        setCurrentTitle(title);
    }, [title]);
    
    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (onTitleChange && currentTitle.trim() && currentTitle.trim() !== title) {
            onTitleChange(cardKey, currentTitle.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setCurrentTitle(title); // Reverte para o título original
            setIsEditing(false);
        }
    };
    
    const handleEditClick = () => {
        if (onTitleChange) {
            setCurrentTitle(title);
            setIsEditing(true);
        }
    }

    const stopPropagation = (e: React.MouseEvent | React.FocusEvent) => {
        e.stopPropagation();
    };

    const headerStyle = cardColor ? { backgroundColor: cardColor } : {};
    const textColorClass = "text-gray-900 dark:text-gray-100";

    const formattedTotal = totalAmount !== undefined 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)
        : null;

    const amountColorClass = 
        amountType === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
        amountType === 'expense' ? 'text-rose-600 dark:text-rose-400' :
        'text-gray-500 dark:text-gray-400';

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col ${isAutoHeight ? 'h-auto' : 'h-full'}`}>
            <div 
                className="drag-handle cursor-move px-3 py-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-lg group flex-shrink-0"
                style={headerStyle}
            >
                <div className="flex flex-col min-w-0 mr-2 justify-center">
                    <div className="relative flex items-center gap-2 group/title min-w-0">
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={currentTitle}
                                onChange={(e) => setCurrentTitle(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                className="text-base sm:text-xl font-bold bg-black/10 dark:bg-white/10 px-2 -ml-2 rounded-md focus:outline-none ring-2 ring-primary w-full"
                            />
                        ) : (
                            <h2 
                                className={`edit-title-handle text-base sm:text-xl font-bold ${textColorClass} truncate ${onTitleChange ? 'cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 px-2 -ml-2 rounded-md' : ''}`}
                                onClick={handleEditClick}
                                title={title}
                            >
                                {title}
                            </h2>
                        )}
                        {onTitleChange && !isEditing && (
                            <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
                        )}
                    </div>
                    {formattedTotal && (
                        <span className={`text-[11px] font-semibold opacity-80 truncate -mt-0.5 ml-0.5 ${amountColorClass}`}>
                            {formattedTotal}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {onQuickAdd && (
                        <button 
                            onClick={onQuickAdd} 
                            onMouseDown={stopPropagation}
                            className="p-1.5 sm:p-2 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                            title="Adicionar item"
                        >
                            <PlusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${textColorClass}`} />
                        </button>
                    )}
                    {onColorChange && (
                        <button 
                            className="relative p-1.5 sm:p-2 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                            title="Mudar cor do card"
                            onClick={() => colorInputRef.current?.click()}
                            onMouseDown={stopPropagation}
                        >
                            <PaletteIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${textColorClass}`} />
                            <input
                                ref={colorInputRef}
                                type="color"
                                defaultValue={cardColor || '#ffffff'}
                                onChange={(e) => onColorChange && onColorChange(cardKey, e.target.value)}
                                onMouseDown={stopPropagation}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </button>
                    )}
                    <div className="p-1 hidden md:block">
                        <MoveIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                </div>
            </div>
            <div className={`p-2 sm:p-6 sm:pb-8 ${isAutoHeight ? '' : 'flex-grow min-h-0 flex flex-col'}`}>
                {children}
            </div>
        </div>
    );
};

export default DashboardCard;