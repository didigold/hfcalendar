// Application Data and State
let appData = {
    teamMembers: [
        {
            id: 1,
            name: "Ana García",
            email: "ana.garcia@empresa.com",
            role: "admin",
            color: "#FF6B6B",
            active: true
        },
        {
            id: 2,
            name: "Carlos Rodríguez",
            email: "carlos.rodriguez@empresa.com", 
            role: "editor",
            color: "#4ECDC4",
            active: true
        },
        {
            id: 3,
            name: "María López",
            email: "maria.lopez@empresa.com",
            role: "editor", 
            color: "#45B7D1",
            active: true
        },
        {
            id: 4,
            name: "David Martín",
            email: "david.martin@empresa.com",
            role: "viewer",
            color: "#96CEB4",
            active: true
        },
        {
            id: 5,
            name: "Laura Sánchez",
            email: "laura.sanchez@empresa.com",
            role: "editor",
            color: "#FECA57",
            active: true
        },
        {
            id: 6,
            name: "Javier Fernández",
            email: "javier.fernandez@empresa.com",
            role: "editor", 
            color: "#FF9FF3",
            active: true
        }
    ],
    vacationTypes: [
        {
            id: "vacation",
            name: "Vacaciones",
            icon: "🏖️"
        },
        {
            id: "personal",
            name: "Días Personales", 
            icon: "👤"
        },
        {
            id: "sick", 
            name: "Baja por Enfermedad",
            icon: "🤒"
        },
        {
            id: "training",
            name: "Formación",
            icon: "📚"
        }
    ],
    vacations: [
        {
            id: 1,
            memberId: 1,
            startDate: "2025-07-15",
            endDate: "2025-07-25",
            type: "vacation",
            notes: "Vacaciones de verano en familia",
            approved: true
        },
        {
            id: 2,
            memberId: 2,
            startDate: "2025-08-05",
            endDate: "2025-08-12",
            type: "vacation", 
            notes: "Viaje a los Pirineos",
            approved: true
        },
        {
            id: 3,
            memberId: 3,
            startDate: "2025-07-08",
            endDate: "2025-07-08",
            type: "personal",
            notes: "Día personal para gestiones",
            approved: true
        },
        {
            id: 4,
            memberId: 4,
            startDate: "2025-08-20",
            endDate: "2025-08-30",
            type: "vacation",
            notes: "Vacaciones en la costa",
            approved: false
        },
        {
            id: 5,
            memberId: 5,
            startDate: "2025-09-02",
            endDate: "2025-09-06",
            type: "training",
            notes: "Curso de certificación",
            approved: true
        },
        {
            id: 6,
            memberId: 6,
            startDate: "2025-07-22",
            endDate: "2025-07-23",
            type: "sick",
            notes: "Baja médica",
            approved: true
        }
    ],
    colorPalette: [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#FF9FF3",
        "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43", "#00B894", "#FDCB6E",
        "#6C5CE7", "#A29BFE", "#FD79A8", "#E17055", "#00B894", "#74B9FF",
        "#0984E3", "#A29BFE", "#6C5CE7", "#FD79A8", "#E84393", "#00CEC9"
    ],
    currentUser: {
        id: 1,
        role: "admin"
    },
    settings: {
        showWeekNumbers: true,
        startWeekOn: "monday",
        defaultView: "month",
        showWeekends: true,
        overlayMode: false
    }
};

// Application State
let appState = {
    currentDate: new Date(2025, 6, 1), // July 2025
    currentView: 'month',
    selectedDate: null,
    editingVacation: null,
    visibleMembers: new Set(),
    visibleVacationTypes: new Set(),
    showOnlyMyVacations: false
};

// Utility Functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function parseDate(dateString) {
    return new Date(dateString + 'T00:00:00');
}

function getDatesBetween(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getMemberById(id) {
    return appData.teamMembers.find(member => member.id === id);
}

function getVacationTypeById(id) {
    return appData.vacationTypes.find(type => type.id === id);
}

function hasPermission(action, targetMemberId = null) {
    const currentUser = appData.currentUser;
    const currentMember = getMemberById(currentUser.id);
    
    if (!currentMember) return false;
    
    switch (action) {
        case 'view':
            return true;
        case 'addVacation':
            return currentMember.role === 'admin' || currentMember.role === 'editor';
        case 'editVacation':
            return currentMember.role === 'admin' || 
                   (currentMember.role === 'editor' && targetMemberId === currentUser.id);
        case 'manageMembers':
            return currentMember.role === 'admin';
        default:
            return false;
    }
}

// Calendar Functions
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthYearElement = document.getElementById('calendarMonthYear');
    
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    
    if (appState.currentView === 'year') {
        monthYearElement.textContent = `Año ${appState.currentDate.getFullYear()}`;
    } else {
        monthYearElement.textContent = `${monthNames[appState.currentDate.getMonth()]} ${appState.currentDate.getFullYear()}`;
    }
    
    // Clear previous content
    calendar.innerHTML = '';
    
    if (appState.currentView === 'month') {
        renderMonthView(calendar, dayNames);
    } else if (appState.currentView === 'week') {
        renderWeekView(calendar, dayNames);
    } else if (appState.currentView === 'year') {
        renderYearView(calendar);
    }
}

function renderMonthView(calendar, dayNames) {
    calendar.className = 'calendar';
    
    if (!appData.settings.showWeekNumbers) {
        calendar.classList.add('hide-week-numbers');
    }
    
    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-header-row';
    
    if (appData.settings.showWeekNumbers) {
        const weekNumberHeader = document.createElement('div');
        weekNumberHeader.className = 'week-number-header';
        weekNumberHeader.textContent = 'Sem';
        headerRow.appendChild(weekNumberHeader);
    }
    
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        headerRow.appendChild(dayHeader);
    });
    
    calendar.appendChild(headerRow);
    
    // Calendar days
    const year = appState.currentDate.getFullYear();
    const month = appState.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust for Monday start
    let startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Calculate weeks properly to avoid overlap
    const totalDays = 42; // 6 weeks * 7 days
    let currentDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
        const weekRow = document.createElement('div');
        weekRow.className = 'calendar-week';
        
        if (appData.settings.showWeekNumbers) {
            const weekNumber = document.createElement('div');
            weekNumber.className = 'week-number';
            weekNumber.textContent = getWeekNumber(currentDate);
            weekRow.appendChild(weekNumber);
        }
        
        for (let day = 0; day < 7; day++) {
            const dayElement = createDayElement(new Date(currentDate), month);
            weekRow.appendChild(dayElement);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        calendar.appendChild(weekRow);
        
        // Break if we've passed the end of the month and filled at least 5 weeks
        if (week >= 4 && currentDate.getMonth() !== month) {
            break;
        }
    }
}

function createDayElement(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (date.getMonth() !== currentMonth) {
        dayElement.classList.add('other-month');
    }
    
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    
    const vacationsContainer = document.createElement('div');
    vacationsContainer.className = 'day-vacations';
    
    // Get vacations for this day
    const dayVacations = getVacationsForDate(date);
    dayVacations.forEach(vacation => {
        const vacationBlock = createVacationBlock(vacation, date);
        if (vacationBlock.textContent) { // Only add non-empty blocks
            vacationsContainer.appendChild(vacationBlock);
        }
    });
    
    dayElement.appendChild(vacationsContainer);
    
    // Add click handler
    dayElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('vacation-block')) {
            return; // Handle vacation block clicks separately
        }
        handleDayClick(date);
    });
    
    return dayElement;
}

function createVacationBlock(vacation, date) {
    const member = getMemberById(vacation.memberId);
    const vacationType = getVacationTypeById(vacation.type);
    
    if (!member || !shouldShowVacation(vacation)) {
        return document.createElement('div');
    }
    
    const vacationBlock = document.createElement('div');
    vacationBlock.className = 'vacation-block';
    vacationBlock.style.backgroundColor = member.color;
    
    if (!vacation.approved) {
        vacationBlock.classList.add('not-approved');
    }
    
    const startDate = parseDate(vacation.startDate);
    const endDate = parseDate(vacation.endDate);
    
    if (startDate.getTime() !== endDate.getTime()) {
        vacationBlock.classList.add('multi-day');
    }
    
    const isStart = date.getTime() === startDate.getTime();
    const isEnd = date.getTime() === endDate.getTime();
    
    let displayText = '';
    if (isStart && isEnd) {
        displayText = `${member.name} - ${vacationType.name}`;
    } else if (isStart) {
        displayText = `${member.name} - ${vacationType.name} ▶`;
    } else if (isEnd) {
        displayText = `◀ ${member.name} - ${vacationType.name}`;
    } else {
        displayText = `${member.name}`;
    }
    
    vacationBlock.textContent = displayText;
    vacationBlock.title = `${member.name} - ${vacationType.name}\n${vacation.startDate} a ${vacation.endDate}\n${vacation.notes || ''}`;
    
    vacationBlock.addEventListener('click', (e) => {
        e.stopPropagation();
        handleVacationClick(vacation);
    });
    
    return vacationBlock;
}

function getVacationsForDate(date) {
    const dateStr = formatDate(date);
    return appData.vacations.filter(vacation => {
        const startDate = vacation.startDate;
        const endDate = vacation.endDate;
        return dateStr >= startDate && dateStr <= endDate;
    });
}

function shouldShowVacation(vacation) {
    const member = getMemberById(vacation.memberId);
    if (!member || !appState.visibleMembers.has(member.id)) {
        return false;
    }
    
    if (!appState.visibleVacationTypes.has(vacation.type)) {
        return false;
    }
    
    if (appState.showOnlyMyVacations && vacation.memberId !== appData.currentUser.id) {
        return false;
    }
    
    return true;
}

function renderWeekView(calendar, dayNames) {
    calendar.className = 'calendar week-view';
    
    // Get the week containing the current date
    const currentWeekStart = new Date(appState.currentDate);
    const dayOfWeek = (currentWeekStart.getDay() + 6) % 7;
    currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek);
    
    // Header
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-header-row';
    
    const timeHeader = document.createElement('div');
    timeHeader.className = 'week-number-header';
    timeHeader.textContent = 'Sem';
    headerRow.appendChild(timeHeader);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = `${dayNames[i]} ${date.getDate()}`;
        headerRow.appendChild(dayHeader);
    }
    
    calendar.appendChild(headerRow);
    
    // Week row
    const weekRow = document.createElement('div');
    weekRow.className = 'calendar-week';
    
    const timeColumn = document.createElement('div');
    timeColumn.className = 'week-number';
    timeColumn.textContent = getWeekNumber(currentWeekStart);
    weekRow.appendChild(timeColumn);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        const dayElement = createDayElement(date, appState.currentDate.getMonth());
        weekRow.appendChild(dayElement);
    }
    
    calendar.appendChild(weekRow);
}

function renderYearView(calendar) {
    calendar.className = 'calendar year-view';
    
    const year = appState.currentDate.getFullYear();
    const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    
    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-mini';
        
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-mini-header';
        monthHeader.textContent = `${monthNames[month]} ${year}`;
        monthContainer.appendChild(monthHeader);
        
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-mini-grid';
        
        // Add day headers
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'month-mini-day';
            dayHeader.textContent = day;
            dayHeader.style.fontWeight = 'bold';
            dayHeader.style.backgroundColor = 'var(--color-secondary)';
            dayHeader.style.cursor = 'default';
            monthGrid.appendChild(dayHeader);
        });
        
        // Calculate month layout
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        const dayOfWeek = (firstDay.getDay() + 6) % 7;
        startDate.setDate(startDate.getDate() - dayOfWeek);
        
        // Add days (6 weeks max)
        let currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'month-mini-day';
            dayElement.textContent = currentDate.getDate();
            
            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // Check if today
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Check for vacations
            const dayVacations = getVacationsForDate(currentDate);
            if (dayVacations.some(v => shouldShowVacation(v))) {
                dayElement.classList.add('has-vacation');
            }
            
            // Add click handler to navigate to month view
            dayElement.addEventListener('click', () => {
                appState.currentDate = new Date(year, month, currentDate.getDate());
                appState.currentView = 'month';
                updateViewButtons();
                renderCalendar();
            });
            
            monthGrid.appendChild(dayElement);
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Break after completing the month and reaching a full week
            if (i >= 34 && currentDate.getMonth() !== month && (i + 1) % 7 === 0) {
                break;
            }
        }
        
        monthContainer.appendChild(monthGrid);
        calendar.appendChild(monthContainer);
    }
}

// Team Members Functions
function renderTeamMembers() {
    const container = document.getElementById('teamMembers');
    container.innerHTML = '';
    
    appData.teamMembers.forEach(member => {
        if (!member.active) return;
        
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        
        if (!appState.visibleMembers.has(member.id)) {
            memberElement.classList.add('hidden');
        }
        
        memberElement.innerHTML = `
            <input type="checkbox" ${appState.visibleMembers.has(member.id) ? 'checked' : ''} 
                   onchange="toggleMemberVisibility(${member.id})">
            <div class="member-color" style="background-color: ${member.color}"></div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role}</div>
            </div>
        `;
        
        container.appendChild(memberElement);
    });
}

function toggleMemberVisibility(memberId) {
    if (appState.visibleMembers.has(memberId)) {
        appState.visibleMembers.delete(memberId);
    } else {
        appState.visibleMembers.add(memberId);
    }
    renderTeamMembers();
    renderCalendar();
}

function renderVacationTypeFilters() {
    const container = document.getElementById('vacationTypeFilters');
    container.innerHTML = '';
    
    appData.vacationTypes.forEach(type => {
        const filterElement = document.createElement('label');
        filterElement.className = 'vacation-type-filter checkbox-label';
        
        filterElement.innerHTML = `
            <input type="checkbox" ${appState.visibleVacationTypes.has(type.id) ? 'checked' : ''} 
                   onchange="toggleVacationTypeVisibility('${type.id}')">
            <span>${type.icon} ${type.name}</span>
        `;
        
        container.appendChild(filterElement);
    });
}

function toggleVacationTypeVisibility(typeId) {
    if (appState.visibleVacationTypes.has(typeId)) {
        appState.visibleVacationTypes.delete(typeId);
    } else {
        appState.visibleVacationTypes.add(typeId);
    }
    renderVacationTypeFilters();
    renderCalendar();
}

function renderLegend() {
    const container = document.getElementById('legend');
    container.innerHTML = '';
    
    appData.vacationTypes.forEach(type => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: var(--color-primary)"></div>
            <span>${type.icon} ${type.name}</span>
        `;
        container.appendChild(legendItem);
    });
}

// Event Handlers
function handleDayClick(date) {
    if (!hasPermission('addVacation')) {
        alert('No tienes permisos para añadir vacaciones');
        return;
    }
    
    appState.selectedDate = date;
    appState.editingVacation = null;
    showVacationModal();
}

function handleVacationClick(vacation) {
    if (!hasPermission('editVacation', vacation.memberId)) {
        return;
    }
    
    appState.editingVacation = vacation;
    showVacationModal();
}

function showVacationModal() {
    const modal = document.getElementById('vacationModal');
    const modalTitle = document.getElementById('modalTitle');
    const deleteBtn = document.getElementById('deleteVacation');
    
    if (appState.editingVacation) {
        modalTitle.textContent = 'Editar Vacación';
        deleteBtn.style.display = 'inline-block';
        populateVacationForm(appState.editingVacation);
    } else {
        modalTitle.textContent = 'Añadir Vacación';
        deleteBtn.style.display = 'none';
        clearVacationForm();
        if (appState.selectedDate) {
            document.getElementById('vacationStartDate').value = formatDate(appState.selectedDate);
            document.getElementById('vacationEndDate').value = formatDate(appState.selectedDate);
        }
    }
    
    populateVacationMemberSelect();
    populateVacationTypeSelect();
    modal.classList.add('active');
}

function populateVacationForm(vacation) {
    document.getElementById('vacationMember').value = vacation.memberId;
    document.getElementById('vacationStartDate').value = vacation.startDate;
    document.getElementById('vacationEndDate').value = vacation.endDate;
    document.getElementById('vacationType').value = vacation.type;
    document.getElementById('vacationNotes').value = vacation.notes || '';
    document.getElementById('vacationApproved').checked = vacation.approved;
}

function clearVacationForm() {
    document.getElementById('vacationForm').reset();
    if (appData.currentUser.role !== 'admin') {
        document.getElementById('vacationMember').value = appData.currentUser.id;
    }
}

function populateVacationMemberSelect() {
    const select = document.getElementById('vacationMember');
    select.innerHTML = '';
    
    if (appData.currentUser.role === 'admin') {
        appData.teamMembers.forEach(member => {
            if (member.active) {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.name;
                select.appendChild(option);
            }
        });
    } else {
        const currentMember = getMemberById(appData.currentUser.id);
        const option = document.createElement('option');
        option.value = currentMember.id;
        option.textContent = currentMember.name;
        select.appendChild(option);
        select.disabled = true;
    }
}

function populateVacationTypeSelect() {
    const select = document.getElementById('vacationType');
    select.innerHTML = '';
    
    appData.vacationTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = `${type.icon} ${type.name}`;
        select.appendChild(option);
    });
}

function hideVacationModal() {
    document.getElementById('vacationModal').classList.remove('active');
}

function saveVacation() {
    const form = document.getElementById('vacationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const vacationData = {
        memberId: parseInt(document.getElementById('vacationMember').value),
        startDate: document.getElementById('vacationStartDate').value,
        endDate: document.getElementById('vacationEndDate').value,
        type: document.getElementById('vacationType').value,
        notes: document.getElementById('vacationNotes').value,
        approved: document.getElementById('vacationApproved').checked
    };
    
    if (appState.editingVacation) {
        // Update existing vacation
        const index = appData.vacations.findIndex(v => v.id === appState.editingVacation.id);
        if (index !== -1) {
            appData.vacations[index] = { ...appState.editingVacation, ...vacationData };
        }
    } else {
        // Add new vacation
        const newVacation = {
            id: Date.now(),
            ...vacationData
        };
        appData.vacations.push(newVacation);
    }
    
    hideVacationModal();
    renderCalendar();
}

function deleteVacation() {
    if (appState.editingVacation && confirm('¿Estás seguro de que quieres eliminar esta vacación?')) {
        const index = appData.vacations.findIndex(v => v.id === appState.editingVacation.id);
        if (index !== -1) {
            appData.vacations.splice(index, 1);
        }
        hideVacationModal();
        renderCalendar();
    }
}

// Members Management
function showMembersModal() {
    if (!hasPermission('manageMembers')) {
        alert('No tienes permisos para gestionar miembros');
        return;
    }
    
    populateColorPicker();
    renderMembersList();
    document.getElementById('membersModal').classList.add('active');
}

function hideMembersModal() {
    document.getElementById('membersModal').classList.remove('active');
}

function populateColorPicker() {
    const container = document.getElementById('colorPicker');
    container.innerHTML = '';
    
    appData.colorPalette.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;
        
        colorOption.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            colorOption.classList.add('selected');
        });
        
        container.appendChild(colorOption);
    });
    
    // Select first color by default
    if (container.firstChild) {
        container.firstChild.classList.add('selected');
    }
}

function renderMembersList() {
    const container = document.getElementById('membersList');
    container.innerHTML = '';
    
    appData.teamMembers.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        
        memberItem.innerHTML = `
            <div class="member-item-info">
                <div class="member-color" style="background-color: ${member.color}"></div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${member.email} - ${member.role}</div>
                </div>
            </div>
            <div class="member-item-actions">
                <button class="btn btn--sm btn--secondary" onclick="editMember(${member.id})">Editar</button>
                <button class="btn btn--sm btn--secondary" onclick="toggleMemberActive(${member.id})">
                    ${member.active ? 'Desactivar' : 'Activar'}
                </button>
            </div>
        `;
        
        container.appendChild(memberItem);
    });
}

function addMember() {
    const form = document.getElementById('memberForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const selectedColor = document.querySelector('.color-option.selected');
    if (!selectedColor) {
        alert('Por favor selecciona un color');
        return;
    }
    
    const newMember = {
        id: Date.now(),
        name: document.getElementById('memberName').value,
        email: document.getElementById('memberEmail').value,
        role: document.getElementById('memberRole').value,
        color: selectedColor.dataset.color,
        active: true
    };
    
    appData.teamMembers.push(newMember);
    form.reset();
    populateColorPicker();
    renderMembersList();
    renderTeamMembers();
    
    // Add to visible members
    appState.visibleMembers.add(newMember.id);
}

function toggleMemberActive(memberId) {
    const member = getMemberById(memberId);
    if (member) {
        member.active = !member.active;
        if (!member.active) {
            appState.visibleMembers.delete(memberId);
        }
        renderMembersList();
        renderTeamMembers();
        renderCalendar();
    }
}

// Navigation Functions
function navigateMonth(direction) {
    const newDate = new Date(appState.currentDate);
    if (appState.currentView === 'year') {
        newDate.setFullYear(newDate.getFullYear() + direction);
    } else {
        newDate.setMonth(newDate.getMonth() + direction);
    }
    appState.currentDate = newDate;
    renderCalendar();
}

function goToToday() {
    appState.currentDate = new Date();
    renderCalendar();
}

function updateViewButtons() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === appState.currentView) {
            btn.classList.add('active');
        }
    });
}

function changeView(view) {
    appState.currentView = view;
    updateViewButtons();
    renderCalendar();
}

// Initialize Application
function initializeApp() {
    // Initialize visible members and vacation types
    appData.teamMembers.forEach(member => {
        if (member.active) {
            appState.visibleMembers.add(member.id);
        }
    });
    
    appData.vacationTypes.forEach(type => {
        appState.visibleVacationTypes.add(type.id);
    });
    
    // Render initial UI
    renderTeamMembers();
    renderVacationTypeFilters();
    renderLegend();
    renderCalendar();
    
    // Event listeners
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
    document.getElementById('todayBtn').addEventListener('click', goToToday);
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => changeView(btn.dataset.view));
    });
    
    document.getElementById('showWeekNumbers').addEventListener('change', (e) => {
        appData.settings.showWeekNumbers = e.target.checked;
        renderCalendar();
    });
    
    document.getElementById('overlayMode').addEventListener('change', (e) => {
        appData.settings.overlayMode = e.target.checked;
        renderCalendar();
    });
    
    document.getElementById('showOnlyMyVacations').addEventListener('change', (e) => {
        appState.showOnlyMyVacations = e.target.checked;
        renderCalendar();
    });
    
    document.getElementById('addVacationBtn').addEventListener('click', () => {
        appState.selectedDate = new Date();
        appState.editingVacation = null;
        showVacationModal();
    });
    
    document.getElementById('manageMembers').addEventListener('click', showMembersModal);
    
    // Modal event listeners
    document.getElementById('closeModal').addEventListener('click', hideVacationModal);
    document.getElementById('cancelVacation').addEventListener('click', hideVacationModal);
    document.getElementById('saveVacation').addEventListener('click', saveVacation);
    document.getElementById('deleteVacation').addEventListener('click', deleteVacation);
    
    document.getElementById('closeMembersModal').addEventListener('click', hideMembersModal);
    document.getElementById('memberForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addMember();
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
}

// Global functions for onclick handlers
window.toggleMemberVisibility = toggleMemberVisibility;
window.toggleVacationTypeVisibility = toggleVacationTypeVisibility;
window.toggleMemberActive = toggleMemberActive;
window.editMember = function(memberId) {
    // For now, just show an alert - could implement inline editing later
    alert('Función de edición pendiente de implementar');
};

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);