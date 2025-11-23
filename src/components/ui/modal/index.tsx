import { useRef, useEffect, useState, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean; // New prop to control close button visibility
  isFullscreen?: boolean; // Default to false for backwards compatibility
  draggable?: boolean; // New prop to enable draggable functionality
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true, // Default to true for backwards compatibility
  isFullscreen = false,
  draggable = true, // Default to true to make modals draggable like Windows
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset position and size when modal opens
      setPosition({ x: 0, y: 0 });
      setSize({ width: 0, height: 0 });
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle drag events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || isFullscreen || isResizing) return; // Prevent dragging while resizing

    // Only allow dragging from the modal header area (top 60px)
    const rect = modalRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickY = e.clientY - rect.top;
    if (clickY > 60) return; // Only drag from header area

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggable || isResizing) return; // Don't drag while resizing

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setPosition({ x: newX, y: newY });
  }, [isDragging, draggable, dragStart.x, dragStart.y, isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle resize events
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    if (isFullscreen) return;

    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);

    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;

    // Límites de altura en vh
    const minHeight = window.innerHeight * 0.1; // 10vh
    const maxHeight = window.innerHeight * 0.95; // 95vh

    // Límites de ancho en vw
    const minWidth = window.innerWidth * 0.1; // 10vw
    const maxWidth = window.innerWidth * 0.95; // 95vw

    if (resizeDirection.includes('e')) {
      newWidth = resizeStart.width + deltaX;
    }
    if (resizeDirection.includes('s')) {
      newHeight = resizeStart.height + deltaY;
    }

    // Aplicar límites de altura
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    // Aplicar límites de ancho
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeDirection, resizeStart]);

  const handleResizeUp = useCallback(() => {
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
    };
  }, [isResizing, handleResizeMove, handleResizeUp]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative w-full rounded-3xl bg-white  dark:bg-gray-900";

  const modalStyle = !isFullscreen
    ? {
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default',
        transition: isDragging || isResizing ? 'none' : 'transform 0.2s ease-out',
        width: size.width > 0 ? `${size.width}px` : undefined,
        height: size.height > 0 ? `${size.height}px` : undefined,
        maxHeight: size.height > 0 ? `${size.height}px` : undefined,
      }
    : {};

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal moved z-99999">
      {!isFullscreen && (
        <div
          className="fixed inset-0 h-full w-full background-blur"
          onClick={onClose}
        ></div>
      )}
      <div
        ref={modalRef}
        className={`resize-content ${contentClasses}  ${className} ${draggable && !isFullscreen ? 'select-none' : ''}`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {draggable && !isFullscreen && (
          <div
            className="absolute top-0 left-0 right-0 h-16 cursor-grab active:cursor-grabbing z-[998]"
            onMouseDown={handleMouseDown}
          />
        )}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
        <div>{children}</div>

        {/* Resize handle - solo esquina inferior derecha */}
        {!isFullscreen && (
          <div
            className="absolute bottom-1 right-1 w-8 h-8 cursor-se-resize z-[999] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-br-3xl"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          >
            {/* Icono visual para indicar resize */}
            <div className="w-4 h-4 border-r-2 border-b-2 border-gray-500 dark:border-gray-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};
