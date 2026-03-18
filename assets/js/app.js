// Initial testdata
const initialData = [];

const columnsConfigs = ['Att göra', 'Pågående', 'Granskning', 'Klart'];

// IndexedDB Setup
const dbName = 'KanbanDB';
const storeName = 'tasks';
let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id' });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            // Check if empty, then populate
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
                if (countRequest.result === 0) {
                    populateInitialData().then(resolve);
                } else {
                    resolve();
                }
            };
        };

        request.onerror = (e) => reject(e.target.error);
    });
};

const populateInitialData = () => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        initialData.forEach(task => store.put(task));
        
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
};

// Data Operations
const getAllTasks = () => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const saveTask = (task) => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(task);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
};

const updateTaskStatus = (taskId, newStatus) => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        const getReq = store.get(taskId);
        getReq.onsuccess = () => {
            const task = getReq.result;
            if (task) {
                task.status = newStatus;
                store.put(task);
            }
        };
        
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
};

const deleteTask = (taskId) => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(taskId);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
};

// UI Elements
const boardEl = document.getElementById('board');
const modalOverlay = document.getElementById('modal-overlay');
const addTaskBtn = document.getElementById('add-task-btn');
const cancelBtn = document.getElementById('cancel-btn');
const newTaskForm = document.getElementById('new-task-form');
const tagSuggestionsContainer = document.getElementById('tag-suggestions');

const confirmModalOverlay = document.getElementById('confirm-modal-overlay');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

let draggedTaskId = null;
let taskToDeleteId = null;

// Render Board
const renderBoard = async () => {
    // Spara aktuell scroll-position (viktigt för mobil-vyn)
    const currentScroll = boardEl.scrollLeft;
    
    boardEl.innerHTML = '';
    const tasks = await getAllTasks();
    
    // Update tag suggestions with clickable badges
    const tags = [...new Set(tasks.map(t => t.tag).filter(Boolean))];
    if (tagSuggestionsContainer) {
        tagSuggestionsContainer.innerHTML = tags.map(tag => 
            `<button type="button" class="tag-suggestion-badge">${tag}</button>`
        ).join('');
        
        // Add click events to the badges
        tagSuggestionsContainer.querySelectorAll('.tag-suggestion-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                document.getElementById('task-tag').value = e.target.textContent;
            });
        });
    }

    columnsConfigs.forEach(columnStatus => {
        const columnTasks = tasks.filter(t => t.status === columnStatus);
        
        const colEl = document.createElement('div');
        colEl.className = 'column';
        colEl.dataset.status = columnStatus;
        
        // Drag over and drop events for column
        colEl.addEventListener('dragover', handleDragOver);
        colEl.addEventListener('dragleave', handleDragLeave);
        colEl.addEventListener('drop', handleDrop);

        // Header
        const headerEl = document.createElement('div');
        headerEl.className = 'column-header';
        headerEl.innerHTML = `
            <h2>${columnStatus}</h2>
            <span class="task-count">${columnTasks.length}</span>
        `;
        
        // Task List
        const listEl = document.createElement('div');
        listEl.className = 'task-list';
        
        columnTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-card';
            taskEl.draggable = true;
            taskEl.dataset.id = task.id;
            
            taskEl.addEventListener('dragstart', handleDragStart);
            taskEl.addEventListener('dragend', handleDragEnd);
            
            // Touch events for mobile
            taskEl.addEventListener('touchstart', handleTouchStart, { passive: false });
            taskEl.addEventListener('touchmove', handleTouchMove, { passive: false });
            taskEl.addEventListener('touchend', handleTouchEnd);

            taskEl.innerHTML = `
                <div class="task-header">
                    <span class="task-tag" style="${task.color || 'background-color:#e5e7eb; color:#374151'}">${task.tag || 'Övrigt'}</span>
                    <button class="delete-btn" title="Ta bort">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <h3 class="task-title">${task.title}</h3>
                <p class="task-desc">${task.description || ''}</p>
                <div class="task-footer">
                    <span class="task-id">#${task.id}</span>
                </div>
            `;
            
            // Delete task handler
            taskEl.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openConfirmModal(task.id);
            });

            listEl.appendChild(taskEl);
        });

        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        listEl.appendChild(dropZone);

        colEl.appendChild(headerEl);
        colEl.appendChild(listEl);
        boardEl.appendChild(colEl);
    });

    // Återställ scroll-positionen omedelbart efter att DOM:en har ritats om
    boardEl.scrollLeft = currentScroll;
};

// Drag and Drop Handlers
const handleDragStart = (e) => {
    draggedTaskId = e.currentTarget.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTaskId);
    setTimeout(() => {
        e.target.classList.add('dragging');
    }, 0);
};

const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    draggedTaskId = null;
    document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
};

const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
};

const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
};

const handleDrop = async (e) => {
    e.preventDefault();
    const column = e.currentTarget;
    column.classList.remove('drag-over');
    
    const targetStatus = column.dataset.status;
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId && targetStatus) {
        await updateTaskStatus(taskId, targetStatus);
        renderBoard();
    }
};

// ============================================================
// TOUCH DRAG & DROP FÖR MOBIL
//
// Auto-scroll styrs av ett setInterval som startas i handleTouchStart
// och stoppas i handleTouchEnd. Intervallet kollar varje 16ms (~60fps)
// om fingret befinner sig nära kanten och scrollar i så fall boardEl.
//
// Kolumner är 85vw breda. För att nå nästa kolumn drar man kortet
// mot skärmkanten – auto-scroll tar vid automatiskt.
//
// --- Justera scroll-känslan ---
// EDGE_ZONE  (rad nedan): px-zon från kanten som aktiverar scroll.
//            Öka för bredare aktiveringsyta.
// BASE_SPEED (rad nedan): px per intervall. Öka för snabbare scroll.
// ============================================================

const EDGE_ZONE  = 80;   // px från skärmkant → aktiverar auto-scroll
const BASE_SPEED = 8;    // px per tick (16ms) = ~500px/sek vid max

let touchClone             = null;
let draggedTaskOriginalStatus = null;
let lastHoveredColumn      = null;
let autoScrollInterval     = null;  // setInterval-referens för auto-scroll
let currentTouchX          = 0;     // senaste kända finger-X (uppdateras i move)

// Startar eller stoppar auto-scroll-intervallet
const startAutoScroll = () => {
    if (autoScrollInterval) return;
    autoScrollInterval = setInterval(() => {
        // Beräkna hastighet linjärt: 0 vid zonkanten → BASE_SPEED vid skärmkanten
        if (currentTouchX < EDGE_ZONE) {
            const ratio = 1 - currentTouchX / EDGE_ZONE;
            boardEl.scrollLeft -= BASE_SPEED * ratio;
        } else if (currentTouchX > window.innerWidth - EDGE_ZONE) {
            const ratio = 1 - (window.innerWidth - currentTouchX) / EDGE_ZONE;
            boardEl.scrollLeft += BASE_SPEED * ratio;
        }
    }, 16); // ~60fps
};

const stopAutoScroll = () => {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
};

const handleTouchStart = (e) => {
    if (e.target.closest('.delete-btn')) return;
    const taskEl = e.currentTarget;
    draggedTaskId             = taskEl.dataset.id;
    draggedTaskOriginalStatus = taskEl.closest('.column').dataset.status;
    const touch               = e.touches[0];
    currentTouchX             = touch.clientX;

    // Skapa visuell klon som följer fingret (translate3d = hårdvaruaccelererat)
    touchClone = taskEl.cloneNode(true);
    touchClone.classList.add('task-clone');
    touchClone.style.width     = `${taskEl.offsetWidth}px`;
    touchClone.style.left      = '0px';
    touchClone.style.top       = '0px';
    touchClone.style.transform = `translate3d(${touch.clientX - taskEl.offsetWidth / 2}px, ${touch.clientY - taskEl.offsetHeight / 2}px, 0)`;
    document.body.appendChild(touchClone);

    setTimeout(() => taskEl.classList.add('dragging'), 0);

    // Stäng av scroll-snap under drag, återaktiveras i handleTouchEnd
    boardEl.style.scrollSnapType = 'none';
    document.body.style.overflow = 'hidden';

    startAutoScroll(); // Starta auto-scroll-loopen
};

const handleTouchMove = (e) => {
    if (!touchClone) return;
    e.preventDefault(); // Förhindrar native page-scroll under drag

    const touch   = e.touches[0];
    currentTouchX = touch.clientX; // Uppdatera för auto-scroll-loopen

    // Flytta klonen med fingret (GPU-accelererat via translate3d)
    touchClone.style.transform = `translate3d(${touch.clientX - touchClone.offsetWidth / 2}px, ${touch.clientY - touchClone.offsetHeight / 2}px, 0)`;

    // Hitta kolumnen under fingret (klonen ignoreras tack vare pointer-events: none)
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const column    = elemBelow ? elemBelow.closest('.column') : null;

    // Uppdatera drag-over-markering bara när kolumnen faktiskt ändras (prestanda)
    if (column !== lastHoveredColumn) {
        if (lastHoveredColumn) lastHoveredColumn.classList.remove('drag-over');
        if (column) column.classList.add('drag-over');
        lastHoveredColumn = column;
    }
};

const handleTouchEnd = async (e) => {
    if (!touchClone) return;

    stopAutoScroll(); // Stoppa auto-scroll-loopen

    const touch     = e.changedTouches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const column    = elemBelow ? elemBelow.closest('.column') : null;

    document.body.style.overflow = '';
    touchClone.remove();
    touchClone = null;

    // Återaktivera scroll-snap → kolumnen snäpper mjukt till rätt läge
    boardEl.style.scrollSnapType = 'x mandatory';

    if (lastHoveredColumn) lastHoveredColumn.classList.remove('drag-over');
    lastHoveredColumn = null;

    if (column && draggedTaskId) {
        const targetStatus = column.dataset.status;
        // Rendera bara om om kortet faktiskt bytte kolumn
        if (targetStatus !== draggedTaskOriginalStatus) {
            await updateTaskStatus(draggedTaskId, targetStatus);
            renderBoard();
        } else {
            document.querySelectorAll('.task-card').forEach(c => c.classList.remove('dragging'));
        }
    } else {
        document.querySelectorAll('.task-card').forEach(c => c.classList.remove('dragging'));
    }

    draggedTaskId             = null;
    draggedTaskOriginalStatus = null;
};

// Modal functions
const openModal = () => {
    modalOverlay.classList.remove('hidden');
    document.getElementById('task-title').focus();
};

const closeModal = () => {
    modalOverlay.classList.add('hidden');
    newTaskForm.reset();
};

const openConfirmModal = (taskId) => {
    taskToDeleteId = taskId;
    confirmModalOverlay.classList.remove('hidden');
};

const closeConfirmModal = () => {
    taskToDeleteId = null;
    confirmModalOverlay.classList.add('hidden');
};

// Colors for tags
const tagColors = [
    'background-color: #dbeafe; color: #1e40af;', // blue
    'background-color: #fce7f3; color: #9d174d;', // pink
    'background-color: #fef3c7; color: #92400e;', // yellow
    'background-color: #f3e8ff; color: #6b21a8;', // purple
    'background-color: #fee2e2; color: #b91c1c;', // red
    'background-color: #dcfce7; color: #166534;', // green
    'background-color: #e0e7ff; color: #3730a3;', // indigo
    'background-color: #ccfbf1; color: #115e59;', // teal
    'background-color: #ffedd5; color: #9a3412;', // orange
    'background-color: #cffafe; color: #155e75;'  // cyan
];

const generateColorForTag = (tag) => {
    let charSum = 0;
    for (let i = 0; i < tag.length; i++) {
        charSum += tag.charCodeAt(i);
    }
    return tagColors[charSum % tagColors.length];
};

// Form Submission
newTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const tag = document.getElementById('task-tag').value.trim() || 'Övrigt';
    const description = document.getElementById('task-desc').value.trim();
    
    if (!title) return;

    // Determine color
    const tasks = await getAllTasks();
    const existingTaskWithTag = tasks.find(t => t.tag.toLowerCase() === tag.toLowerCase() && t.color);
    const color = existingTaskWithTag ? existingTaskWithTag.color : generateColorForTag(tag);

    // Get next ID
    const existingIds = new Set(tasks.map(t => parseInt(t.id, 10)).filter(id => !isNaN(id)));
    let nextId = 1;
    while (existingIds.has(nextId)) {
        nextId++;
    }

    const newTask = {
        id: nextId.toString(),
        title,
        description,
        status: 'Att göra',
        tag,
        color
    };

    await saveTask(newTask);
    closeModal();
    renderBoard();
});

// Event Listeners
addTaskBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if(e.target === modalOverlay) closeModal();
});

confirmCancelBtn.addEventListener('click', closeConfirmModal);

confirmDeleteBtn.addEventListener('click', async () => {
    if (taskToDeleteId) {
        await deleteTask(taskToDeleteId);
        closeConfirmModal();
        renderBoard();
    }
});

confirmModalOverlay.addEventListener('click', (e) => {
    if(e.target === confirmModalOverlay) closeConfirmModal();
});

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        renderBoard();
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
});
