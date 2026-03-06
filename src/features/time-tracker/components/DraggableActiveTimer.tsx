import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Square, Timer } from 'lucide-react';
import { formatClock } from '../utils/timeTracker.utils';

interface DraggableActiveTimerProps {
    visible: boolean;
    elapsedSeconds: number;
    projectName: string;
    onStop: () => void;
    isStopping: boolean;
}

type Position = {
    x: number;
    y: number;
};

const DESKTOP_EXPANDED_WIDTH = 236;
const MOBILE_EXPANDED_WIDTH = 280;
const DESKTOP_EXPANDED_HEIGHT = 112;
const MOBILE_EXPANDED_HEIGHT = 144;
const VIEWPORT_MARGIN = 8;

function isMobileViewport(): boolean {
    return window.innerWidth < 768 || window.matchMedia('(hover: none)').matches;
}

function getExpandedSize(): { width: number; height: number } {
    const isMobile = isMobileViewport();
    const baseWidth = isMobile ? MOBILE_EXPANDED_WIDTH : DESKTOP_EXPANDED_WIDTH;
    const width = Math.max(160, Math.min(baseWidth, window.innerWidth - VIEWPORT_MARGIN * 2));
    const height = isMobile ? MOBILE_EXPANDED_HEIGHT : DESKTOP_EXPANDED_HEIGHT;
    return { width, height };
}

function clampToViewport(position: Position): Position {
    const expanded = getExpandedSize();
    const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - expanded.width - VIEWPORT_MARGIN);
    const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - expanded.height - VIEWPORT_MARGIN);

    return {
        x: Math.min(Math.max(position.x, VIEWPORT_MARGIN), maxX),
        y: Math.min(Math.max(position.y, VIEWPORT_MARGIN), maxY),
    };
}

export function DraggableActiveTimer({
    visible,
    elapsedSeconds,
    projectName,
    onStop,
    isStopping,
}: DraggableActiveTimerProps) {
    const [position, setPosition] = useState<Position | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(() => isMobileViewport());
    const [mobileExpanded, setMobileExpanded] = useState(false);

    const pointerOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const draggingRef = useRef(false);
    const movedDuringDragRef = useRef(false);

    useEffect(() => {
        if (!visible || position) return;
        const expanded = getExpandedSize();
        setPosition({
            x: Math.max(VIEWPORT_MARGIN, window.innerWidth - expanded.width - 24),
            y: Math.max(VIEWPORT_MARGIN, window.innerHeight - expanded.height - 24),
        });
    }, [visible, position]);

    useEffect(() => {
        const handleResize = () => {
            const nextMobile = isMobileViewport();
            setIsMobile(nextMobile);
            if (!nextMobile) {
                setMobileExpanded(false);
            }
            setPosition((prev) => (prev ? clampToViewport(prev) : prev));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            if (!draggingRef.current) return;

            const moveX = Math.abs(event.clientX - pointerStartRef.current.x);
            const moveY = Math.abs(event.clientY - pointerStartRef.current.y);
            if (moveX > 4 || moveY > 4) {
                movedDuringDragRef.current = true;
            }

            const nextPos = {
                x: event.clientX - pointerOffsetRef.current.x,
                y: event.clientY - pointerOffsetRef.current.y,
            };
            setPosition(clampToViewport(nextPos));
        };

        const handlePointerUp = () => {
            const wasDragging = draggingRef.current;
            draggingRef.current = false;
            setIsDragging(false);

            if (isMobile && wasDragging && !movedDuringDragRef.current) {
                setMobileExpanded((prev) => !prev);
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isMobile]);

    useEffect(() => {
        if (!visible) {
            setMobileExpanded(false);
        }
    }, [visible]);

    if (!visible || !position) return null;

    const detailsClassName = isMobile
        ? mobileExpanded
            ? 'pointer-events-auto mt-2 max-h-[86px] min-w-0 overflow-hidden opacity-100 transition-all duration-200 ease-out'
            : 'pointer-events-none mt-0 max-h-0 min-w-0 overflow-hidden opacity-0 transition-all duration-200 ease-out'
        : 'pointer-events-none mt-0 max-h-0 min-w-0 overflow-hidden opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:mt-2 group-hover:max-h-[76px] group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:mt-2 group-focus-within:max-h-[76px] group-focus-within:opacity-100';

    const widgetClassName = isMobile
        ? `group fixed z-[80] select-none overflow-hidden border border-red-200 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.25)] backdrop-blur transition-all duration-200 ease-out touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${mobileExpanded ? 'h-[140px] w-[min(92vw,280px)] rounded-2xl p-3' : 'h-[52px] w-[min(132px,calc(100vw-16px))] rounded-full p-2.5'}`
        : `group fixed z-[80] h-[52px] w-[min(132px,calc(100vw-16px))] select-none overflow-hidden rounded-full border border-red-200 bg-white/95 p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.25)] backdrop-blur transition-all duration-200 ease-out hover:h-[112px] hover:w-[min(236px,calc(100vw-16px))] hover:rounded-2xl hover:p-3 focus-within:h-[112px] focus-within:w-[min(236px,calc(100vw-16px))] focus-within:rounded-2xl focus-within:p-3 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`;

    return (
        <div
            className={widgetClassName}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            onPointerDown={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest('button')) return;

                draggingRef.current = true;
                movedDuringDragRef.current = false;
                setIsDragging(true);
                pointerOffsetRef.current = {
                    x: event.clientX - position.x,
                    y: event.clientY - position.y,
                };
                pointerStartRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                };
            }}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <Timer size={14} />
                    </span>
                    <div className="min-w-0">
                        <p className="m-0 text-sm font-bold leading-none text-gray-900">{formatClock(elapsedSeconds)}</p>
                        <p className="m-0 mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-600">Aktif</p>
                    </div>
                </div>

                {isMobile && (
                    <button
                        type="button"
                        onClick={() => setMobileExpanded((prev) => !prev)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600"
                        aria-label={mobileExpanded ? 'Detaylari gizle' : 'Detaylari goster'}
                    >
                        {mobileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                )}
            </div>

            <div className={detailsClassName}>
                <p className="m-0 truncate text-xs text-gray-600">{projectName}</p>
                <button
                    type="button"
                    onClick={onStop}
                    disabled={isStopping}
                    className={`mt-2 inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${isMobile ? 'w-full justify-center' : ''}`}
                >
                    <Square size={11} />
                    Durdur
                </button>
            </div>
        </div>
    );
}
