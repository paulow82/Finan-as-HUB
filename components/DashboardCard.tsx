
import React, { useRef } from 'react';
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
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, cardKey, cardColor, onColorChange, onQuickAdd, onTitleChange }) => {
    const colorInputRef = useRef<HTMLInputElement>(null);
    
    const handleTitleBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
        if (onTitleChange && e.currentTarget.textContent !== title) {
            onTitleChange(cardKey, e.currentTarget.textContent || '');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    const stopPropagation = (e: React.MouseEvent | React.FocusEvent) => {
        e.stopPropagation();
    };

    const headerStyle = cardColor ? { backgroundColor: cardColor } : {};
    const textColorClass = "text-gray-900 dark:text-gray-100";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
            <div 
                className="drag-handle cursor-move p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-lg group"
                style={headerStyle}
            >
                <div className="relative flex items-center gap-2 group/title">
                    <h2 
                        className={`text-xl font-bold ${textColorClass} focus:outline-none focus:bg-black/10 dark:focus:bg-white/10 px-2 -ml-2 rounded-md`}
                        contentEditable={!!onTitleChange}
                        suppressContentEditableWarning={true}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleKeyDown}
                        onMouseDown={stopPropagation}
                    >
                        {title}
                    </h2>
                    {onTitleChange && <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 opacity-0 group-hover/title:opacity-100 transition-opacity" />}
                </div>
                <div className="flex items-center gap-2">
                    {onQuickAdd && (
                        <button 
                            onClick={onQuickAdd} 
                            onMouseDown={stopPropagation}
                            className="p-2 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                            title="Adicionar item"
                        >
                            <PlusIcon className={`w-5 h-5 ${textColorClass}`} />
                        </button>
                    )}
                    {onColorChange && (
                        <button 
                            className="relative p-2 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                            title="Mudar cor do card"
                            onClick={() => colorInputRef.current?.click()}
                            onMouseDown={stopPropagation}
                        >
                            <PaletteIcon className={`w-5 h-5 ${textColorClass}`} />
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
                    <div className="p-1">
                        <MoveIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                </div>
            </div>
            <div className="p-6 pb-8 flex-grow overflow-auto">
                {children}
            </div>
        </div>
    );
};

export default DashboardCard;
