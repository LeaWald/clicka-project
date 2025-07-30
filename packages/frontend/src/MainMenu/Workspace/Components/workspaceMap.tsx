
import { useEffect, useRef, useState } from 'react';
import '../Css/workspaceMap.css';
import { Room, Space, SpaceStatus, WorkspaceType } from 'shared-types';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { useWorkSpaceStore } from '../../../Stores/Workspace/workspaceStore';
import { useRoomStore } from '../../../Stores/Workspace/roomStore';


export const WorkspaceMap = () => {

    const { workSpaces, getAllWorkspace, getWorkspaceHistory } = useWorkSpaceStore();
    const { rooms, getAllRooms } = useRoomStore();
    const uniqueStatus = Object.values(SpaceStatus).filter(status => status !== SpaceStatus.NONE);
    const hiddenTypes = [
        WorkspaceType.WALL,
        WorkspaceType.DOOR_PASS,
        WorkspaceType.BASE,
        WorkspaceType.KLIKAH_CARD,
        WorkspaceType.OPEN_SPACE
    ];
    const uniqueType = Object.values(WorkspaceType).filter(type => !hiddenTypes.includes(type));
    const [selectedStatus, setSelectedStatus] = useState("PLACEHOLDER");
    const [selectedType, setSelectedType] = useState("PLACEHOLDER");
    const [activeStatusSearch, setActiveStatusSearch] = useState(false);
    const [activeTypeSearch, setActiveTypeSearch] = useState(false);
    const [displayDate, setDisplayDate] = useState(new Date());
    const [scale, setScale] = useState(1);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [mapDimensions,] = useState({ width: 2840, height: 1060 });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        content: string;
    }>({
        visible: false,
        x: 0,
        y: 0,
        content: ''
    });

    const navigate = useNavigate()
    const [zoom, setZoom] = useState(3);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    // const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
    const loadData = async () => {
        // setIsLoading(true);
        await Promise.all([
            getAllWorkspace(),
            getAllRooms()
        ]);
        // setIsLoading(false);
    };
    loadData();

    const updateSize = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
}, [getAllRooms,getAllWorkspace]);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, [getAllWorkspace, getAllRooms])

    useEffect(() => {
        if (selectedStatus !== "" && selectedStatus !== "PLACEHOLDER") {
            setActiveStatusSearch(true);
        }
        else setActiveStatusSearch(false);
    }, [selectedStatus]);
    useEffect(() => {
        if (selectedType !== "" && selectedType !== "PLACEHOLDER") {
            setActiveTypeSearch(true);
        }
        else setActiveTypeSearch(false);
    }, [selectedType]);
    useEffect(() => {
        const calculateScale = () => {
            const container = document.querySelector('.spaces');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const scaleX = (containerRect.width - 20) / mapDimensions.width;
                const scaleY = (containerRect.height - 20) / mapDimensions.height;
                const newScale = Math.min(scaleX, scaleY, 1);
                setScale(newScale);
            }
        };
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [mapDimensions]);
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.2, 100));
    };
    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.2, 3));
    };
    const handleResetZoom = () => {
        setZoom(3);
        setZoom(3);
        applyPan({ x: 0, y: 0 });
    };
    const getZoomStep = () => {
        if (zoom < 10) return 0.1;
        if (zoom < 100) return 1;
        if (zoom < 1000) return 10;
        return 100;
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom >= 3) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({
                x: e.clientX - pan.x,
                y: e.clientY - pan.y
            });
        }
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            e.preventDefault();
            applyPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    const handleMiniMapClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const scaleX = mapDimensions.width / rect.width;
        const scaleY = mapDimensions.height / rect.height;

        const targetX = clickX * scaleX;
        const targetY = clickY * scaleY;

        const centerOffsetX = containerSize.width / (2 * scale * zoom);
        const centerOffsetY = containerSize.height / (2 * scale * zoom);

        applyPan({
            x: -(targetX - centerOffsetX) * scale * zoom,
            y: -(targetY - centerOffsetY) * scale * zoom
        });
    };
    const resetSearch = () => {
        setActiveStatusSearch(false);
        setActiveTypeSearch(false);
        setSelectedStatus("PLACEHOLDER");
        setSelectedType("PLACEHOLDER");
    };
    const ocoupancy = (d: Date) => {
        if (d.toDateString() === new Date().toDateString())
            getAllWorkspace();
        else {
            getWorkspaceHistory(d);
        }
        setDisplayDate(d);
    }

    const getSpaceClass = (space: Space) => {
        const name = (space.name || '').toString().toLowerCase();
        if (name.includes('דלת') || name.includes('כניסה') || name.includes('יציאה')) {
            return 'door';
        }
        if (name.includes('קיר')) {
            return 'wall';
        }
        if (name.includes('שירותים')) {
            return 'bathroom';
        }
        if (name.includes('מטבח')) {
            return 'kitchen';
        }
        if (name.includes('ארון') || name.includes('עמדת')) {
            return 'INACTIVE';
        }
        return space.status;
    };

    const getRoomSpaceClass = (room: Room) => {
        const name = (room.name || '').toString().toLowerCase();
        if (name.includes('לאונז')) {
            return 'lounge';
        }
        if (name.includes('ישיבות')) {
            return 'meeting';
        }
        return room.status;
    };


    const applyPan = (newPan: { x: number; y: number }) => {
        const scaledWidth = mapDimensions.width * 1 * zoom;
        const scaledHeight = mapDimensions.height * 1 * zoom;

        let minX, maxX, minY, maxY;

        if (scaledWidth <= containerSize.width) {
            const centerX = (containerSize.width - scaledWidth) / 2;
            minX = maxX = centerX;
        } else {
            maxX = 0;
            minX = containerSize.width - scaledWidth;
        }
        if (scaledHeight <= containerSize.height) {
            const centerY = (containerSize.height - scaledHeight) / 2;
            minY = maxY = centerY;
        } else {
            maxY = 0;
            minY = containerSize.height - scaledHeight;
        }
        const clampedX = Math.max(Math.min(newPan.x, maxX), minX);
        const clampedY = Math.max(Math.min(newPan.y, maxY), minY);
        setPan({ x: clampedX, y: clampedY });
    };
    const getSpaceIcon = (space: Space) => {
        const name = space.name.toLowerCase();
        if (name.includes('קבלה')) return '📋';
        if (name.includes('עמדה') && (space.type === 'COMPUTER_STAND' || space.type === 'DESK_IN_ROOM')) {
            return null;
        }
        if (name.includes('שירותים')) return '🚻';
        if (name.includes('מטבח')) return '🍽️';
        if (name.includes('מעלית')) return '🛗';
        if (name.includes('ארון חשמל')) return '⚡';
        if (name.includes('ארון תקשורת')) return '📡';
        if (name.includes('עמדת הדפסה')) return '🖨️';
        return null;
    };
    const getRoomSpaceIcon = (room: Room) => {
        const name = room.name.toLowerCase();
        if (name.includes('לאונז')) return '🛋️';
        if (name.includes('ישיבות')) return '👥';
        return null;
    };
    const renderComputerStand = (space: Space) => {
        const centerX = space.positionX + space.width / 2;
        const centerY = space.positionY + space.height / 2;

        return (
            <g style={
                {
                    // pointerEvents: 'INACTIVE'
                }
            }>
                <rect
                    x={centerX - 15}
                    y={centerY - 12}
                    width="30"
                    height="20"
                    fill="#2c3e50"
                    stroke="#34495e"
                    strokeWidth="1"
                    rx="2"
                />
                <rect
                    x={centerX - 12}
                    y={centerY - 9}
                    width="24"
                    height="15"
                    fill={space.status === SpaceStatus.AVAILABLE ? '#caf9d5' :
                        space.status === SpaceStatus.OCCUPIED ? '#f6c1bd' : '#f7d6a5'}
                    rx="1"
                />
                <rect
                    x={centerX - 3}
                    y={centerY + 8}
                    width="6"
                    height="4"
                    fill="#7f8c8d"
                />
                <rect
                    x={centerX - 10}
                    y={centerY + 12}
                    width="20"
                    height="2"
                    fill="#95a5a6"
                    rx="1"
                />
            </g>
        );
    };

    return <div className="all">
        {/* {isLoading && (
    <div className="loading-overlay">
        <div className="spinner"></div>
    </div>
)} */}
        <h1>{displayDate.toLocaleDateString()}</h1>
        {tooltip.visible && (
            <div
                className="tooltip"
                style={{
                    position: 'fixed',
                    left: tooltip.x,
                    top: tooltip.y,
                    transform: 'translateX(-50%) translateY(-100%)',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 1000
                }}
            >
                {tooltip.content}
            </div>
        )}
        <button
            className={`toggleSidebarBtn ${isSidebarOpen ? 'open' : 'closed'}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "הסתר תפריט" : "הצג תפריט"}
        >
            <MenuIcon />        </button>
        <div className={`content ${!isSidebarOpen ? 'sidebarHidden' : ''}`}>
            <div className={`search ${!isSidebarOpen ? 'hidden' : ''}`}>                <div className='statusAndType'>
                <h2>חיפוש וסינון</h2>
                <label>סטטוס</label>
                <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value) }}>
                    <option value="PLACEHOLDER" disabled>בחר ססטוס חלל לחיפוש</option>
                    {uniqueStatus.map((status, index) => {
                        return <option key={status} value={status}>{status}</option>
                    })}
                </select>
                <label>סוג</label>
                <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value) }}>
                    <option value="PLACEHOLDER" disabled>בחר סוג חלל לחיפוש</option>
                    {uniqueType.map((type, index) => {
                        return <option key={type} value={type}>{type}</option>
                    })}
                </select>
            </div>
                <Button onClick={resetSearch} className="clearSearchBtn">אפס</Button>
                <div className='displayDate'>
                    <h2>תצוגת מפה</h2>
                    <label>תאריך</label>
                    <input type="date" onChange={(e) => {
                        const val = new Date(e.target.value);
                        if (!isNaN(val.getTime())) {
                            ocoupancy(val);
                        }
                    }} />
                </div>
                <Button onClick={() => { navigate('/') }} className="backBtn">חזרה</Button>
            </div>

            <div className={`workspaceMap ${!isSidebarOpen ? 'fullWidth' : ''}`}>
                <div className="spaces" ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: zoom >= 3 ? (isDragging ? 'grabbing' : 'grab') : 'default', position: 'relative' }}>
                    <svg
                        className="mapContent"
                        style={{
                            transform: `scale(${scale * zoom}) translate(${pan.x / (scale * zoom)}px, ${pan.y / (scale * zoom)}px)`,
                            transformOrigin: '0 0',
                            width: `${mapDimensions.width}px`,
                            height: `${mapDimensions.height}px`,
                        }}
                        viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                    >
                        <defs>
                            <pattern id="doorPattern" patternUnits="userSpaceOnUse" width="10" height="10">
                                <rect width="10" height="10" fill="#f8f9fa" />
                                <path d="M0,10 L10,0" stroke="#6c757d" strokeWidth="1" />
                            </pattern>
                        </defs>

                        {workSpaces.length > 0 &&
                            [...workSpaces]
                                .sort((a, b) => (b.width * b.height) - (a.width * a.height))
                                .map((w) => {
                                    const hasActiveSearch = activeStatusSearch || activeTypeSearch;
                                    const matchesStatusSearch = !activeStatusSearch || w.status === selectedStatus;
                                    const matchesTypeSearch = !activeTypeSearch || w.type === selectedType;
                                    const isHighlighted = !hasActiveSearch || (matchesStatusSearch && matchesTypeSearch);

                                    const isWorkstation = w.type === 'COMPUTER_STAND' || w.type === 'DESK_IN_ROOM' || w.type === 'RECEPTION_DESK';
                                    return (
                                        <g key={w.id}>
                                            {isWorkstation ? (
                                                <g
                                                    className={`space-rect ${getSpaceClass(w)}`}
                                                    style={{ opacity: isHighlighted ? 1 : 0.3 }}
                                                    onMouseEnter={(e) => {
                                                        if (w.type === WorkspaceType.BASE) return;
                                                        e.stopPropagation();
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setTooltip({
                                                            visible: true,
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.top - 10,
                                                            content: ['door', 'wall', 'bathroom', 'kitchen', 'INACTIVE'].includes(getSpaceClass(w))
                                                                ? w.name
                                                                : `${w.name} - ${w.status} ${w.currentCustomerName ? `${w.currentCustomerName}` : ""},`
                                                        });
                                                    }}
                                                    onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
                                                    onClick={() => {
                                                        if (w.status === SpaceStatus.AVAILABLE) {
                                                            if (w.type === WorkspaceType.PRIVATE_ROOM1 || w.type === WorkspaceType.PRIVATE_ROOM2 || w.type === WorkspaceType.PRIVATE_ROOM3) {
                                                                navigate('/assignmentForm', { state: { space: w, displayDate } });
                                                            }
                                                        }
                                                        else if (w.status === SpaceStatus.OCCUPIED) {
                                                            if (w.type === WorkspaceType.PRIVATE_ROOM1 || w.type === WorkspaceType.PRIVATE_ROOM2 || w.type === WorkspaceType.PRIVATE_ROOM3) {
                                                                navigate('/customerChange', { state: { space: w, displayDate } });
                                                            }
                                                        }
                                                    }}

                                                >
                                                    <rect
                                                        x={w.positionX}
                                                        y={w.positionY}
                                                        width={w.width}
                                                        height={w.height}
                                                        className={`space-rect ${getSpaceClass(w)}`}
                                                        stroke={isHighlighted ? "#333" : "#999"}
                                                        strokeWidth="2"
                                                        opacity={0.3}
                                                    />
                                                    {renderComputerStand(w)}
                                                </g>
                                            ) : (
                                                <rect
                                                    x={w.positionX}
                                                    y={w.positionY}
                                                    width={w.width}
                                                    height={w.height}
                                                    stroke={isHighlighted ? "#333" : "#999"}
                                                    strokeWidth="2"
                                                    opacity={isHighlighted ? 1 : 0.3}
                                                    className={`space-rect ${getSpaceClass(w)}`}

                                                    onMouseEnter={(e) => {
                                                        if (w.type === WorkspaceType.BASE) return;
                                                        e.stopPropagation();
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setTooltip({
                                                            visible: true,
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.top - 10,
                                                            content: ['door', 'wall', 'bathroom', 'kitchen', 'INACTIVE'].includes(getSpaceClass(w))
                                                                ? w.name
                                                                : `${w.name} - ${w.status} ${w.currentCustomerName ? `${w.currentCustomerName}` : ""},`
                                                        });
                                                    }}
                                                    onMouseLeave={() => {
                                                        setTooltip(prev => ({ ...prev, visible: false }));
                                                    }}
                                                    onClick={() => {
                                                        if (w.status === SpaceStatus.AVAILABLE) {
                                                            if (w.type === WorkspaceType.PRIVATE_ROOM1 || w.type === WorkspaceType.PRIVATE_ROOM2 || w.type === WorkspaceType.PRIVATE_ROOM3) {
                                                                navigate('/assignmentForm', { state: { space: w, displayDate } });
                                                            }
                                                        }
                                                        else if (w.status === SpaceStatus.OCCUPIED) {
                                                            if (w.type === WorkspaceType.PRIVATE_ROOM1 || w.type === WorkspaceType.PRIVATE_ROOM2 || w.type === WorkspaceType.PRIVATE_ROOM3) {
                                                                navigate('/customerChange', { state: { space: w, displayDate } });
                                                            }
                                                        }
                                                    }}

                                                >
                                                    {renderComputerStand(w)}
                                                </rect>
                                            )}
                                            {w.width > 50 && w.height > 30 && (
                                                <g>
                                                    {getSpaceIcon(w) && (
                                                        <text
                                                            x={w.positionX + w.width / 2}
                                                            y={w.positionY + w.height / 2 - 15}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                            fontSize="48"
                                                            fill="#333"
                                                            style={{
                                                                pointerEvents: 'none',
                                                                fontWeight: 'bold',
                                                                fontFamily: 'Arial Unicode MS, Segoe UI Emoji, sans-serif'
                                                            }}
                                                        >
                                                            {getSpaceIcon(w)}
                                                        </text>
                                                    )}
                                                    {(() => {
                                                        const name = (w.name || '').toLowerCase();
                                                        const showName =
                                                            name.includes('משרד') ||
                                                            name.includes('שירותים') ||
                                                            name.includes('מטבח') ||
                                                            name.includes('לאונז') ||
                                                            name.includes('ישיבות');
                                                        return showName ? (
                                                            <text
                                                                x={w.positionX + w.width / 2}
                                                                y={w.positionY + w.height / 2 + (getSpaceIcon(w) ? 5 : 0)}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                                fontSize={Math.min(w.width, w.height, 20)}
                                                                fill="white"
                                                                className="space-text"
                                                                style={{ pointerEvents: 'none' }}
                                                            >
                                                                {w.name}
                                                            </text>
                                                        ) : null;
                                                    })()}
                                                    {w.currentCustomerName && (
                                                        <text
                                                            x={w.positionX + w.width / 2}
                                                            y={w.positionY + w.height / 2 + (getSpaceIcon(w) ? 20 : 15)}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                            fontSize="40px"
                                                            fill="#ffeb3b"
                                                            style={{
                                                                pointerEvents: 'none',
                                                                fontWeight: 'bold',
                                                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                                                            }}
                                                        >
                                                            👤 {w.currentCustomerName}
                                                        </text>
                                                    )}
                                                </g>
                                            )}
                                        </g>
                                    );
                                })}
                        {rooms.length > 0 && rooms.map((r) => {
                            return (
                                <g key={r.id}>
                                    {r.width > 50 && r.height > 30 && (
                                        <g
                                        >
                                            <rect
                                                x={r.positionX}
                                                y={r.positionY}
                                                width={r.width}
                                                height={r.height}
                                                className={`space-rect room-space ${getRoomSpaceClass(r)}`}
                                                onClick={() => {
                                                    navigate('/bookingCalendar', { state: { room: r, displayDate } });
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setTooltip({
                                                        visible: true,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top - 10,
                                                        content: `${r.name} - ${r.capacity} מקומות`
                                                    });
                                                }}
                                                onMouseLeave={() => {
                                                    setTooltip(prev => ({ ...prev, visible: false }));
                                                }}
                                            />
                                            {getRoomSpaceIcon(r) && (

                                                <text
                                                    x={r.positionX + r.width / 2}
                                                    y={r.positionY + r.height / 2 - 15}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fontSize="48"
                                                    fill="#333"
                                                    style={{
                                                        pointerEvents: 'none',
                                                        fontWeight: 'bold',
                                                        fontFamily: 'Arial Unicode MS, Segoe UI Emoji, sans-serif'
                                                    }}
                                                >
                                                    {getRoomSpaceIcon(r)}
                                                </text>
                                            )}
                                            <text
                                                x={r.positionX + r.width / 2}
                                                y={r.positionY + r.height / 2 + (getRoomSpaceIcon(r) ? 5 : 0)}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontSize={Math.min(r.width / 8, r.height / 4, 12)}
                                                fill="white"
                                                className="space-text"
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                {r.name}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
                <div className="zoom">
                    <div className="zoom-controls">
                        <button className="zoom-btn" onClick={handleZoomOut} disabled={zoom <= 3}> - </button>
                        <div className="zoom-slider">
                            <input
                                type="range"
                                min="3"
                                max="100"
                                step={getZoomStep()}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="slider"
                            />
                            <span className="zoom-value">{Math.round(zoom * 100)}%</span>
                        </div>
                        <button className="zoom-btn" onClick={handleZoomIn} disabled={zoom >= 10}>+</button>
                        <button className="reset-btn" onClick={handleResetZoom}>⌂</button>
                    </div>
                </div>
            </div>
        </div>

        <div
            className="minimap"
            style={{
                position: 'absolute',
                top: 80,
                left: 20,
                width: 200,
                height: 100,
                border: '1px solid #999',
                background: '#fff',
                zIndex: 100,
                overflow: 'hidden'
            }}
        >
            <svg
                onClick={handleMiniMapClick}
                viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                width="200"
                height="100"
                style={{ cursor: 'pointer' }}
            >
                {workSpaces.map(w => (
                    <rect
                        key={w.id}
                        x={w.positionX}
                        y={w.positionY}
                        width={w.width}
                        height={w.height}
                        fill="#ddd"
                        stroke="#333"
                        strokeWidth="0.5"
                    />
                ))}
                <rect
                    x={-pan.x / (scale * zoom)}
                    y={-pan.y / (scale * zoom)}
                    width={containerSize.width / (scale * zoom)}
                    height={containerSize.height / (scale * zoom)}
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                />
            </svg>
        </div>

    </div>
}