const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to every request so controllers can emit events
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/vets', require('./routes/vet.routes'));
app.use('/api/volunteers', require('./routes/volunteer.routes'));
app.use('/api/domestic', require('./routes/domestic.routes'));
app.use('/api/street', require('./routes/street.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/pets', require('./routes/pet.routes'));

// Socket.io — join case rooms for live tracking
io.on('connection', (socket) => {
  socket.on('joinCase', (caseId) => socket.join(`case_${caseId}`));
  socket.on('leaveCase', (caseId) => socket.leave(`case_${caseId}`));
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`PawRescue server running on port ${PORT}`));