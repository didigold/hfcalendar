const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO con CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware de seguridad y rendimiento
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Estado global de la aplicación
let appData = {
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
    ]
};

// Utility functions
function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function hasPermission(userRole, action, resourceOwnerId = null, currentUserId = null) {
    const permissions = {
        admin: ['view', 'create', 'update', 'delete', 'manage_members'],
        editor: ['view', 'create', 'update_own', 'delete_own'],
        viewer: ['view']
    };

    const userPermissions = permissions[userRole] || [];

    if (action === 'update' || action === 'delete') {
        if (userRole === 'admin') return true;
        if (userRole === 'editor' && resourceOwnerId === currentUserId) return true;
        return false;
    }

    return userPermissions.includes(action) || userPermissions.includes('admin');
}

// API Routes
app.get('/api/data', (req, res) => {
    res.json(appData);
});

app.post('/api/members', (req, res) => {
    const { name, email, role, color } = req.body;
    const userRole = req.headers['x-user-role'] || 'viewer';

    if (!hasPermission(userRole, 'manage_members')) {
        return res.status(403).json({ error: 'No tienes permisos para gestionar miembros' });
    }

    const newMember = {
        id: generateId('member'),
        name,
        email,
        role,
        color,
        active: true
    };

    appData.members.push(newMember);

    // Broadcast to all connected clients
    io.emit('member_added', newMember);

    res.json(newMember);
});

app.put('/api/members/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userRole = req.headers['x-user-role'] || 'viewer';

    if (!hasPermission(userRole, 'manage_members')) {
        return res.status(403).json({ error: 'No tienes permisos para gestionar miembros' });
    }

    const memberIndex = appData.members.findIndex(m => m.id === id);
    if (memberIndex === -1) {
        return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    appData.members[memberIndex] = { ...appData.members[memberIndex], ...updates };

    // Broadcast to all connected clients
    io.emit('member_updated', appData.members[memberIndex]);

    res.json(appData.members[memberIndex]);
});

app.post('/api/vacations', (req, res) => {
    const { memberId, startDate, endDate, type, notes } = req.body;
    const userRole = req.headers['x-user-role'] || 'viewer';
    const currentUserId = req.headers['x-user-id'];

    if (!hasPermission(userRole, 'create')) {
        return res.status(403).json({ error: 'No tienes permisos para crear vacaciones' });
    }

    const newVacation = {
        id: generateId('vacation'),
        memberId,
        startDate,
        endDate,
        type,
        notes: notes || '',
        createdAt: new Date().toISOString()
    };

    appData.vacations.push(newVacation);

    // Broadcast to all connected clients
    io.emit('vacation_added', newVacation);

    res.json(newVacation);
});

app.put('/api/vacations/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userRole = req.headers['x-user-role'] || 'viewer';
    const currentUserId = req.headers['x-user-id'];

    const vacationIndex = appData.vacations.findIndex(v => v.id === id);
    if (vacationIndex === -1) {
        return res.status(404).json({ error: 'Vacación no encontrada' });
    }

    const vacation = appData.vacations[vacationIndex];

    if (!hasPermission(userRole, 'update', vacation.memberId, currentUserId)) {
        return res.status(403).json({ error: 'No tienes permisos para editar esta vacación' });
    }

    appData.vacations[vacationIndex] = { ...vacation, ...updates };

    // Broadcast to all connected clients
    io.emit('vacation_updated', appData.vacations[vacationIndex]);

    res.json(appData.vacations[vacationIndex]);
});

app.delete('/api/vacations/:id', (req, res) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] || 'viewer';
    const currentUserId = req.headers['x-user-id'];

    const vacationIndex = appData.vacations.findIndex(v => v.id === id);
    if (vacationIndex === -1) {
        return res.status(404).json({ error: 'Vacación no encontrada' });
    }

    const vacation = appData.vacations[vacationIndex];

    if (!hasPermission(userRole, 'delete', vacation.memberId, currentUserId)) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar esta vacación' });
    }

    appData.vacations.splice(vacationIndex, 1);

    // Broadcast to all connected clients
    io.emit('vacation_deleted', { id });

    res.json({ success: true });
});

// Socket.IO Connection handling
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Send initial data to new client
    socket.emit('initial_data', appData);

    // Handle member events
    socket.on('add_member', (memberData) => {
        const newMember = {
            id: generateId('member'),
            ...memberData,
            active: true
        };

        appData.members.push(newMember);
        io.emit('member_added', newMember);
    });

    socket.on('update_member', ({ id, updates }) => {
        const memberIndex = appData.members.findIndex(m => m.id === id);
        if (memberIndex !== -1) {
            appData.members[memberIndex] = { ...appData.members[memberIndex], ...updates };
            io.emit('member_updated', appData.members[memberIndex]);
        }
    });

    // Handle vacation events
    socket.on('add_vacation', (vacationData) => {
        const newVacation = {
            id: generateId('vacation'),
            ...vacationData,
            createdAt: new Date().toISOString()
        };

        appData.vacations.push(newVacation);
        io.emit('vacation_added', newVacation);
    });

    socket.on('update_vacation', ({ id, updates }) => {
        const vacationIndex = appData.vacations.findIndex(v => v.id === id);
        if (vacationIndex !== -1) {
            appData.vacations[vacationIndex] = { ...appData.vacations[vacationIndex], ...updates };
            io.emit('vacation_updated', appData.vacations[vacationIndex]);
        }
    });

    socket.on('delete_vacation', ({ id }) => {
        const vacationIndex = appData.vacations.findIndex(v => v.id === id);
        if (vacationIndex !== -1) {
            appData.vacations.splice(vacationIndex, 1);
            io.emit('vacation_deleted', { id });
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📅 Calendario colaborativo disponible en http://localhost:${PORT}`);
});

module.exports = app;
