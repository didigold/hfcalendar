// Global application state
let appState = {
    currentDate: new Date(2025, 6, 1), // July 2025
    currentView: 'month',
    currentUser: null,
    members: [],
    vacations: [],
    selectedColor: null,
    editingMember: null,
    editingVacation: null,
    broadcastChannel: null
};

// Initial data
const initialData = {
    members: [
        {
            id: "member_1",
            name: "Ana García",
            email: "ana.garcia@empresa.com",
            role: "admin",
            color: "#3B82F6",
            active: true
        },
        {
            id: "member_2", 
            name: "Carlos López",
            email: "carlos.lopez@empresa.com",
            role: "editor",
            color: "#10B981", 
            active: true
        },
        {
            id: "member_3",
            name: "María Rodríguez", 
            email: "maria.rodriguez@empresa.com",
            role: "editor",
            color: "#F59E0B",
            active: true
        },
        {
            id: "member_4",
            name: "David Martín",
            email: "david.martin@empresa.com", 
            role: "viewer",
            color: "#EF4444",
            active: true
        },
        {
            id: "member_5",
            name: "Laura Sánchez",
            email: "laura.sanchez@empresa.com",
            role: "editor", 
            color: "#8B5CF6",
            active: true
        }
    ],
    vacations: [
        {
            id: "vacation_1",
            memberId: "member_1",
            startDate: "2025-07-15",
            endDate: "2025-07-25", 
            type: "Vacaciones",
            notes: "Vacaciones de verano",
            createdAt: "2025-06-30T10:00:00Z"
        },
        {
            id: "vacation_2",
            memberId: "member_2", 
            startDate: "2025-07-08",
            endDate: "2025-07-10",
            type: "Personal", 
            notes: "Asuntos familiares",
            createdAt: "2025-06-29T14:30:00Z"
        },
        {
            id: "vacation_3",
            memberId: "member_3",
            startDate: "2025-07-22",
            endDate: "2025-07-26",
            type: "Formación",
            notes: "Curso de especialización", 
            createdAt: "2025-06-28T09:15:00Z"
        },
        {
            id: "vacation_4", 
            memberId: "member_4",
            startDate: "2025-08-05",
            endDate: "2025-08-12",
            type: "Vacaciones",
            notes: "Vacaciones de agosto",
            createdAt: "2025-06-27T16:45:00Z"
        },
        {
            id: "vacation_5",
            memberId: "member_5",
            startDate: "2025-07-03",
            endDate: "2025-07-03", 
            type: "Enfermedad",
            notes: "Cita médica",
            createdAt: "2025-06-26T11:20:00Z"
        }
    ],
    currentUser: {
        id: "member_1",
        name: "Ana García", 
        role: "admin"
    },
    availableColors: [
        "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4",
        "#84CC16", "#F97316", "#EC4899", "#6366F1", "#14B8A6", "#FDE047", 
        "#F87171", "#A78BFA", "#34D399", "#FBBF24", "#FB7185", "#60A5FA",
        "#4ADE80", "#FACC15", "#F472B6", "#818CF8", "#2DD4BF", "#FCD34D"
    ],
    vacationTypes: ["Vacaciones", "Personal", "Enfermedad", "Formación"]
};

// Utility functions
function generateUniqueId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(date) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateString(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
}

function isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isDateInRange(date, startDate, endDate) {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
}

// Permission system
function checkPermissions(action, userId = null) {
    const user = appState.currentUser;
    if (!user) return false;

    switch (action) {
        case 'add_member':
        case 'edit_member':
        case 'delete_member':
            return user.role === 'admin';
        case 'add_vacation':
            return user.role === 'admin' || user.role === 'editor';
        case 'edit_vacation':
        case 'delete_vacation':
            if (user.role === 'admin') return true;
            if (user.role === 'editor' && userId === user.id) return true;
            return false;
        case 'view_vacation':
            return true;
        default:
            return false;
    }
}

// Storage functions
function saveToStorage() {
    const data = {
        members: appState.members,
        vacations: appState.vacations,
        currentUser: appState.currentUser
    };
    localStorage.setItem('collaborativeCalendar', JSON.stringify(data));
}

function loadFromStorage() {
    const stored = localStorage.getItem('collaborativeCalendar');
    if (stored) {
        const data = JSON.parse(stored);
        appState.members = data.members || initialData.members;
        appState.vacations = data.vacations || initialData.vacations;
        appState.currentUser = data.currentUser || initialData.currentUser;
    } else {
        appState.members = initialData.members;
        appState.vacations = initialData.vacations;
        appState.currentUser = initialData.currentUser;
    }
}

// Broadcast Channel for real-time collaboration
function setupBroadcastChannel() {
    appState.broadcastChannel = new BroadcastChannel('calendar_updates');
    
    appState.broadcastChannel.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
            case 'member_added':
            case 'member_updated':
                const memberIndex = appState.members.findIndex(m => m.id === data.id);
                if (memberIndex >= 0) {
                    appState.members[memberIndex] = data;
                } else {
                    appState.members.push(data);
                }
                renderMembers();
                renderCalendar();
                showNotification(`Miembro ${type === 'member_added' ? 'agregado' : 'actualizado'}: ${data.name}`);
                break;
                
            case 'vacation_added':
            case 'vacation_updated':
                const vacationIndex = appState.vacations.findIndex(v => v.id === data.id);
                if (vacationIndex >= 0) {
                    appState.vacations[vacationIndex] = data;
                } else {
                    appState.vacations.push(data);
                }
                renderCalendar();
                showNotification(`Vacaciones ${type === 'vacation_added' ? 'agregadas' : 'actualizadas'}`);
                break;
                
            case 'vacation_deleted':
                appState.vacations = appState.vacations.filter(v => v.id !== data.id);
                renderCalendar();
                showNotification('Vacaciones eliminadas');
                break;
        }
    });
}

function broadcastChange(type, data) {
    if (appState.broadcastChannel) {
        appState.broadcastChannel.postMessage({ type, data });
    }
}

// Notification system
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.className = `notification ${isError ? 'error' : ''} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Calendar rendering
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarTitle = document.getElementById('calendarTitle');
    
    calendarTitle.textContent = formatDate(appState.currentDate);
    
    // Clear existing content
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Get first day of month and days in month
    const firstDay = new Date(appState.currentDate.getFullYear(), appState.currentDate.getMonth(), 1);
    const lastDay = new Date(appState.currentDate.getFullYear(), appState.currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDate; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day calendar-day--other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(appState.currentDate.getFullYear(), appState.currentDate.getMonth(), day);
        
        dayElement.className = 'calendar-day';
        if (isSameDate(currentDate, today)) {
            dayElement.classList.add('calendar-day--today');
        }
        
        dayElement.innerHTML = `
            <div class="calendar-day__number">${day}</div>
            <div class="calendar-day__vacations" id="vacations-${day}"></div>
        `;
        
        // Add click event for adding vacations
        dayElement.addEventListener('click', () => {
            if (checkPermissions('add_vacation')) {
                openVacationModal(currentDate);
            }
        });
        
        calendarGrid.appendChild(dayElement);
        
        // Add vacations for this day
        renderVacationsForDay(day, currentDate);
    }
}

function renderVacationsForDay(day, date) {
    const vacationsContainer = document.getElementById(`vacations-${day}`);
    if (!vacationsContainer) return;
    
    vacationsContainer.innerHTML = '';
    
    const dayVacations = appState.vacations.filter(vacation => {
        return isDateInRange(date, vacation.startDate, vacation.endDate);
    });
    
    dayVacations.forEach(vacation => {
        const member = appState.members.find(m => m.id === vacation.memberId);
        if (!member) return;
        
        const vacationElement = document.createElement('div');
        vacationElement.className = `vacation-item vacation-item--${vacation.type.toLowerCase()}`;
        vacationElement.style.backgroundColor = member.color;
        vacationElement.textContent = `${member.name.split(' ')[0]} - ${vacation.type}`;
        vacationElement.title = `${member.name}: ${vacation.type}\n${vacation.notes || ''}`;
        
        vacationElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (checkPermissions('edit_vacation', vacation.memberId)) {
                openVacationModal(date, vacation);
            }
        });
        
        vacationsContainer.appendChild(vacationElement);
    });
}

// Member management
function renderMembers() {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';
    
    appState.members.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'member-item';
        memberElement.innerHTML = `
            <div class="member-color" style="background-color: ${member.color}"></div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role}</div>
            </div>
        `;
        
        if (checkPermissions('edit_member')) {
            memberElement.addEventListener('click', () => {
                openMemberModal(member);
            });
        }
        
        membersList.appendChild(memberElement);
    });
    
    // Update vacation member select
    updateVacationMemberSelect();
}

function updateVacationMemberSelect() {
    const vacationMemberSelect = document.getElementById('vacationMember');
    vacationMemberSelect.innerHTML = '';
    
    appState.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        vacationMemberSelect.appendChild(option);
    });
}

// Modal management
function openMemberModal(member = null) {
    const modal = document.getElementById('addMemberModal');
    const title = document.getElementById('memberModalTitle');
    const form = document.getElementById('memberForm');
    
    appState.editingMember = member;
    
    if (member) {
        title.textContent = 'Editar Miembro';
        document.getElementById('memberName').value = member.name;
        document.getElementById('memberEmail').value = member.email;
        document.getElementById('memberRole').value = member.role;
        appState.selectedColor = member.color;
    } else {
        title.textContent = 'Agregar Miembro';
        form.reset();
        appState.selectedColor = null;
    }
    
    renderColorPalette();
    modal.classList.add('show');
}

function closeMemberModal() {
    const modal = document.getElementById('addMemberModal');
    modal.classList.remove('show');
    appState.editingMember = null;
    appState.selectedColor = null;
}

function openVacationModal(date, vacation = null) {
    const modal = document.getElementById('addVacationModal');
    const title = document.getElementById('vacationModalTitle');
    const form = document.getElementById('vacationForm');
    const deleteBtn = document.getElementById('deleteVacationBtn');
    
    appState.editingVacation = vacation;
    
    if (vacation) {
        title.textContent = 'Editar Vacaciones';
        document.getElementById('vacationMember').value = vacation.memberId;
        document.getElementById('vacationStartDate').value = vacation.startDate;
        document.getElementById('vacationEndDate').value = vacation.endDate;
        document.getElementById('vacationType').value = vacation.type;
        document.getElementById('vacationNotes').value = vacation.notes || '';
        deleteBtn.style.display = checkPermissions('delete_vacation', vacation.memberId) ? 'block' : 'none';
    } else {
        title.textContent = 'Agregar Vacaciones';
        form.reset();
        document.getElementById('vacationStartDate').value = date.toISOString().split('T')[0];
        document.getElementById('vacationEndDate').value = date.toISOString().split('T')[0];
        deleteBtn.style.display = 'none';
    }
    
    modal.classList.add('show');
}

function closeVacationModal() {
    const modal = document.getElementById('addVacationModal');
    modal.classList.remove('show');
    appState.editingVacation = null;
}

function renderColorPalette() {
    const colorPalette = document.getElementById('colorPalette');
    colorPalette.innerHTML = '';
    
    const usedColors = appState.members.map(m => m.color);
    
    initialData.availableColors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        
        if (color === appState.selectedColor) {
            colorOption.classList.add('selected');
        }
        
        if (usedColors.includes(color) && appState.selectedColor !== color) {
            colorOption.style.opacity = '0.3';
        }
        
        colorOption.addEventListener('click', () => {
            appState.selectedColor = color;
            renderColorPalette();
        });
        
        colorPalette.appendChild(colorOption);
    });
}

// Event handlers
function initializeEventHandlers() {
    // Calendar navigation
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        appState.currentDate.setMonth(appState.currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        appState.currentDate.setMonth(appState.currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        appState.currentDate = new Date();
        renderCalendar();
    });
    
    // Member modal
    document.getElementById('addMemberBtn').addEventListener('click', () => {
        if (checkPermissions('add_member')) {
            openMemberModal();
        } else {
            showNotification('No tienes permisos para agregar miembros', true);
        }
    });
    
    document.getElementById('closeMemberModal').addEventListener('click', closeMemberModal);
    document.getElementById('addMemberBackdrop').addEventListener('click', closeMemberModal);
    document.getElementById('cancelMemberBtn').addEventListener('click', closeMemberModal);
    
    // Vacation modal
    document.getElementById('closeVacationModal').addEventListener('click', closeVacationModal);
    document.getElementById('addVacationBackdrop').addEventListener('click', closeVacationModal);
    document.getElementById('cancelVacationBtn').addEventListener('click', closeVacationModal);
    
    // Forms
    document.getElementById('memberForm').addEventListener('submit', handleMemberSubmit);
    document.getElementById('vacationForm').addEventListener('submit', handleVacationSubmit);
    document.getElementById('deleteVacationBtn').addEventListener('click', handleVacationDelete);
}

function handleMemberSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('memberName').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const role = document.getElementById('memberRole').value;
    
    if (!name || !email || !appState.selectedColor) {
        showNotification('Por favor completa todos los campos', true);
        return;
    }
    
    const memberData = {
        id: appState.editingMember ? appState.editingMember.id : generateUniqueId(),
        name,
        email,
        role,
        color: appState.selectedColor,
        active: true
    };
    
    if (appState.editingMember) {
        const index = appState.members.findIndex(m => m.id === memberData.id);
        appState.members[index] = memberData;
        broadcastChange('member_updated', memberData);
        showNotification('Miembro actualizado exitosamente');
    } else {
        appState.members.push(memberData);
        broadcastChange('member_added', memberData);
        showNotification('Miembro agregado exitosamente');
    }
    
    saveToStorage();
    renderMembers();
    closeMemberModal();
}

function handleVacationSubmit(e) {
    e.preventDefault();
    
    const memberId = document.getElementById('vacationMember').value;
    const startDate = document.getElementById('vacationStartDate').value;
    const endDate = document.getElementById('vacationEndDate').value;
    const type = document.getElementById('vacationType').value;
    const notes = document.getElementById('vacationNotes').value.trim();
    
    if (!memberId || !startDate || !endDate || !type) {
        showNotification('Por favor completa todos los campos requeridos', true);
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('La fecha de inicio no puede ser posterior a la fecha de fin', true);
        return;
    }
    
    const vacationData = {
        id: appState.editingVacation ? appState.editingVacation.id : generateUniqueId(),
        memberId,
        startDate,
        endDate,
        type,
        notes,
        createdAt: appState.editingVacation ? appState.editingVacation.createdAt : new Date().toISOString()
    };
    
    if (appState.editingVacation) {
        const index = appState.vacations.findIndex(v => v.id === vacationData.id);
        appState.vacations[index] = vacationData;
        broadcastChange('vacation_updated', vacationData);
        showNotification('Vacaciones actualizadas exitosamente');
    } else {
        appState.vacations.push(vacationData);
        broadcastChange('vacation_added', vacationData);
        showNotification('Vacaciones agregadas exitosamente');
    }
    
    saveToStorage();
    renderCalendar();
    closeVacationModal();
}

function handleVacationDelete() {
    if (!appState.editingVacation) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar estas vacaciones?')) {
        appState.vacations = appState.vacations.filter(v => v.id !== appState.editingVacation.id);
        broadcastChange('vacation_deleted', { id: appState.editingVacation.id });
        saveToStorage();
        renderCalendar();
        closeVacationModal();
        showNotification('Vacaciones eliminadas exitosamente');
    }
}

// Initialize application
function initializeApp() {
    loadFromStorage();
    setupBroadcastChannel();
    initializeEventHandlers();
    
    // Update UI with current user
    document.getElementById('currentUserName').textContent = appState.currentUser.name;
    document.getElementById('currentUserRole').textContent = appState.currentUser.role.charAt(0).toUpperCase() + appState.currentUser.role.slice(1);
    
    renderMembers();
    renderCalendar();
    
    showNotification('Calendario colaborativo iniciado');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);