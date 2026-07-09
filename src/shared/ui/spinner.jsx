import React from 'react';
import { cn } from '../../lib/utils.js';

const Spinner = React.forwardRef(function Spinner({ className, size, ...props }, ref) {
  var sz = size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-8 w-8 border-[3px]' : 'h-5 w-5 border-2';
  return (
    <div
      ref={ref}
      className={cn('animate-spin rounded-full border-current border-t-transparent flex-shrink-0', sz, className)}
      role="status"
      aria-label="Carregando"
      {...props}
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
});
Spinner.displayName = 'Spinner';

export { Spinner };
