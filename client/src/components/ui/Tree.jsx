import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, File, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TreeItem = ({ item, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-3 cursor-pointer transition-all duration-200 rounded-lg hover:bg-white/5 group",
          level > 0 && "ml-4 border-l border-white/10 pl-4"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-4 h-4 flex items-center justify-center">
          {hasChildren && (
            <motion.div 
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={14} className="text-gray-500" />
            </motion.div>
          )}
        </div>
        
        {hasChildren ? (
          <Folder size={16} className="text-yellow-400" />
        ) : (
          <File size={16} className="text-gray-400" />
        )}
        
        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
          {item.label}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {item.children.map((child, idx) => (
              <TreeItem key={idx} item={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Tree = ({ data }) => {
  return (
    <div className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl max-w-md w-full">
      <div className="space-y-1">
        {data.map((item, idx) => (
          <TreeItem key={idx} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Tree;
