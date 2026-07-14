const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const PORT = process.env.PORT || 6001;
const { createProxyMiddleware } = require('http-proxy-middleware');
// These MUST be before your routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
// Middleware
app.use(cors({
    origin: ['http://localhost:4000', 'http://192.168.10.250:4000', 'http://127.0.0.1:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const ticketDir = path.join(uploadsDir, 'tickets');
        if (!fs.existsSync(ticketDir)) {
            fs.mkdirSync(ticketDir, { recursive: true });
        }
        cb(null, ticketDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create attachments table if not exists
async function createAttachmentsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ticket_attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT,
                filename VARCHAR(255),
                original_name VARCHAR(255),
                file_path VARCHAR(500),
                file_type VARCHAR(100),
                file_size INT,
                uploaded_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ ticket_attachments table ready');
    } catch (error) {
        console.error('Error creating attachments table:', error);
    }
}
// Test database connection only (no table creation)
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    }
}

// ============================================
// REGISTER USER (UPDATED)
// ============================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { 
            username, password, fullname, email, role, department, 
            department_id, branch_id, avatar_color, registrationKey 
        } = req.body;
        
        console.log('📝 Registration attempt:', { 
            username, fullname, email, role, department, 
            department_id, branch_id, registrationKey,
            passwordLength: password ? password.length : 0
        });
        
        // Validate password length
        if (!password || password.length < 5) {
            return res.status(400).json({ message: 'Password must be at least 5 characters' });
        }
        
        // Validate registration key belongs to the selected branch
        const [keyResults] = await pool.query(
            `SELECT id, name, registration_key 
             FROM branches 
             WHERE id = ? AND registration_key = ? AND is_active = 1`,
            [branch_id, registrationKey]
        );
        
        if (keyResults.length === 0) {
            console.log('❌ Invalid registration key for branch:', registrationKey);
            return res.status(403).json({ message: 'Invalid registration key for this branch' });
        }
        console.log('✅ Valid registration key for branch:', keyResults[0].name);
        
        // ✅ Determine which table to use:
        // Main branch (1 or 5) + EDP/IT department → users table
        // All others → new_user table
        const isMainBranch = (branch_id == 1 || branch_id == 5);
        const deptName = (department || '').toLowerCase();
        const isEDPIT = deptName === 'edp' || deptName === 'it' || 
                        deptName === 'edp/it' || deptName === 'it/edp' ||
                        deptName.includes('edp') || deptName.includes('it');
        
        const tableName = (isMainBranch && isEDPIT) ? 'users' : 'new_user';
        
        console.log(`📌 Using table: ${tableName} for department: ${department}`);
        console.log(`📌 Role from frontend: ${role}`);
        
        // Check if user already exists
        const [existing] = await pool.query(
            `SELECT id FROM ${tableName} WHERE username = ? OR email = ?`, 
            [username, email]
        );
        
        if (existing.length > 0) {
            console.log('❌ User already exists:', username, email);
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed successfully');
        
        const insertQuery = `INSERT INTO ${tableName} (
            username, password, fullname, role, department, 
            branch_id, department_id, email, avatar_color, 
            registration_key, key_used_at, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`;
        
        const insertValues = [
            username, hashedPassword, fullname, role, department,
            branch_id, department_id, email, avatar_color || '#3b82f6',
            registrationKey
        ];
        
        const [result] = await pool.query(insertQuery, insertValues);
        
        console.log('✅ User registered successfully!');
        console.log('   ID:', result.insertId);
        console.log('   Table:', tableName);
        console.log('   Username:', username);
        console.log('   Role:', role);
        console.log('   Department:', department);
        console.log('   Branch ID:', branch_id);
        console.log('   Department ID:', department_id);
        
        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            userId: result.insertId,
            table: tableName,
            role: role
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ message: 'Registration failed: ' + error.message });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('🔐 Login attempt - Username:', username);
        console.log('🔑 Password length:', password?.length);
        
        let user = null;
        let userTable = '';
        
        // First check users table
        const [usersResult] = await pool.query(
            'SELECT *, "users" as user_table FROM users WHERE username = ? OR email = ?', 
            [username, username]
        );
        console.log('📊 Users table result:', usersResult.length > 0 ? 'Found' : 'Not found');
        
        if (usersResult.length > 0) {
            user = usersResult[0];
            userTable = 'users';
            console.log('✅ User found in users table:', user.username);
            console.log('📝 Hash length:', user.password?.length);
            console.log('📝 Hash preview:', user.password?.substring(0, 20) + '...');
        } else {
            // Check new_user table
            const [newUserResult] = await pool.query(
                'SELECT *, "new_user" as user_table FROM new_user WHERE username = ? OR email = ?', 
                [username, username]
            );
            console.log('📊 new_user table result:', newUserResult.length > 0 ? 'Found' : 'Not found');
            if (newUserResult.length > 0) {
                user = newUserResult[0];
                userTable = 'new_user';
                console.log('✅ User found in new_user table:', user.username);
                console.log('📝 Hash length:', user.password?.length);
                console.log('📝 Hash preview:', user.password?.substring(0, 20) + '...');
            }
        }
        
        if (!user) {
            console.log('❌ User not found in either table');
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        
        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const lockTime = new Date(user.locked_until);
            const minutesLeft = Math.ceil((lockTime.getTime() - Date.now()) / 60000);
            console.log('🔒 Account locked until:', user.locked_until);
            return res.status(423).json({ 
                success: false, 
                message: `Account is locked. Try again in ${minutesLeft} minute(s).` 
            });
        }
        
        // Compare password
        console.log('🔐 Comparing password for user:', user.username);
        const isValid = await bcrypt.compare(password, user.password);
        console.log('✅ Password match:', isValid);
        
        if (!isValid) {
            console.log('❌ Password does not match for user:', user.username);
            const newFailedAttempts = (user.failed_attempts || 0) + 1;
            
            if (newFailedAttempts >= 10) {
                const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                await pool.query(
                    `UPDATE ${userTable} SET failed_attempts = ?, locked_until = ? WHERE id = ?`,
                    [newFailedAttempts, lockUntil, user.id]
                );
                console.log('🔒 Account locked for user:', user.username);
                return res.status(423).json({ 
                    success: false, 
                    message: 'Account locked due to too many failed attempts. Try again in 30 minutes.' 
                });
            } else {
                await pool.query(
                    `UPDATE ${userTable} SET failed_attempts = ? WHERE id = ?`,
                    [newFailedAttempts, user.id]
                );
                console.log('⚠️ Failed attempt count:', newFailedAttempts, 'for user:', user.username);
            }
            
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        
        // Reset failed attempts on successful login
        if (user.failed_attempts > 0) {
            await pool.query(
                `UPDATE ${userTable} SET failed_attempts = 0, locked_until = NULL WHERE id = ?`,
                [user.id]
            );
            console.log('✅ Reset failed attempts for user:', user.username);
        }
        
        console.log('✅ Login successful for user:', user.username);
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, userTable: userTable },
            'secret_key',
            { expiresIn: '7d' }
        );
        
        // Build user response with all fields
        const userResponse = {
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            department: user.department || '',
            avatar_color: user.avatar_color || '#00c878',
            photo_url: user.photo_url || '',
            birthdate: user.birthdate || '',
            workDays: user.workDays || '',
            dayOff: user.dayOff || '',
            workStart: user.workStart || '',
            workEnd: user.workEnd || '',
            lunchStart: user.lunchStart || '',
            lunchEnd: user.lunchEnd || '',
            leaveEntries: user.leaveEntries || '',
            created_at: user.created_at,
            user_table: userTable
        };
        
        // Add branch_id and department_id for both tables
        userResponse.branch_id = user.branch_id || null;
        userResponse.department_id = user.department_id || null;
        
        res.json({ 
            success: true, 
            token, 
            user: userResponse
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Verify user is in new_user table and is authorized
app.get('/api/auth/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        // Check if user exists in new_user table
        const [rows] = await pool.query(
            'SELECT id, is_verified, locked_until FROM new_user WHERE id = ?',
            [decoded.id]
        );
        
        if (rows.length === 0) {
            return res.status(403).json({ valid: false, error: 'User not found' });
        }
        
        const user = rows[0];
        
        // Check if user is verified
        if (!user.is_verified) {
            return res.status(403).json({ valid: false, error: 'Account not verified' });
        }
        
        // Check if user is locked out
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(403).json({ valid: false, error: 'Account is temporarily locked' });
        }
        
        res.json({ valid: true });
    } catch (error) {
        res.status(401).json({ valid: false, error: 'Invalid token' });
    }
});

// ============================================
// AUTH VERIFICATION ENDPOINTS
// ============================================
// Verify admin/technician user from users table - UPDATED to allow ALL users from users table
app.get('/api/auth/verify-admin', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ valid: false, error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        console.log('🔐 verify-admin - Decoded token:', decoded);
        console.log('🔐 userTable from token:', decoded.userTable);
        
        let user = null;
        let userTable = '';
        
        // Check which table the user is from (from token or default to 'users')
        userTable = decoded.userTable || 'users';
        
        // Query the correct table
        const [rows] = await pool.query(
            `SELECT id, username, fullname, role, department, branch_id, 
                    avatar_color, photo_url, is_verified, locked_until,
                    registration_key, created_at
             FROM ${userTable} 
             WHERE id = ?`,
            [decoded.id]
        );
        
        if (rows.length === 0) {
            console.log('❌ User not found in', userTable, 'table');
            return res.status(403).json({ 
                valid: false, 
                error: 'User not found' 
            });
        }
        
        user = rows[0];
        console.log('✅ User found in', userTable, 'table:', user.username);
        console.log('✅ User role:', user.role);
        
        // Check if user is verified
        if (!user.is_verified) {
            return res.status(403).json({ 
                valid: false, 
                error: 'Account not verified' 
            });
        }
        
        // Check if user is locked out
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(403).json({ 
                valid: false, 
                error: 'Account is temporarily locked',
                lockedUntil: user.locked_until 
            });
        }
        
        // ✅ FIX: Allow ANY user from the 'users' table (not just admin/Technician)
        let isAuthorized = false;
        
        if (userTable === 'users') {
            // ✅ ALL users from 'users' table are allowed
            isAuthorized = true;
            console.log('✅ User from users table - access granted');
        } else if (userTable === 'new_user') {
            // ❌ Users from 'new_user' table - only allow if they have admin role
            if (user.role === 'admin') {
                isAuthorized = true;
                console.log('✅ Admin user from new_user table - access granted');
            } else {
                console.log('❌ Non-admin user from new_user table - denied');
            }
        } else {
            console.log('❌ Unknown user table:', userTable);
        }
        
        if (!isAuthorized) {
            return res.status(403).json({ 
                valid: false, 
                error: 'Access denied. EDP/IT staff only.' 
            });
        }
        
        // Return valid with user info (include user_table)
        res.json({ 
            valid: true, 
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role,
                department: user.department || '',
                branch_id: user.branch_id,
                avatar_color: user.avatar_color || '#4f6ef7',
                photo_url: user.photo_url || '',
                user_table: userTable,  // ✅ CRITICAL: Include this!
                registration_key: user.registration_key || '',
                is_verified: user.is_verified,
                created_at: user.created_at
            }
        });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
        }
        console.error('❌ verify-admin error:', error);
        res.status(500).json({ valid: false, error: 'Server error during verification' });
    }
});

// Validate admin token (lighter check for periodic validation) - UPDATED
app.get('/api/auth/validate-admin-token', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ valid: false, error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        console.log('🔐 validate-admin-token - Decoded:', decoded);
        
        // Check which table the user is from
        const userTable = decoded.userTable || 'users';
        console.log('🔐 userTable from token:', userTable);
        
        // Query the correct table
        const [rows] = await pool.query(
            `SELECT id, role, is_verified, locked_until, registration_key
             FROM ${userTable} 
             WHERE id = ?`,
            [decoded.id]
        );
        
        if (rows.length === 0) {
            return res.status(403).json({ valid: false, error: 'User not found' });
        }
        
        const user = rows[0];
        
        if (!user.is_verified) {
            return res.status(403).json({ valid: false, error: 'Account not verified' });
        }
        
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(403).json({ valid: false, error: 'Account locked' });
        }
        
        // ✅ FIX: Allow ALL users from 'users' table
        let isAuthorized = false;
        
        if (userTable === 'users') {
            // ✅ ALL users from 'users' table are authorized
            isAuthorized = true;
            console.log('✅ User from users table - validated');
        } else if (userTable === 'new_user') {
            // ❌ Users from 'new_user' table - only allow if they have admin role
            if (user.role === 'admin') {
                isAuthorized = true;
                console.log('✅ Admin user from new_user table - validated');
            } else {
                console.log('❌ Non-admin user from new_user table - denied');
            }
        }
        
        if (!isAuthorized) {
            return res.status(403).json({ 
                valid: false, 
                error: 'Access denied. EDP/IT staff only.' 
            });
        }
        
        res.json({ valid: true });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
        }
        console.error('❌ validate-admin-token error:', error);
        res.status(500).json({ valid: false, error: 'Server error during validation' });
    }
});
// Validate token endpoint
app.get('/api/auth/validate-token', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        // Check if user still exists and is valid
        const [rows] = await pool.query(
            'SELECT id, is_verified, locked_until FROM new_user WHERE id = ?',
            [decoded.id]
        );
        
        if (rows.length === 0 || !rows[0].is_verified) {
            return res.status(403).json({ error: 'User not authorized' });
        }
        
        if (rows[0].locked_until && new Date(rows[0].locked_until) > new Date()) {
            return res.status(403).json({ error: 'Account locked' });
        }
        
        res.json({ valid: true });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
// ============================================
// VALIDATE REGISTRATION KEY (branch-based)
// ============================================
app.post('/api/auth/validate-key', async (req, res) => {
    try {
        const { key_code } = req.body;
        
        console.log('🔑 Validating registration key:', key_code);
        
        // Check if key exists in branches table
        const [keyResults] = await pool.query(
            `SELECT id, name, company_name, registration_key 
             FROM branches 
             WHERE registration_key = ? AND is_active = 1`,
            [key_code]
        );
        
        if (keyResults.length > 0) {
            console.log('✅ Valid branch key found:', key_code);
            res.json({ 
                valid: true, 
                branch_id: keyResults[0].id,
                branch_name: keyResults[0].name,
                company_name: keyResults[0].company_name,
                message: 'Registration key is valid' 
            });
        } else {
            console.log('❌ Key not found or inactive:', key_code);
            res.status(400).json({ valid: false, message: 'Invalid registration key' });
        }
    } catch (error) {
        console.error('❌ Key validation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// function for profile components
// ============================================
app.put('/api/profile/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const { 
            fullname, email, username, department, role, 
            avatar_color, photo_url, birthdate,
            workDays, dayOff, workStart, workEnd, 
            lunchStart, lunchEnd 
        } = req.body;
        
        if (table !== 'users' && table !== 'new_user') {
            return res.status(400).json({ message: 'Invalid table' });
        }
        
        const updates = [];
        const values = [];
        
        if (fullname !== undefined) { updates.push('fullname = ?'); values.push(fullname); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email); }
        if (username !== undefined) { updates.push('username = ?'); values.push(username); }
        if (department !== undefined) { updates.push('department = ?'); values.push(department); }
        if (avatar_color !== undefined) { updates.push('avatar_color = ?'); values.push(avatar_color); }
        if (photo_url !== undefined) { updates.push('photo_url = ?'); values.push(photo_url); }
        if (birthdate !== undefined) { updates.push('birthdate = ?'); values.push(birthdate); }
        if (workDays !== undefined) { updates.push('workDays = ?'); values.push(workDays); }
        if (dayOff !== undefined) { updates.push('dayOff = ?'); values.push(dayOff); }
        if (workStart !== undefined) { updates.push('workStart = ?'); values.push(workStart); }
        if (workEnd !== undefined) { updates.push('workEnd = ?'); values.push(workEnd); }
        if (lunchStart !== undefined) { updates.push('lunchStart = ?'); values.push(lunchStart); }
        if (lunchEnd !== undefined) { updates.push('lunchEnd = ?'); values.push(lunchEnd); }
        if (role !== undefined && table === 'new_user') { updates.push('role = ?'); values.push(role); }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No updates provided' });
        }
        
        values.push(id);
        await pool.query(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, values);
        
        res.json({ success: true, message: 'Profile updated' });
        
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Configure multer for profile photos
const profilePhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const photoDir = path.join(__dirname, 'uploads', 'profiles');
        if (!fs.existsSync(photoDir)) {
            fs.mkdirSync(photoDir, { recursive: true });
        }
        cb(null, photoDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const uploadPhoto = multer({ 
    storage: profilePhotoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const logoDir = path.join(__dirname, 'uploads', 'logos');
        if (!fs.existsSync(logoDir)) {
            fs.mkdirSync(logoDir, { recursive: true });
        }
        cb(null, logoDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
    }
});

const uploadLogo = multer({ 
    storage: logoStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for logos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});
// Add this right after your uploadPhoto configuration
const chatStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const chatDir = path.join(uploadsDir, 'chat');
        if (!fs.existsSync(chatDir)) {
            fs.mkdirSync(chatDir, { recursive: true });
        }
        cb(null, chatDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'chat-' + uniqueSuffix + ext);
    }
});

const uploadChat = multer({ 
    storage: chatStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// Upload profile photo
app.post('/api/profile/:table/:id/upload-photo', uploadPhoto.single('photo'), async (req, res) => {
    try {
        const { table, id } = req.params;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        if (table !== 'users' && table !== 'new_user') {
            return res.status(400).json({ message: 'Invalid table' });
        }
        
        const filePath = '/uploads/profiles/' + file.filename;
        
        // Update photo_url in database
        await pool.query(`UPDATE ${table} SET photo_url = ? WHERE id = ?`, [filePath, id]);
        
        res.json({ 
            success: true, 
            file_path: filePath,
            message: 'Photo uploaded successfully' 
        });
        
    } catch (error) {
        console.error('Photo upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Change password
app.post('/api/profile/:table/:id/change-password', async (req, res) => {
    try {
        const { table, id } = req.params;
        const { currentPassword, newPassword } = req.body;
        
        console.log('🔒 Password change request for:', table, 'user ID:', id);
        
        if (table !== 'users' && table !== 'new_user') {
            return res.status(400).json({ message: 'Invalid table' });
        }
        
        // Verify current password
        const [user] = await pool.query(`SELECT password FROM ${table} WHERE id = ?`, [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isValid = await bcrypt.compare(currentPassword, user[0].password);
        if (!isValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedPassword, id]);
        
        console.log('✅ Password changed successfully');
        res.json({ success: true, message: 'Password changed successfully' });
        
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: error.message });
    }
});
// ============ TICKET ROUTES ============
app.get('/api/tickets/my', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId);
        const userTable = req.query.userTable || 'new_user';
        const branchId = parseInt(req.query.branchId) || null;
        const userRole = req.query.role || 'user';
        const userDepartmentId = parseInt(req.query.departmentId) || null;
        const includeAssignedUsers = req.query.includeAssignedUsers === 'true'; // ✅ NEW
        
        console.log('═══════════════════════════════════════');
        console.log('📋 /api/tickets/my REQUEST:');
        console.log('   userId:', userId, 'branchId:', branchId, 'role:', userRole, 'deptId:', userDepartmentId);
        console.log('   userTable:', userTable);
        console.log('   includeAssignedUsers:', includeAssignedUsers);
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        let query = `
            SELECT t.*, 
                   t.created_by_name,
                   COALESCE(u.department, nu.department, '') as creator_department,
                   cb.name as creator_branch_name,
                   cb.company_name as creator_company_name,
                   d.name as department_name,
                   d.branch_id as dept_branch_id,
                   b.name as branch_name,
                   b.company_name as company_name,
                   a.fullname as agent_name
        `;
        
        // ✅ Only include assigned_users details if requested
        if (includeAssignedUsers) {
            query += `,
                   (
                       SELECT JSON_ARRAYAGG(
                           JSON_OBJECT(
                               'id', assigned_user.id,
                               'fullname', assigned_user.fullname,
                               'username', assigned_user.username,
                               'avatar_color', assigned_user.avatar_color,
                               'photo_url', assigned_user.photo_url
                           )
                       )
                       FROM (
                           SELECT 
                               JSON_EXTRACT(t.assigned_users, CONCAT('$[', numbers.n, '].id')) as id,
                               JSON_EXTRACT(t.assigned_users, CONCAT('$[', numbers.n, '].fullname')) as fullname,
                               JSON_EXTRACT(t.assigned_users, CONCAT('$[', numbers.n, '].username')) as username,
                               JSON_EXTRACT(t.assigned_users, CONCAT('$[', numbers.n, '].avatar_color')) as avatar_color,
                               JSON_EXTRACT(t.assigned_users, CONCAT('$[', numbers.n, '].photo_url')) as photo_url
                           FROM (
                               SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                               UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 
                               UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
                           ) numbers
                       ) assigned_user
                   ) as assigned_users_with_details
            `;
        }
        
        query += `
            FROM tickets t
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN branches b ON d.branch_id = b.id
            LEFT JOIN users a ON t.assigned_to = a.id
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN new_user nu ON t.created_by = nu.id
            LEFT JOIN branches cb ON (u.branch_id = cb.id OR nu.branch_id = cb.id)
            WHERE 1=1
        `;
        
        const values = [];
        
        // ✅ FIX: Check userTable instead of userRole
        if (userTable === 'users') {
            console.log('📌 EDP/IT STAFF - tickets sent to EDP/IT departments');
            
            if (branchId === 1 || branchId === 5) {
                query += ` AND t.department_id IN (
                    SELECT id FROM departments 
                    WHERE branch_id IN (1, 5)
                    AND (name = 'EDP/IT' OR name = 'EDP' OR name = 'IT' OR name LIKE '%EDP%' OR name LIKE '%IT%')
                )`;
            } else {
                query += ` AND t.department_id IN (
                    SELECT id FROM departments 
                    WHERE branch_id = ?
                    AND (name = 'EDP/IT' OR name = 'EDP' OR name = 'IT' OR name LIKE '%EDP%' OR name LIKE '%IT%')
                )`;
                values.push(branchId);
            }
        } else {
            console.log('📌 CLIENT - own tickets only');
            query += ' AND t.created_by = ?';
            values.push(userId);
        }
        
        query += ' ORDER BY t.created_at DESC';
        
        console.log('🔍 SQL:', query.substring(0, 200) + '...');
        console.log('📌 Values:', values);
        
        const [tickets] = await pool.query(query, values);
        
        // ✅ FIXED: Parse assigned_users with while-loop for double-stringified JSON
const parsedTickets = tickets.map(ticket => {
    let assignedUsers = [];
    
    if (ticket.assigned_users) {
        try {
            let raw = ticket.assigned_users;
            
            // Handle double-stringified JSON
            let attempts = 0;
            while (typeof raw === 'string' && attempts < 3) {
                try {
                    raw = JSON.parse(raw);
                    attempts++;
                } catch (e) {
                    break;
                }
            }
            
            if (Array.isArray(raw)) {
                assignedUsers = raw.filter(u => u !== null).map(u => {
                    if (typeof u === 'object' && u.id) {
                        return { id: u.id, fullname: u.fullname || null };
                    }
                    const uid = typeof u === 'object' ? u.id : u;
                    return { id: uid, fullname: null };
                });
            }
        } catch (e) {
            assignedUsers = [];
        }
    }
    
    // Fallback to assigned_to if no assigned_users
    if (assignedUsers.length === 0 && ticket.assigned_to) {
        assignedUsers = [{
            id: ticket.assigned_to,
            fullname: ticket.agent_name || null
        }];
    }
    
    return {
        ...ticket,
        assigned_users: assignedUsers
    };
});
        
        console.log(`✅ Found ${parsedTickets.length} tickets`);
        res.json(parsedTickets);
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ CLIENT TICKET ROUTES ============
app.get('/api/client/test', (req, res) => {
    console.log('✅ Test endpoint reached!');
    res.json({ message: 'Backend is working!', query: req.query });
});
/**
 * GET /api/client/tickets
 * Client-specific ticket endpoint
 */

app.get('/api/client/tickets', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId);
        const userTable = req.query.userTable || 'new_user';
        const branchId = parseInt(req.query.branchId) || null;
        const departmentId = parseInt(req.query.departmentId) || null;
        
        console.log('═══════════════════════════════════════');
        console.log('📋 /api/client/tickets REQUEST:');
        console.log('   userId:', userId);
        console.log('   branchId:', branchId);
        console.log('   departmentId:', departmentId);
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Get user info
        let userDeptId = departmentId;
        let userBranchId = branchId;
        let isEDPIT = false;
        
        let [userInfo] = await pool.query(
            'SELECT id, department_id, branch_id, department, role FROM users WHERE id = ?',
            [userId]
        );
        
        if (userInfo.length === 0) {
            [userInfo] = await pool.query(
                'SELECT id, department_id, branch_id, department, role FROM new_user WHERE id = ?',
                [userId]
            );
        }
        
        if (userInfo.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userInfo[0];
        userDeptId = userDeptId || user.department_id;
        userBranchId = userBranchId || user.branch_id;
        
        // Check if EDP/IT
        if (userDeptId) {
            const [deptCheck] = await pool.query(
                'SELECT id, name, branch_id FROM departments WHERE id = ?',
                [userDeptId]
            );
            if (deptCheck.length > 0) {
                const nameLower = (deptCheck[0].name || '').toLowerCase();
                isEDPIT = nameLower === 'edp/it' || nameLower === 'edp' || nameLower === 'it' ||
                          nameLower.includes('edp') || nameLower.includes('it');
            }
        }
        
        // ✅ SIMPLE QUERY - no complex JSON subquery
       let query = `
    SELECT t.*, 
           t.created_by_name,
           COALESCE(u.department, nu.department, '') as creator_department,
           cb.name as creator_branch_name,
           d.name as department_name,
           b.name as branch_name,
           b.company_name as company_name,
           COALESCE(a.fullname, na.fullname) as agent_name
    FROM tickets t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN branches b ON d.branch_id = b.id
    LEFT JOIN users a ON t.assigned_to = a.id
    LEFT JOIN new_user na ON t.assigned_to = na.id
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN new_user nu ON t.created_by = nu.id
    LEFT JOIN branches cb ON (u.branch_id = cb.id OR nu.branch_id = cb.id)
    WHERE 1=1
`;
        
        const values = [];
        
        if (isEDPIT && userDeptId && userBranchId) {
            query += ' AND t.department_id = ?';
            values.push(userDeptId);
            query += ' AND ((u.branch_id = ? OR nu.branch_id = ?) OR d.branch_id = ?)';
            values.push(userBranchId, userBranchId, userBranchId);
        } else {
            query += ' AND t.created_by = ?';
            values.push(userId);
        }
        
        query += ' ORDER BY t.created_at DESC';
        
        const [tickets] = await pool.query(query, values);
        
        console.log('📊 Found ' + tickets.length + ' tickets');
        
        // ✅ FIXED: Parse assigned_users - handle double-stringified JSON
const parsedTickets = tickets.map(ticket => {
    let assignedUsers = [];
    
    if (ticket.assigned_users) {
        try {
            let raw = ticket.assigned_users;
            
            // Handle double-stringified JSON by parsing until we get an array
            let attempts = 0;
            while (typeof raw === 'string' && attempts < 3) {
                try {
                    raw = JSON.parse(raw);
                    attempts++;
                } catch (e) {
                    break;
                }
            }
            
            if (Array.isArray(raw)) {
                assignedUsers = raw.filter(u => u !== null).map(u => {
                    if (typeof u === 'object' && u.id) {
                        return {
                            id: u.id,
                            fullname: u.fullname || ticket.agent_name || null
                        };
                    }
                    const uid = typeof u === 'object' ? u.id : u;
                    return { id: uid, fullname: ticket.agent_name || null };
                });
            }
        } catch (e) {
            assignedUsers = [];
        }
    }
    
    // Fallback to assigned_to if no assigned_users
    if (assignedUsers.length === 0 && ticket.assigned_to) {
        assignedUsers = [{
            id: ticket.assigned_to,
            fullname: ticket.agent_name || null
        }];
    }
    
    return { ...ticket, assigned_users: assignedUsers };
});
        
        res.json(parsedTickets);
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/client/tickets/:id
 * Get a single ticket for client view
 */
app.get('/api/client/tickets/:id', async (req, res) => {
    try {
        const [tickets] = await pool.query(`
            SELECT t.*, 
                   COALESCE(u.fullname, nu.fullname, 'Unknown') as creator_name,
                   COALESCE(u.department, nu.department) as creator_department,
                   d.name as department_name,
                   b.name as branch_name,
                   b.company_name as company_name,
                   COALESCE(a.fullname, na.fullname) as agent_name
            FROM tickets t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN new_user nu ON t.created_by = nu.id
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN branches b ON d.branch_id = b.id
            LEFT JOIN users a ON t.assigned_to = a.id
            LEFT JOIN new_user na ON t.assigned_to = na.id
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (tickets.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // ✅ FIXED: Parse assigned_users - handle double-stringified JSON
        let assignedUsers = [];
        if (tickets[0].assigned_users) {
            try {
                let raw = tickets[0].assigned_users;
                
                // Handle double-stringified JSON
                let attempts = 0;
                while (typeof raw === 'string' && attempts < 3) {
                    try {
                        raw = JSON.parse(raw);
                        attempts++;
                    } catch (e) {
                        break;
                    }
                }
                
                if (Array.isArray(raw)) {
                    assignedUsers = raw.filter(u => u !== null).map(u => {
                        if (typeof u === 'object' && u.id) {
                            return { id: u.id, fullname: u.fullname || null };
                        }
                        const uid = typeof u === 'object' ? u.id : u;
                        return { id: uid, fullname: null };
                    });
                }
            } catch (e) {
                assignedUsers = [];
            }
        }
        
        if (assignedUsers.length === 0 && tickets[0].assigned_to) {
            assignedUsers = [{
                id: tickets[0].assigned_to,
                fullname: tickets[0].agent_name || null
            }];
        }
        
        const ticket = {
            ...tickets[0],
            assigned_users: assignedUsers
        };
        
        res.json(ticket);
    } catch (error) {
        console.error('Error fetching client ticket:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/debug/user-info', async (req, res) => {
    try {
        // Get a sample user to verify the data structure
        const [users] = await pool.query(`
            SELECT id, fullname, department_id, department, branch_id, user_table 
            FROM users LIMIT 5
        `);
        
        const [newUsers] = await pool.query(`
            SELECT id, fullname, department_id, department, branch_id 
            FROM new_user LIMIT 5
        `);
        
        // Get departments with branch info
        const [departments] = await pool.query(`
            SELECT d.id, d.name as dept_name, d.branch_id, b.name as branch_name
            FROM departments d
            LEFT JOIN branches b ON d.branch_id = b.id
            WHERE d.name LIKE '%EDP%' OR d.name LIKE '%IT%'
        `);
        
        res.json({
            users,
            newUsers,
            edpDepartments: departments,
            message: 'Check if users have department_name or department field'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/tickets', async (req, res) => {
    try {
        const [tickets] = await pool.query(`
            SELECT t.*, 
                   t.created_by_name,
                   d.name as department_name,
                   b.name as branch_name,
                   b.company_name as company_name,
                   a.fullname as agent_name
            FROM tickets t
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN branches b ON t.branch_id = b.id
            LEFT JOIN users a ON t.assigned_to = a.id
            ORDER BY t.created_at DESC
        `);
        
        const parsedTickets = tickets.map(ticket => ({
            ...ticket,
            assigned_users: ticket.assigned_users ? 
                (typeof ticket.assigned_users === 'string' ? 
                    JSON.parse(ticket.assigned_users) : ticket.assigned_users) 
                : []
        }));
        
        res.json(parsedTickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tickets/:id', async (req, res) => {
    try {
        const [tickets] = await pool.query(`
            SELECT t.*, 
                   COALESCE(u.fullname, nu.fullname, 'Unknown') as creator_name,
                   COALESCE(u.department, nu.department) as creator_department,
                   cb.name as creator_branch_name,
                   cb.company_name as creator_company_name,
                   d.name as department_name,
                   b.name as branch_name,
                   b.company_name as company_name,
                   COALESCE(a.fullname, na.fullname) as agent_name
            FROM tickets t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN new_user nu ON t.created_by = nu.id
            LEFT JOIN branches cb ON (u.branch_id = cb.id OR nu.branch_id = cb.id)
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN branches b ON d.branch_id = b.id
            LEFT JOIN users a ON t.assigned_to = a.id
            LEFT JOIN new_user na ON t.assigned_to = na.id
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (tickets.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Parse assigned_users JSON - handle double-stringified
        let assignedUsers = [];
        if (tickets[0].assigned_users) {
            try {
                let raw = tickets[0].assigned_users;
                let attempts = 0;
                while (typeof raw === 'string' && attempts < 3) {
                    try {
                        raw = JSON.parse(raw);
                        attempts++;
                    } catch (e) {
                        break;
                    }
                }
                if (Array.isArray(raw)) {
                    assignedUsers = raw.filter(u => u !== null).map(u => {
                        if (typeof u === 'object' && u.id) {
                            return { id: u.id, fullname: u.fullname || null };
                        }
                        const uid = typeof u === 'object' ? u.id : u;
                        return { id: uid, fullname: null };
                    });
                }
            } catch (e) {
                assignedUsers = [];
            }
        }
        
        const ticket = {
            ...tickets[0],
            assigned_users: assignedUsers
        };
        
        res.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/tickets', async (req, res) => {
    try {
        console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
        
        const { title, description, priority, location, department_id, created_by, created_by_name } = req.body;
        
        console.log('📝 Creating ticket:', { title, priority, created_by, created_by_name, department_id, location });
        
        // Get the CREATOR's branch and department info
        let userBranch = null;
        let userDept = null;
        let branchId = null;
        
        if (created_by) {
            // Check users table first
            const [userInfo] = await pool.query(`
                SELECT u.department_id, u.department, u.branch_id,
                       d.name as dept_name,
                       b.name as branch_name, b.id as branch_id
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN branches b ON u.branch_id = b.id
                WHERE u.id = ?
            `, [created_by]);
            
            if (userInfo.length > 0 && userInfo[0].branch_name) {
                userBranch = userInfo[0];
                branchId = userInfo[0].branch_id;
            } else {
                // Check new_user table
                const [newUserInfo] = await pool.query(`
                    SELECT nu.department_id, nu.department, nu.branch_id,
                           d.name as dept_name,
                           b.name as branch_name, b.id as branch_id
                    FROM new_user nu
                    LEFT JOIN departments d ON nu.department_id = d.id
                    LEFT JOIN branches b ON nu.branch_id = b.id
                    WHERE nu.id = ?
                `, [created_by]);
                
                if (newUserInfo.length > 0) {
                    userBranch = newUserInfo[0];
                    branchId = newUserInfo[0].branch_id;
                }
            }
        }
        
        // If we still don't have branch_id, get it from the department
        if (!branchId && department_id) {
            const [deptInfo] = await pool.query(`
                SELECT d.branch_id FROM departments d WHERE d.id = ?
            `, [department_id]);
            if (deptInfo.length > 0) {
                branchId = deptInfo[0].branch_id;
            }
        }
        
        let branchPrefix = 'TK';  // Default
        let deptPrefix = 'GEN';   // Default
        
        if (userBranch) {
            // Branch prefix - use the abbreviation from branch name
            if (userBranch.branch_name) {
                const branchAbbr = userBranch.branch_name.split(/[\s-]+/)[0].toUpperCase();
                branchPrefix = branchAbbr || 'TK';
            }
            
            // Department prefix from user's department
            const deptName = (userBranch.dept_name || userBranch.department || '').toUpperCase();
            if (deptName.includes('EDP') || deptName.includes('IT')) {
                deptPrefix = 'EDP';
            } else if (deptName.length >= 2) {
                deptPrefix = deptName.replace(/[^A-Z]/g, '').substring(0, 3);
                if (deptPrefix.length < 2) deptPrefix = deptName.substring(0, 3);
            }
            
            console.log('👤 Creator branch:', userBranch.branch_name, '-> prefix:', branchPrefix);
            console.log('👤 Creator dept:', deptName, '-> prefix:', deptPrefix);
        } else {
            // Fallback: use the department_id (send to) info
            const [deptInfo] = await pool.query(`
                SELECT d.name as dept_name, b.name as branch_name, b.id as branch_id
                FROM departments d
                LEFT JOIN branches b ON d.branch_id = b.id
                WHERE d.id = ?
            `, [department_id || 1]);
            
            if (deptInfo.length > 0) {
                if (deptInfo[0].branch_name) {
                    branchPrefix = deptInfo[0].branch_name.split(/[\s-]+/)[0].toUpperCase();
                }
                if (!branchId && deptInfo[0].branch_id) {
                    branchId = deptInfo[0].branch_id;
                }
                const dName = (deptInfo[0].dept_name || '').toUpperCase();
                deptPrefix = dName.includes('EDP') || dName.includes('IT') ? 'EDP' : dName.replace(/[^A-Z]/g, '').substring(0, 3);
            }
        }
        
        // Generate ticket number: BRANCH-DEPT-DATE-XXX
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
        const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
        const ticket_number = `${branchPrefix}-${deptPrefix}-${dateStr}-${randomStr}`;
        
        console.log('🎫 Generated ticket number:', ticket_number);
        console.log('🏢 Branch ID:', branchId);
        
        const [result] = await pool.query(`
            INSERT INTO tickets (ticket_number, title, description, priority, location, department_id, branch_id, created_by, created_by_name, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
        `, [ticket_number, title, description, priority || 'medium', location, department_id || 1, branchId, created_by || null, created_by_name || 'Unknown']);
        
        console.log('✅ Ticket created:', { id: result.insertId, ticket_number, branch_id: branchId });
        
        const [newTicket] = await pool.query(`
            SELECT t.*, 
                   t.created_by_name,
                   d.name as department_name,
                   b.name as branch_name,
                   b.company_name as company_name,
                   a.fullname as agent_name
            FROM tickets t
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN branches b ON t.branch_id = b.id
            LEFT JOIN users a ON t.assigned_to = a.id
            WHERE t.id = ?
        `, [result.insertId]);
        
        res.status(201).json(newTicket[0]);
        
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ ADMIN TICKET UPDATE ROUTE ============
app.put('/api/tickets/:id', async (req, res) => {
    try {
        const { title, description, priority, location, department_id, branch_id, status, assigned_to, assigned_users } = req.body;
        const updates = [];
        const values = [];
        
        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
        if (location !== undefined) { updates.push('location = ?'); values.push(location); }
        if (department_id !== undefined) { 
            updates.push('department_id = ?'); 
            values.push(department_id);
            
            const [deptInfo] = await pool.query('SELECT branch_id FROM departments WHERE id = ?', [department_id]);
            if (deptInfo.length > 0) {
                updates.push('branch_id = ?');
                values.push(deptInfo[0].branch_id);
            }
        }
        if (branch_id !== undefined) { updates.push('branch_id = ?'); values.push(branch_id); }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
            if (status === 'resolved') {
                updates.push('resolved_at = NOW()');
            }
        }
        if (assigned_to !== undefined) {
            updates.push('assigned_to = ?');
            values.push(assigned_to);
        }
        if (assigned_users !== undefined) {
            updates.push('assigned_users = ?');
            values.push(JSON.stringify(assigned_users));
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }
        
        values.push(req.params.id);
        
        console.log('📝 Updating ticket:', req.params.id, updates);
        
        await pool.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, values);
        
        // ✅ FIXED: Return updated ticket with BOTH users AND new_user joins for agent_name
        const [updatedTicket] = await pool.query(`
            SELECT t.*, 
                   COALESCE(u.fullname, nu.fullname) as creator_name,
                   t.created_by_name,
                   d.name as department_name,
                   b.name as branch_name,
                   b.company_name as company_name,
                   COALESCE(a.fullname, na.fullname) as agent_name
            FROM tickets t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN new_user nu ON t.created_by = nu.id
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN branches b ON t.branch_id = b.id
            LEFT JOIN users a ON t.assigned_to = a.id
            LEFT JOIN new_user na ON t.assigned_to = na.id
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (updatedTicket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // ✅ FIXED: Parse assigned_users - handle double-stringified JSON
        let assignedUsers = [];
        if (updatedTicket[0].assigned_users) {
            try {
                let raw = updatedTicket[0].assigned_users;
                
                let attempts = 0;
                while (typeof raw === 'string' && attempts < 3) {
                    try {
                        raw = JSON.parse(raw);
                        attempts++;
                    } catch (e) {
                        break;
                    }
                }
                
                if (Array.isArray(raw)) {
                    assignedUsers = raw.filter(u => u !== null).map(u => {
                        if (typeof u === 'object' && u.id) {
                            return { id: u.id, fullname: u.fullname || null };
                        }
                        const uid = typeof u === 'object' ? u.id : u;
                        return { id: uid, fullname: null };
                    });
                }
            } catch (e) {
                assignedUsers = [];
            }
        }
        
        if (assignedUsers.length === 0 && updatedTicket[0].assigned_to) {
            assignedUsers = [{
                id: updatedTicket[0].assigned_to,
                fullname: updatedTicket[0].agent_name || null
            }];
        }
        
        const ticket = {
            ...updatedTicket[0],
            assigned_users: assignedUsers
        };
        
        res.json(ticket);
        
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ CLIENT TICKET UPDATE ROUTE ============
app.put('/api/client/tickets/:id', async (req, res) => {
    try {
        const { title, description, priority, location, department_id, status, assigned_to, assigned_users } = req.body;
        const updates = [];
        const values = [];
        
        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
        if (location !== undefined) { updates.push('location = ?'); values.push(location); }
        if (department_id !== undefined) { 
            updates.push('department_id = ?'); 
            values.push(department_id);
            const [deptInfo] = await pool.query('SELECT branch_id FROM departments WHERE id = ?', [department_id]);
            if (deptInfo.length > 0) {
                updates.push('branch_id = ?');
                values.push(deptInfo[0].branch_id);
            }
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
            if (status === 'resolved') {
                updates.push('resolved_at = NOW()');
            }
        }
        if (assigned_to !== undefined) {
            updates.push('assigned_to = ?');
            values.push(assigned_to);
        }
        // ✅ FIXED: Don't double-stringify assigned_users
        if (assigned_users !== undefined) {
            updates.push('assigned_users = ?');
            if (typeof assigned_users === 'string') {
                console.log('📝 [CLIENT] assigned_users is already a string:', assigned_users.substring(0, 200));
                values.push(assigned_users);
            } else {
                const stringified = JSON.stringify(assigned_users);
                console.log('📝 [CLIENT] assigned_users is object, stringified:', stringified.substring(0, 200));
                values.push(stringified);
            }
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }
        
        values.push(req.params.id);
        
        console.log('📝 [CLIENT] Updating ticket:', req.params.id, updates);
        
        await pool.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, values);
        
        // ✅ DEBUG: Check what was actually saved in the database
        const [checkSaved] = await pool.query('SELECT assigned_users FROM tickets WHERE id = ?', [req.params.id]);
        console.log('📝 [CLIENT] Saved assigned_users in DB:', JSON.stringify(checkSaved[0]?.assigned_users).substring(0, 300));
        
        // ✅ CLIENT-SPECIFIC: Return updated ticket with BOTH users AND new_user joins for agent_name
        const [updatedTicket] = await pool.query(`
            SELECT t.*, 
                   COALESCE(u.fullname, nu.fullname) as creator_name,
                   t.created_by_name,
                   d.name as department_name,
                   b.name as branch_name,
                   b.company_name as company_name,
                   COALESCE(a.fullname, na.fullname) as agent_name
            FROM tickets t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN new_user nu ON t.created_by = nu.id
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN branches b ON t.branch_id = b.id
            LEFT JOIN users a ON t.assigned_to = a.id
            LEFT JOIN new_user na ON t.assigned_to = na.id
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (updatedTicket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // ✅ FIXED: Parse assigned_users JSON - handle double-stringified JSON
        let assignedUsers = [];
        if (updatedTicket[0].assigned_users) {
            try {
                let raw = updatedTicket[0].assigned_users;
                console.log('📝 [CLIENT] Raw assigned_users from DB:', typeof raw, JSON.stringify(raw).substring(0, 200));
                
                // Handle double-stringified JSON by parsing until we get an array
                let attempts = 0;
                while (typeof raw === 'string' && attempts < 3) {
                    try {
                        raw = JSON.parse(raw);
                        attempts++;
                        console.log('📝 [CLIENT] Parse attempt', attempts, 'result type:', typeof raw, Array.isArray(raw) ? 'array[' + raw.length + ']' : 'not array');
                    } catch (e) {
                        console.log('📝 [CLIENT] Parse failed at attempt', attempts, e.message);
                        break;
                    }
                }
                
                if (Array.isArray(raw)) {
                    assignedUsers = raw.filter(u => u !== null).map(u => {
                        if (typeof u === 'object' && u.id) {
                            return { id: u.id, fullname: u.fullname || null };
                        }
                        const uid = typeof u === 'object' ? u.id : u;
                        return { id: uid, fullname: null };
                    });
                    console.log('📝 [CLIENT] Parsed assignedUsers:', JSON.stringify(assignedUsers));
                } else {
                    console.log('📝 [CLIENT] Final raw is not an array:', typeof raw, raw);
                }
            } catch (e) {
                console.error('Error parsing assigned_users for ticket', updatedTicket[0].id, e);
                assignedUsers = [];
            }
        }
        
        if (assignedUsers.length === 0 && updatedTicket[0].assigned_to) {
            assignedUsers = [{
                id: updatedTicket[0].assigned_to,
                fullname: updatedTicket[0].agent_name || null
            }];
        }
        
        const ticket = {
            ...updatedTicket[0],
            assigned_users: assignedUsers
        };
        
        console.log('✅ [CLIENT] Ticket updated, final assigned_users:', JSON.stringify(assignedUsers));
        res.json(ticket);
        
    } catch (error) {
        console.error('❌ [CLIENT] Error updating ticket:', error);
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/tickets/:id', async (req, res) => {
    try {
        console.log('🗑️ DELETE request for ticket ID:', req.params.id);
        
        // Check if ticket exists before deleting
        const [ticket] = await pool.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
        
        if (ticket.length === 0) {
            console.log('❌ Ticket not found:', req.params.id);
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        console.log('📋 Ticket found:', ticket[0].ticket_number);
        
        // Delete related records first (if foreign keys exist)
        await pool.query('DELETE FROM ticket_comments WHERE ticket_id = ?', [req.params.id]);
        await pool.query('DELETE FROM ticket_attachments WHERE ticket_id = ?', [req.params.id]);
        
        // Now delete the ticket
        const [result] = await pool.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
        
        console.log('✅ Delete result:', result);
        console.log('✅ Affected rows:', result.affectedRows);
        
        if (result.affectedRows === 0) {
            console.log('⚠️ No rows were deleted for ticket:', req.params.id);
            return res.status(500).json({ error: 'Failed to delete ticket - no rows affected' });
        }
        
        console.log('✅ Ticket deleted successfully:', req.params.id);
        res.json({ success: true, deletedId: req.params.id });
    } catch (error) {
        console.error('❌ Error deleting ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload file attachment
app.post('/api/tickets/:id/attachments', upload.single('file'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const [result] = await pool.query(`
            INSERT INTO ticket_attachments (ticket_id, filename, original_name, file_path, file_type, file_size, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            ticketId,
            file.filename,
            file.originalname,
            '/uploads/tickets/' + file.filename,
            file.mimetype,
            file.size,
            req.body.uploaded_by || null
        ]);
        
        res.json({
            success: true,
            id: result.insertId,
            filename: file.originalname,
            file_path: '/uploads/tickets/' + file.filename,
            file_type: file.mimetype,
            file_size: file.size
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get attachments for a ticket
app.get('/api/tickets/:id/attachments', async (req, res) => {
    try {
        const [attachments] = await pool.query(
            'SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(attachments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete attachment
app.delete('/api/tickets/attachments/:id', async (req, res) => {
    try {
        const [attachment] = await pool.query('SELECT * FROM ticket_attachments WHERE id = ?', [req.params.id]);
        
        if (attachment.length > 0) {
            // Delete file from disk
            const filePath = path.join(__dirname, attachment[0].file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        await pool.query('DELETE FROM ticket_attachments WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ COMMENT ROUTES ============
app.post('/api/tickets/:id/comments', async (req, res) => {
    try {
        const { comment, user_id, is_internal, user_table } = req.body;
        
        await pool.query(`
            INSERT INTO ticket_comments (ticket_id, user_id, user_table, comment, is_internal)
            VALUES (?, ?, ?, ?, ?)
        `, [req.params.id, user_id || null, user_table || 'users', comment, is_internal || 0]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tickets/:id/comments', async (req, res) => {
    try {
        const [comments] = await pool.query(`
            SELECT c.*, 
                   CASE 
                       WHEN c.user_table = 'new_user' THEN nu.fullname
                       ELSE u.fullname
                   END as author_name,
                   CASE 
                       WHEN c.user_table = 'new_user' THEN nu.avatar_color
                       ELSE u.avatar_color
                   END as avatar_color,
                   CASE 
                       WHEN c.user_table = 'new_user' THEN nu.photo_url
                       ELSE u.photo_url
                   END as photo_url
            FROM ticket_comments c
            LEFT JOIN users u ON c.user_id = u.id AND c.user_table = 'users'
            LEFT JOIN new_user nu ON c.user_id = nu.id AND c.user_table = 'new_user'
            WHERE c.ticket_id = ?
            ORDER BY c.created_at ASC
        `, [req.params.id]);
        
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/tickets/comments/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM ticket_comments WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ CLIENT-SIDE COMMENT ROUTES ============

app.post('/api/client/tickets/:id/comments', async (req, res) => {
    try {
        const { comment, user_id, is_internal, user_table } = req.body;
        
        await pool.query(`
            INSERT INTO ticket_comments (ticket_id, user_id, user_table, comment, is_internal, source)
            VALUES (?, ?, ?, ?, ?, 'client')
        `, [req.params.id, user_id || null, user_table || 'new_user', comment, is_internal || 0]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding client comment:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/client/tickets/:id/comments', async (req, res) => {
    try {
        const [comments] = await pool.query(`
            SELECT c.*, 
                   CASE 
                       WHEN c.user_table = 'new_user' THEN nu.fullname
                       WHEN c.user_table = 'users' THEN u.fullname
                       ELSE 'Unknown'
                   END as author_name,
                   CASE 
                       WHEN c.user_table = 'new_user' THEN nu.avatar_color
                       WHEN c.user_table = 'users' THEN u.avatar_color
                       ELSE '#3b82f6'
                   END as avatar_color,
                   CASE 
                       WHEN c.user_table = 'new_user' THEN nu.photo_url
                       WHEN c.user_table = 'users' THEN u.photo_url
                       ELSE NULL
                   END as photo_url
            FROM ticket_comments c
            LEFT JOIN users u ON c.user_id = u.id AND c.user_table = 'users'
            LEFT JOIN new_user nu ON c.user_id = nu.id AND c.user_table = 'new_user'
            WHERE c.ticket_id = ?
            ORDER BY c.created_at ASC
        `, [req.params.id]);
        
        res.json(comments);
    } catch (error) {
        console.error('Error fetching client comments:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/client/tickets/comments/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM ticket_comments WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting client comment:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ STATS ROUTES ============
app.get('/api/stats', async (req, res) => {
    try {
        const [total] = await pool.query('SELECT COUNT(*) as count FROM tickets');
        const [open] = await pool.query("SELECT COUNT(*) as count FROM tickets WHERE status NOT IN ('resolved', 'closed')");
        const [critical] = await pool.query("SELECT COUNT(*) as count FROM tickets WHERE priority = 'critical' AND status NOT IN ('resolved', 'closed')");
        const [resolvedToday] = await pool.query("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved' AND DATE(resolved_at) = CURDATE()");
        
        res.json({
            total: total[0].count,
            open: open[0].count,
            critical: critical[0].count,
            resolvedToday: resolvedToday[0].count,
            slaCompliance: 98
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ASSET ROUTES ============
app.get('/api/assets', async (req, res) => {
    try {
        const [assets] = await pool.query(`
            SELECT a.*, u.fullname as assigned_to_name, d.name as department_name
            FROM assets a
            LEFT JOIN users u ON a.assigned_to = u.id
            LEFT JOIN departments d ON a.department_id = d.id
            ORDER BY a.created_at DESC
        `);
        res.json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/assets', async (req, res) => {
    try {
        const { asset_tag, name, type, model, serial_number, status, assigned_to, department_id, location } = req.body;
        
        const [result] = await pool.query(`
            INSERT INTO assets (asset_tag, name, type, model, serial_number, status, assigned_to, department_id, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [asset_tag, name, type, model, serial_number, status || 'active', assigned_to || null, department_id || null, location]);
        
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ USER ROUTES ============
// GET - Get all users for client contact
app.get('/api/users', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');

        console.log('🔍 Decoded user ID:', decoded.id);

        // ✅ Get current user from new_user table (client users)
        let currentUser = null;
        let userBranchId = null;
        let userDepartmentId = null;

        try {
            const [currentUserRows] = await pool.query(
                'SELECT id, branch_id, department_id, username, fullname, role FROM new_user WHERE id = ?',
                [decoded.id]
            );
            
            if (currentUserRows.length > 0) {
                currentUser = currentUserRows[0];
                userBranchId = currentUser.branch_id;
                userDepartmentId = currentUser.department_id;
                console.log('🔍 Current User from new_user:', {
                    id: currentUser.id,
                    username: currentUser.username,
                    branch_id: userBranchId,
                    department_id: userDepartmentId,
                    role: currentUser.role
                });
            }
        } catch (err) {
            console.log('⚠️ Error querying new_user:', err.message);
        }

        // If not in new_user, try users table (admin users)
        if (!currentUser) {
            const [adminUserRows] = await pool.query(
                'SELECT id, branch_id, department_id, username, fullname, role FROM users WHERE id = ?',
                [decoded.id]
            );
            
            if (adminUserRows.length > 0) {
                currentUser = adminUserRows[0];
                userBranchId = currentUser.branch_id;
                userDepartmentId = currentUser.department_id;
                console.log('🔍 Current User from users (admin):', {
                    id: currentUser.id,
                    username: currentUser.username,
                    branch_id: userBranchId,
                    department_id: userDepartmentId,
                    role: currentUser.role
                });
            }
        }

        if (!currentUser) {
            console.log('❌ User not found in any table');
            return res.status(404).json({ error: 'User not found' });
        }

        if (!userBranchId) {
            console.log('⚠️ User has no branch_id set');
            return res.json([]);
        }

        // Main branch IDs
        const mainBranchIds = [1, 5];
        const isMainBranch = mainBranchIds.includes(userBranchId);

        console.log(`📍 Branch: ${userBranchId}, Main: ${isMainBranch}`);

        // ✅ 1. Get IT staff from users table (admin/IT staff)
        const [adminUsers] = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.fullname,
                u.email,
                u.role,
                u.department,
                u.department_id,
                u.branch_id,
                u.avatar_color,
                u.photo_url,
                u.workDays,
                u.dayOff,
                u.workStart,
                u.workEnd,
                u.lunchStart,
                u.lunchEnd,
                u.leaveEntries,
                u.created_at,
                u.last_activity,
                'users' as user_table,
                b.name as branch_name,
                b.company_name,
                d.name as department_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role IN ('Technician', 'Head/Manager', 'Supervisor')
            ORDER BY u.fullname ASC
        `);

        console.log(`📋 Found ${adminUsers.length} admin IT staff`);

        // ✅ 2. Get client users from new_user table who are in EDP/IT department
        const [clientEDPUsers] = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.fullname,
                u.email,
                u.role,
                u.department,
                u.department_id,
                u.branch_id,
                u.avatar_color,
                u.photo_url,
                u.workDays,
                u.dayOff,
                u.workStart,
                u.workEnd,
                u.lunchStart,
                u.lunchEnd,
                u.leaveEntries,
                u.created_at,
                u.last_activity,
                'new_user' as user_table,
                b.name as branch_name,
                b.company_name,
                d.name as department_name
            FROM new_user u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE d.name = 'EDP/IT'
            ORDER BY u.fullname ASC
        `);

        console.log(`📋 Found ${clientEDPUsers.length} client EDP/IT users`);

        // ✅ 3. Also get client users with IT-related roles
        const [clientITRoleUsers] = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.fullname,
                u.email,
                u.role,
                u.department,
                u.department_id,
                u.branch_id,
                u.avatar_color,
                u.photo_url,
                u.workDays,
                u.dayOff,
                u.workStart,
                u.workEnd,
                u.lunchStart,
                u.lunchEnd,
                u.leaveEntries,
                u.created_at,
                u.last_activity,
                'new_user' as user_table,
                b.name as branch_name,
                b.company_name,
                d.name as department_name
            FROM new_user u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE LOWER(u.role) IN ('it technician', 'technician', 'support', 'it support')
            ORDER BY u.fullname ASC
        `);

        console.log(`📋 Found ${clientITRoleUsers.length} client IT role users`);

        let filteredUsers = [];

        if (isMainBranch) {
            // ✅ MAIN BRANCH: ONLY show admin IT staff from users table
            filteredUsers = adminUsers.filter(u => 
                u.role === 'Technician' || 
                u.role === 'Head/Manager' || 
                u.role === 'Supervisor'
            );
            console.log(`✅ Main branch: Showing ${filteredUsers.length} admin IT staff only (excluding client users)`);
        } else {
            // ✅ OTHER BRANCH: Show branch EDP/IT users + Main branch Head/Manager & Supervisor
            
            // Combine all client IT users
            const allClientITUsers = [...clientEDPUsers, ...clientITRoleUsers];
            
            // Remove duplicates from client users
            const uniqueClientMap = new Map();
            allClientITUsers.forEach(user => {
                if (!uniqueClientMap.has(user.id)) {
                    uniqueClientMap.set(user.id, user);
                }
            });
            const uniqueClientUsers = Array.from(uniqueClientMap.values());

            // 1. Get client IT users from this branch
            const branchClientITUsers = uniqueClientUsers.filter(u => 
                u.branch_id === userBranchId
            );
            console.log(`📍 Client IT users in branch ${userBranchId}: ${branchClientITUsers.length}`);

            // 2. Get admin IT staff from this branch (if any)
            const branchAdminUsers = adminUsers.filter(u => 
                u.branch_id === userBranchId
            );
            console.log(`📍 Admin IT staff in branch ${userBranchId}: ${branchAdminUsers.length}`);

            // 3. Combine branch users (admin + client)
            const branchAllUsers = [...branchAdminUsers, ...branchClientITUsers];

            // 4. Get Head/Manager and Supervisor from Main Branch (admin only)
            const mainBranchStaff = adminUsers.filter(u => 
                mainBranchIds.includes(u.branch_id) && 
                (u.role === 'Head/Manager' || u.role === 'Supervisor')
            );
            console.log(`🏢 Main branch staff (Head/Manager & Supervisor): ${mainBranchStaff.length}`);

            // 5. Combine all and remove duplicates
            const combined = [...branchAllUsers, ...mainBranchStaff];
            const uniqueIds = new Set();
            filteredUsers = combined.filter(u => {
                if (uniqueIds.has(u.id)) return false;
                uniqueIds.add(u.id);
                return true;
            });
            
            console.log(`✅ Other branch: ${branchAllUsers.length} branch users + ${mainBranchStaff.length} main staff = ${filteredUsers.length} users total`);
        }

        // Format response
        // Format response - DO NOT set default values, keep them as null
const formattedUsers = filteredUsers.map(user => ({
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    email: user.email || '',
    role: user.role,
    department: user.department_name || user.department || '',
    department_id: user.department_id,
    branch_id: user.branch_id,
    branch_name: user.branch_name || '',
    company_name: user.company_name || '',
    avatar_color: user.avatar_color || '#0a3a8c',
    photo_url: user.photo_url,
    // ✅ Keep original values, don't set defaults
    workDays: user.workDays,      // Keep as null if null
    dayOff: user.dayOff,          // Keep as null if null
    workStart: user.workStart,    // Keep as null if null
    workEnd: user.workEnd,        // Keep as null if null
    lunchStart: user.lunchStart,  // Keep as null if null
    lunchEnd: user.lunchEnd,      // Keep as null if null
    leaveEntries: user.leaveEntries, // Keep as null if null
    last_activity: user.last_activity,
    user_table: user.user_table || 'users',
    created_at: user.created_at
}));

        console.log(`📤 Returning ${formattedUsers.length} users for contact list`);
        res.json(formattedUsers);

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
});
// Debug route - check all users and departments
app.get('/api/debug/all', async (req, res) => {
    try {
        // Get all users with roles
        const [allUsers] = await pool.query(`
            SELECT id, username, fullname, role, branch_id, department_id 
            FROM users 
            WHERE role IN ('Technician', 'Head/Manager', 'Supervisor')
        `);
        
        // Get all departments
        const [allDepts] = await pool.query(`
            SELECT id, branch_id, name FROM departments
        `);
        
        // Get all branches
        const [allBranches] = await pool.query(`
            SELECT id, name, company_name FROM branches
        `);
        
        res.json({
            users: allUsers,
            departments: allDepts,
            branches: allBranches
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Debug route - check departments for a branch
app.get('/api/debug/branch-departments/:branchId', async (req, res) => {
    try {
        const { branchId } = req.params;
        const [depts] = await pool.query(
            'SELECT id, name FROM departments WHERE branch_id = ?',
            [branchId]
        );
        const [users] = await pool.query(
            'SELECT id, fullname, role, department_id FROM users WHERE branch_id = ? AND role = "Technician"',
            [branchId]
        );
        res.json({
            branch_id: branchId,
            departments: depts,
            technicians: users
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// =============================================
// AUTHENTICATION MIDDLEWARE
// =============================================
app.use(async (req, res, next) => {
    // Skip public routes
    if (req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/public')) {
        return next();
    }
    
    // Skip OPTIONS requests
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    // Skip static files
    if (req.path.includes('.css') || req.path.includes('.js') || req.path.includes('.png') || req.path.includes('.ico')) {
        return next();
    }
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return next();
    }
    
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return next();
    }
    
    const token = tokenParts[1];
    if (!token || token === 'null' || token === 'undefined' || token === '' || token.length < 10) {
        return next();
    }
    
    try {
        const decoded = jwt.verify(token, 'secret_key');
        req.user = decoded;
        req.userId = decoded.id;
        console.log('✅ Auth success for:', req.path, 'User:', decoded.id);
    } catch (error) {
        // Silent fail - don't block the request
        if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
            console.log('⚠️ Auth middleware error:', error.message);
        }
    }
    next();
});
// GET - Get users by branch (for contact/chat)
app.get('/api/users/branch/:branchId', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');

        const { branchId } = req.params;
        const mainBranchIds = [1, 5];
        const isMainBranch = mainBranchIds.includes(parseInt(branchId));

        // Get users from specific branch
        const [users] = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.fullname,
                u.email,
                u.role,
                u.department,
                u.department_id,
                u.branch_id,
                u.avatar_color,
                u.photo_url,
                u.workDays,
                u.dayOff,
                u.workStart,
                u.workEnd,
                u.lunchStart,
                u.lunchEnd,
                u.leaveEntries,
                u.created_at,
                u.last_activity,
                'users' as user_table,
                b.name as branch_name,
                b.company_name,
                d.name as department_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role IN ('Technician', 'Head/Manager', 'Supervisor')
            AND u.user_table = 'users'
            ORDER BY u.fullname ASC
        `);

        let filteredUsers = [];

        if (isMainBranch) {
            // Main branch: Show all IT staff
            filteredUsers = users.filter(u => 
                u.branch_id === parseInt(branchId) && 
                (u.role === 'Technician' || u.role === 'Head/Manager' || u.role === 'Supervisor')
            );
        } else {
            // Other branch: Show EDP/IT users from this branch + Main branch Head/Manager & Supervisor
            
            // 1. Get EDP/IT department ID for this branch
            const [deptRows] = await pool.query(
                'SELECT id FROM departments WHERE branch_id = ? AND name = ?',
                [branchId, 'EDP/IT']
            );
            const edpDeptId = deptRows.length > 0 ? deptRows[0].id : null;

            // 2. Get users from this branch's EDP/IT department (Technician only)
            const branchEdpUsers = users.filter(u => 
                u.branch_id === parseInt(branchId) && 
                u.department_id === edpDeptId &&
                u.role === 'Technician'
            );

            // 3. Get Head/Manager and Supervisor from Main Branch
            const mainBranchStaff = users.filter(u => 
                mainBranchIds.includes(u.branch_id) && 
                (u.role === 'Head/Manager' || u.role === 'Supervisor')
            );

            filteredUsers = [...branchEdpUsers, ...mainBranchStaff];
        }

        // ✅ Format response - KEEP ORIGINAL VALUES, DO NOT SET DEFAULTS
        const formattedUsers = filteredUsers.map(user => ({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            email: user.email || '',
            role: user.role,
            department: user.department_name || user.department || '',
            department_id: user.department_id,
            branch_id: user.branch_id,
            branch_name: user.branch_name || '',
            company_name: user.company_name || '',
            avatar_color: user.avatar_color || '#0a3a8c',
            photo_url: user.photo_url,
            // ✅ Keep original values - no defaults!
            workDays: user.workDays,
            dayOff: user.dayOff,
            workStart: user.workStart,
            workEnd: user.workEnd,
            lunchStart: user.lunchStart,
            lunchEnd: user.lunchEnd,
            leaveEntries: user.leaveEntries,
            last_activity: user.last_activity,
            user_table: user.user_table || 'users',
            created_at: user.created_at
        }));

        res.json(formattedUsers);

    } catch (error) {
        console.error('❌ Error fetching users by branch:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - Get main branch users only
app.get('/api/users/main-branch', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');

        const mainBranchIds = [1, 5];

        const [users] = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.fullname,
                u.email,
                u.role,
                u.department,
                u.department_id,
                u.branch_id,
                u.avatar_color,
                u.photo_url,
                u.workDays,
                u.dayOff,
                u.workStart,
                u.workEnd,
                u.lunchStart,
                u.lunchEnd,
                u.leaveEntries,
                u.created_at,
                u.last_activity,
                'users' as user_table,
                b.name as branch_name,
                b.company_name,
                d.name as department_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.branch_id IN (?) 
            AND u.role IN ('Technician', 'Head/Manager', 'Supervisor')
            AND u.user_table = 'users'
            ORDER BY u.fullname ASC
        `, [mainBranchIds]);

        const formattedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            email: user.email || '',
            role: user.role,
            department: user.department_name || user.department || '',
            department_id: user.department_id,
            branch_id: user.branch_id,
            branch_name: user.branch_name || '',
            company_name: user.company_name || '',
            avatar_color: user.avatar_color || '#0a3a8c',
            photo_url: user.photo_url,
            // ✅ Keep original values - no defaults!
            workDays: user.workDays,
            dayOff: user.dayOff,
            workStart: user.workStart,
            workEnd: user.workEnd,
            lunchStart: user.lunchStart,
            lunchEnd: user.lunchEnd,
            leaveEntries: user.leaveEntries,
            last_activity: user.last_activity,
            user_table: user.user_table || 'users',
            created_at: user.created_at
        }));

        res.json(formattedUsers);

    } catch (error) {
        console.error('❌ Error fetching main branch users:', error);
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, fullname, role, department, email } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const avatar_color = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)];
        
        const [result] = await pool.query(`
            INSERT INTO users (username, password, fullname, role, department, email, avatar_color, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [username, hashedPassword, fullname, role || 'user', department, email, avatar_color]);
        
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get roles by department
app.get('/api/department-roles/:department', async (req, res) => {
    try {
        const department = req.params.department;
        console.log('📋 Fetching roles for department:', department);
        
        const [roles] = await pool.query(
            'SELECT * FROM department_roles WHERE department_name = ?',
            [department]
        );
        
        // If no roles found for this department, return default roles
        if (roles.length === 0) {
            return res.json([
                { id: 1, name: 'Staff', role_value: 'staff', role_description: 'Department Staff' },
                { id: 2, name: 'User', role_value: 'user', role_description: 'User Support' }
            ]);
        }
        
        res.json(roles);
    } catch (error) {
        console.error('Error fetching department roles:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all departments with their roles
app.get('/api/departments-with-roles', async (req, res) => {
    try {
        const [departments] = await pool.query(
            'SELECT DISTINCT department_name FROM department_roles ORDER BY department_name'
        );
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all new_user users
app.get('/api/new-users', async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, username, fullname, role, department, email, 
                    avatar_color, photo_url, branch_id, department_id,
                    registration_key, created_at,
                    locked_until, failed_attempts, is_verified
             FROM new_user 
             ORDER BY created_at DESC`
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Admin unlock user
app.post('/api/users/:table/:id/unlock', async (req, res) => {
    try {
        const { table, id } = req.params;
        if (table !== 'users' && table !== 'new_user') {
            return res.status(400).json({ message: 'Invalid table' });
        }
        await pool.query(`UPDATE ${table} SET locked_until = NULL WHERE id = ?`, [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Reset Password (for admins resetting other users' passwords)
app.post('/api/admin/reset-password/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const { newPassword } = req.body;
        
        console.log('🔑 Admin password reset for:', table, 'user ID:', id);
        
        if (table !== 'users' && table !== 'new_user') {
            return res.status(400).json({ message: 'Invalid table' });
        }
        
        const userId = parseInt(id);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        if (!newPassword || newPassword.trim() === '') {
            return res.status(400).json({ message: 'New password is required' });
        }
        
        if (newPassword.trim().length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        // Hash the new password (no current password check for admin)
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
        const [result] = await pool.query(
            `UPDATE ${table} SET password = ? WHERE id = ?`, 
            [hashedPassword, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('✅ Admin password reset successful for user ID:', userId);
        res.json({ success: true, message: 'Password reset by admin' });
        
    } catch (error) {
        console.error('Admin password reset error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Admin reset password (without current password)
app.post('/api/profile/:table/:id/change-password', async (req, res) => {
    try {
        const { table, id } = req.params;
        const { newPassword, adminReset } = req.body;
        
        console.log(`🔒 Password change request for: ${table} user ID: ${id}`);
        console.log('Request body:', req.body);
        
        // Validate table
        if (table !== 'users' && table !== 'new_user') {
            console.log('❌ Invalid table:', table);
            return res.status(400).json({ message: 'Invalid table' });
        }
        
        // Validate ID
        const userId = parseInt(id);
        if (isNaN(userId)) {
            console.log('❌ Invalid user ID:', id);
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        // Validate password
        if (!newPassword || newPassword.trim() === '') {
            console.log('❌ No password provided');
            return res.status(400).json({ message: 'New password is required' });
        }
        
        // Check if this is an admin reset
        const isAdminReset = adminReset === true || adminReset === 'true';
        
        if (isAdminReset) {
            // ADMIN RESET - No password comparison needed
            console.log('✅ Admin reset - hashing new password...');
            
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
            console.log('✅ Password hashed successfully');
            
            // Update the password directly
            const query = `UPDATE ${table} SET password = ? WHERE id = ?`;
            const [result] = await pool.query(query, [hashedPassword, userId]);
            
            if (result.affectedRows === 0) {
                console.log('❌ User not found');
                return res.status(404).json({ message: 'User not found' });
            }
            
            console.log('✅ Password reset successful for user ID:', userId);
            return res.json({ success: true, message: 'Password reset by admin' });
            
        } else {
            // USER CHANGE PASSWORD - Need current password verification
            const { currentPassword } = req.body;
            
            if (!currentPassword) {
                console.log('❌ Current password required for password change');
                return res.status(400).json({ message: 'Current password is required' });
            }
            
            // Get user's current password from database
            const [users] = await pool.query(`SELECT password FROM ${table} WHERE id = ?`, [userId]);
            
            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Verify current password
            const validPassword = await bcrypt.compare(currentPassword, users[0].password);
            
            if (!validPassword) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            
            // Hash and update new password
            const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
            await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedPassword, userId]);
            
            console.log('✅ Password changed successfully for user ID:', userId);
            return res.json({ success: true, message: 'Password changed successfully' });
        }
        
    } catch (error) {
        console.error('Password change error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ message: error.message });
    }
});
// Lock user
app.post('/api/users/:table/:id/lock', async (req, res) => {
    try {
        const { table, id } = req.params;
        if (table !== 'users' && table !== 'new_user') {
            return res.status(400).json({ message: 'Invalid table' });
        }
        // Lock for 24 hours
        const lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(`UPDATE ${table} SET locked_until = ? WHERE id = ?`, [lockUntil, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
app.delete('/api/users/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        if (table !== 'users' && table !== 'new_user') {
            return res.status(400).json({ message: 'Invalid table' });
        }
        await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DEPARTMENTS API ENDPOINTS
// ============================================
// GET - Fetch all departments
app.get('/api/departments', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const userId = decoded.id;
        
        const { branch_id } = req.query;
        let query = 'SELECT * FROM departments';
        const params = [];
        const conditions = [];
        
        if (branch_id) {
            conditions.push('branch_id = ?');
            params.push(branch_id);
        }
        
        // Get user's role and branch for filtering
        const [users] = await pool.query('SELECT role, branch_id FROM new_user WHERE id = ?', [userId]);
        if (users.length > 0) {
            const userRole = (users[0].role || '').toLowerCase();
            // Non-admin users only see their branch
            if (userRole !== 'admin') {
                conditions.push('branch_id = ?');
                params.push(users[0].branch_id);
            }
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY name ASC';
        
        const [departments] = await pool.query(query, params);
        res.json(departments);
    } catch (error) {
        console.error('❌ Error fetching departments:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Create department
app.post('/api/departments', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const { name, location, branch_id } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }
        if (!branch_id) {
            return res.status(400).json({ error: 'Branch ID is required' });
        }
        
        // Check if branch exists
        const [branchCheck] = await pool.query(
            'SELECT id FROM branches WHERE id = ?',
            [branch_id]
        );
        if (branchCheck.length === 0) {
            return res.status(400).json({ error: 'Invalid branch selected' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO departments (name, location, branch_id) VALUES (?, ?, ?)',
            [name, location || null, branch_id]
        );
        
        res.json({ success: true, id: result.insertId, message: 'Department created' });
    } catch (error) {
        console.error('❌ Error creating department:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update department
app.put('/api/departments/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const { name, location, branch_id } = req.body;
        const deptId = req.params.id;
        
        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }
        if (!branch_id) {
            return res.status(400).json({ error: 'Branch ID is required' });
        }
        
        // Check if branch exists
        const [branchCheck] = await pool.query(
            'SELECT id FROM branches WHERE id = ?',
            [branch_id]
        );
        if (branchCheck.length === 0) {
            return res.status(400).json({ error: 'Invalid branch selected' });
        }
        
        const [result] = await pool.query(
            'UPDATE departments SET name = ?, location = ?, branch_id = ? WHERE id = ?',
            [name, location || null, branch_id, deptId]
        );
        
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Department updated' });
        } else {
            res.status(404).json({ error: 'Department not found' });
        }
    } catch (error) {
        console.error('❌ Error updating department:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete department
app.delete('/api/departments/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const deptId = req.params.id;
        
        // Check if department has any roles
        const [rolesCheck] = await pool.query(
            'SELECT COUNT(*) as count FROM department_roles WHERE department_id = ?',
            [deptId]
        );
        
        if (rolesCheck[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete department with existing positions. Delete positions first.' 
            });
        }
        
        const [result] = await pool.query(
            'DELETE FROM departments WHERE id = ?',
            [deptId]
        );
        
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Department deleted' });
        } else {
            res.status(404).json({ error: 'Department not found' });
        }
    } catch (error) {
        console.error('❌ Error deleting department:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// DEPARTMENT ROLES API ENDPOINTS
// ============================================

// GET - Fetch department roles (Admin: all, Client: by department_id)
app.get('/api/department-roles', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, 'secret_key');
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        const departmentId = req.query.department_id;
        
        let query;
        let params = [];
        
        if (departmentId) {
            // Client-side: get roles for specific department
            query = 'SELECT * FROM department_roles WHERE department_id = ? ORDER BY role_name';
            params = [departmentId];
        } else {
            // Admin-side: get all roles
            query = 'SELECT * FROM department_roles ORDER BY department_name, role_name';
        }
        
        const [roles] = await pool.query(query, params);
        res.json(roles);
        
    } catch (error) {
        console.error('❌ Error fetching department roles:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Create department role
app.post('/api/department-roles', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
       const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) return res.status(403).json({ error: 'Access denied.' });
        
        const { department_id, department_name, role_name } = req.body;
        
        console.log('📝 Creating role:', { department_id, department_name, role_name });
        
        const [result] = await pool.query(
            'INSERT INTO department_roles (department_id, department_name, role_name) VALUES (?, ?, ?)',
            [department_id, department_name, role_name]
        );
        
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('❌ Error creating role:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update department role
app.put('/api/department-roles/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
       const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) return res.status(403).json({ error: 'Access denied.' });
        
        const { department_id, department_name, role_name } = req.body;
        
        console.log('📝 Updating role:', { id: req.params.id, department_id, department_name, role_name });
        
        await pool.query(
            'UPDATE department_roles SET department_id=?, department_name=?, role_name=? WHERE id=?',
            [department_id, department_name, role_name, req.params.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating role:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete department role
app.delete('/api/department-roles/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) return res.status(403).json({ error: 'Access denied.' });
        
        console.log('🗑️ Deleting role ID:', req.params.id);
        
        await pool.query('DELETE FROM department_roles WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting role:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PUBLIC API - Get roles by department (for signup)
// ============================================
app.get('/api/public/departments/:departmentId/roles', async (req, res) => {
    try {
        const departmentId = req.params.departmentId;
        console.log('📋 Fetching roles for department ID:', departmentId);
        
        const [rows] = await pool.query(
            `SELECT id, role_name 
             FROM department_roles 
             WHERE department_id = ? 
             ORDER BY role_name`,
            [departmentId]
        );
        
        // If no roles found, return default roles
        if (rows.length === 0) {
            console.log('⚠️ No roles found, returning defaults');
            return res.json([
                { id: 0, role_name: 'Staff' },
                { id: 0, role_name: 'User' }
            ]);
        }
        
        console.log(`✅ Roles loaded: ${rows.length}`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching public department roles:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Public departments (no auth required - for signup page)
app.get('/api/public/departments', async (req, res) => {
    try {
        const { branch_id } = req.query;
        
        let query = `SELECT d.id, d.name, d.branch_id, b.name as branch_name, b.company_name 
                     FROM departments d
                     LEFT JOIN branches b ON d.branch_id = b.id`;
        const params = [];
        
        if (branch_id) {
            query += ' WHERE d.branch_id = ?';
            params.push(branch_id);
        }
        
        query += ' ORDER BY d.name ASC';
        
        const [departments] = await pool.query(query, params);
        console.log('📋 Public departments:', departments.length, branch_id ? `(branch ${branch_id})` : '(all)');
        res.json(departments);
    } catch (error) {
        console.error('❌ Error fetching public departments:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - Public all department roles (no auth required - for signup page)
app.get('/api/public/department-roles', async (req, res) => {
    try {
        const [roles] = await pool.query(
            'SELECT id, department_id, department_name, role_name FROM department_roles ORDER BY department_name, role_name'
        );
        res.json(roles);
    } catch (error) {
        console.error('❌ Error fetching public department roles:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - Reports & Analytics
app.get('/api/reports', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const period = req.query.period || 'last7days';
        
        // Build date filter
        let dateFilter = '';
        if (period === 'today') dateFilter = 'DATE(t.created_at) = CURDATE()';
        else if (period === 'yesterday') dateFilter = 'DATE(t.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
        else if (period === 'last7days') dateFilter = 't.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        else if (period === 'last30days') dateFilter = 't.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        else if (period === 'thisMonth') dateFilter = 'MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE())';
        else if (period === 'lastMonth') dateFilter = 'MONTH(t.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
        else dateFilter = '1=1'; // all time
        
        const whereClause = dateFilter !== '1=1' ? 'WHERE ' + dateFilter : '';
        
        // Summary stats
        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN t.status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as open_count,
                SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN t.priority = 'critical' AND t.status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as critical_count,
                ROUND(AVG(CASE WHEN t.status = 'resolved' THEN TIMESTAMPDIFF(HOUR, t.created_at, t.resolved_at) ELSE NULL END), 1) as avg_resolution_hours
            FROM tickets t
            ${whereClause}
        `);

        // Priority distribution
        const [priorityData] = await pool.query(`
            SELECT 
                t.priority,
                COUNT(*) as count
            FROM tickets t
            ${whereClause}
            GROUP BY t.priority
        `);

        const total = summary[0].total || 1;
        const priorityColors = {
            critical: '#cc0000',
            high: '#ff6600',
            medium: '#ffaa00',
            low: '#008800'
        };

        const formattedPriority = priorityData.map(p => ({
            label: p.priority,
            count: p.count,
            percentage: Math.round((p.count / total) * 100),
            color: priorityColors[p.priority] || '#888'
        }));

        // Status breakdown
        const [statusData] = await pool.query(`
            SELECT 
                t.status,
                COUNT(*) as count
            FROM tickets t
            ${whereClause}
            GROUP BY t.status
        `);

        const statusIcons = {
            new: '🆕', assigned: '📌', in_progress: '⚙️',
            pending: '⏳', resolved: '✅', closed: '🔒'
        };
        const statusLabels = {
            new: 'New', assigned: 'Assigned', in_progress: 'In Progress',
            pending: 'Pending', resolved: 'Resolved', closed: 'Closed'
        };

        const formattedStatus = statusData.map(s => ({
            label: statusLabels[s.status] || s.status,
            icon: statusIcons[s.status] || '📋',
            count: s.count
        }));

        // Department performance
        const [deptData] = await pool.query(`
            SELECT 
                d.name,
                COUNT(t.id) as total,
                SUM(CASE WHEN t.status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as open_count,
                SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
                ROUND(AVG(CASE WHEN t.status = 'resolved' THEN TIMESTAMPDIFF(HOUR, t.created_at, t.resolved_at) ELSE NULL END), 1) as avg_resolution
            FROM departments d
            LEFT JOIN tickets t ON d.id = t.department_id ${whereClause ? 'AND ' + dateFilter : ''}
            GROUP BY d.id, d.name
            HAVING total > 0
            ORDER BY total DESC
        `);

        const formattedDept = deptData.map(d => ({
            name: d.name,
            total: d.total,
            open: d.open_count,
            resolved: d.resolved_count,
            avgResolution: d.avg_resolution ? d.avg_resolution + ' hrs' : 'N/A',
            sla: d.total > 0 ? Math.round((d.resolved_count / d.total) * 100) : 0
        }));

        // Recent tickets
        const [recentTickets] = await pool.query(`
            SELECT t.*, d.name as department_name
            FROM tickets t
            LEFT JOIN departments d ON t.department_id = d.id
            ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT 20
        `);

        res.json({
            totalTickets: summary[0].total,
            openTickets: summary[0].open_count,
            resolvedTickets: summary[0].resolved_count,
            criticalTickets: summary[0].critical_count,
            avgResolutionTime: summary[0].avg_resolution_hours ? summary[0].avg_resolution_hours + ' hrs' : 'N/A',
            slaCompliance: 95, // Calculate based on your SLA rules
            priorityData: formattedPriority,
            statusData: formattedStatus,
            departmentData: formattedDept,
            recentTickets
        });

    } catch (error) {
        console.error('❌ Error generating reports:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// JOB ORDER API ENDPOINTS
// ============================================
// ============================================
// SECTION 1: CLIENT JOB ORDER ENDPOINTS
// ============================================
// GET - My Job Orders (Client)
app.get('/api/job-orders/my', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        let userBranchId = null;
        let userDeptId = null;
        let userFullname = null;
        let userDeptName = null;
        
        // Get current user info
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id, fullname FROM users WHERE id = ?', [decoded.id]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
            userFullname = userInfo[0].fullname;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id, fullname FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
                userFullname = newUserInfo[0].fullname;
            }
        }
        
        // ✅ Get department name for the current user
        if (userDeptId) {
            const [deptInfo] = await pool.query(
                'SELECT name FROM departments WHERE id = ?', [userDeptId]
            );
            if (deptInfo.length > 0) {
                userDeptName = deptInfo[0].name;
            }
        }
        
        console.log('👤 User:', { 
            id: decoded.id, 
            branchId: userBranchId, 
            deptId: userDeptId, 
            deptName: userDeptName, 
            fullname: userFullname 
        });
        
        // ✅ Get ALL orders with forwarded-to info (no forwarded_by JOIN)
        const [allOrders] = await pool.query(
            `SELECT 
                jo.*,
                -- Forwarded To info (for "Our Job Orders" view)
                fb.name as forwarded_to_branch_name,
                fb.company_name as forwarded_to_company_name,
                fd.name as forwarded_to_department_name,
                -- Original branch info
                b.name as branch_name,
                b.company_name,
                d.name as department_name,
                -- Forwarder branch info (same as original branch for forwarded orders)
                b.name as forwarder_branch_name,
                b.company_name as forwarder_company_name
             FROM job_orders jo
             LEFT JOIN branches b ON jo.branch_id = b.id
             LEFT JOIN departments d ON jo.department_id = d.id
             LEFT JOIN branches fb ON jo.forwarded_to_branch_id = fb.id
             LEFT JOIN departments fd ON jo.forwarded_to_department_id = fd.id
             WHERE 
                jo.submitted_by = ?
                OR (jo.branch_id = ? AND jo.department_id = ? AND jo.is_forwarded = 0)
                OR (jo.is_forwarded = 1 AND jo.forwarded_to_branch_id = ? AND jo.forwarded_to_department_id = ?)
                OR (jo.is_forwarded = 1 AND jo.forwarded_by_name = ?)
                OR (jo.received_name = ?)
                OR LOWER(jo.request_dept) = LOWER(?)
             ORDER BY jo.created_at DESC`,
            [
                decoded.id,
                userBranchId, userDeptId,
                userBranchId, userDeptId,
                userFullname,
                userFullname,
                userDeptName
            ]
        );
        
        console.log(`📋 Found ${allOrders.length} orders for user ${decoded.id} (dept: ${userDeptName})`);
        
        res.json(allOrders);
    } catch (error) {
        console.error('❌ Error fetching my job orders:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - Single Job Order by ID (Client)
app.get('/api/job-orders/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const id = req.params.id;
        
        const [orders] = await pool.query(
            'SELECT * FROM job_orders WHERE id = ? OR job_order_number = ?',
            [isNaN(id) ? 0 : parseInt(id), id]
        );
        
        if (orders.length > 0) {
            res.json(orders[0]);
        } else {
            res.status(404).json({ error: 'Job order not found' });
        }
    } catch (error) {
        console.error('❌ Error fetching job order:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Submit Job Order (Client)
app.post('/api/job-orders', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const {
            date, time, company, ctrl_no, date_needed, department,
            is_charge, is_expense, request_dept, particulars,
            job_order_for, requested_date, requested_name,
            approved_name, approved_date, received_date, received_name,
            job_order_number, submitted_by,
            requested_signature, approved_signature, received_signature,
            branch_id, department_id,
            // ✅ Also accept these field names from frontend
            remarks, attn, request_from, prepared_name, prepared_date
        } = req.body;
        
        console.log('📋 Client creating job order:', { 
            job_order_number, 
            branch_id, 
            department_id,
            request_dept: request_dept || request_from
        });
        
        const userId = submitted_by || decoded.id;
        
        if (job_order_number) {
            const [existing] = await pool.query(
                'SELECT id FROM job_orders WHERE job_order_number = ?',
                [job_order_number]
            );
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Job order number already exists' });
            }
        }
        
        const joNumber = job_order_number || `JO-${Date.now().toString(36).toUpperCase()}`;
        
        const [result] = await pool.query(`
            INSERT INTO job_orders (
                job_order_number, date, time, company, crtk_no, ctrl_no, date_needed, department,
                branch_id, department_id,
                is_charge, is_expense, request_dept, particulars, job_order_for,
                requested_date, requested_name, approved_name, approved_date, received_date,
                received_name, requested_signature, approved_signature, received_signature,
                submitted_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            joNumber,
            date || null,
            time || null,
            company || null,
            ctrl_no || null,
            ctrl_no || null,
            date_needed || null,
            department || null,
            branch_id || null,
            department_id || null,
            is_charge ? 1 : 0,
            is_expense ? 1 : 0,
            request_dept || request_from || null,
            particulars || remarks || null,
            job_order_for || attn || null,
            requested_date || prepared_date || null,
            requested_name || prepared_name || null,
            approved_name || null,
            approved_date || null,
            received_date || null,
            received_name || null,
            requested_signature || null,
            approved_signature || null,
            received_signature || null,
            userId
        ]);
        
        console.log('✅ Client job order created:', result.insertId);
        res.json({ success: true, id: result.insertId, job_order_number: joNumber });
        
    } catch (error) {
        console.error('❌ Error creating job order:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update Job Order (Client)
app.put('/api/job-orders/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const id = req.params.id;
        const {
            date, company, ctrl_no, date_needed, department,
            is_charge, is_expense, request_dept, particulars,
            job_order_for, requested_date, requested_name,
            approved_name, approved_date, received_date, received_name,
            requested_signature, approved_signature, received_signature,
            branch_id, department_id, time
        } = req.body;
        
        console.log('✏️ Client updating job order:', id);
        
        const [existing] = await pool.query(
            'SELECT id FROM job_orders WHERE id = ? OR job_order_number = ?',
            [isNaN(id) ? 0 : parseInt(id), id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        const orderId = existing[0].id;
        await pool.query(`
            UPDATE job_orders SET
                date = ?, time = ?, company = ?, ctrl_no = ?, date_needed = ?, department = ?,
                branch_id = ?, department_id = ?,
                is_charge = ?, is_expense = ?, request_dept = ?, particulars = ?,
                job_order_for = ?, requested_date = ?, requested_name = ?,
                approved_name = ?, approved_date = ?, received_date = ?, received_name = ?,
                requested_signature = ?, approved_signature = ?, received_signature = ?
            WHERE id = ?
        `, [
            date || null, time || null, company || null, ctrl_no || null, date_needed || null, department || null,
            branch_id || null, department_id || null,
            is_charge ? 1 : 0, is_expense ? 1 : 0, request_dept || null, particulars || null,
            job_order_for || null, requested_date || null, requested_name || null,
            approved_name || null, approved_date || null, received_date || null, received_name || null,
            requested_signature || null, approved_signature || null, received_signature || null,
            orderId
        ]);
        
        console.log('✅ Client job order updated:', orderId);
        res.json({ success: true, message: 'Job order updated successfully' });
        
    } catch (error) {
        console.error('❌ Error updating job order:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Receive Job Order (Client/Recipient)
app.put('/api/job-orders/:id/receive', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const { received_name, received_date, received_signature } = req.body;
        
        const [orders] = await pool.query('SELECT * FROM job_orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        const jo = orders[0];
        
        let userBranchId = null;
        let userDeptId = null;
        
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id FROM users WHERE id = ?', [decoded.id]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
            }
        }
        
        const isRecipient = jo.branch_id == userBranchId && jo.department_id == userDeptId;
        
        if (!isRecipient) {
            return res.status(403).json({ error: 'Access denied. You are not the recipient of this job order.' });
        }
        
        await pool.query(`
            UPDATE job_orders SET 
                status = 'approved',
                received_name = ?,
                received_date = ?,
                received_signature = ?
            WHERE id = ?
        `, [received_name || null, received_date || null, received_signature || null, req.params.id]);
        
        console.log('✅ Client job order received:', req.params.id);
        res.json({ success: true, message: 'Job order received' });
    } catch (error) {
        console.error('❌ Error receiving job order:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete Job Order (Client - only own orders)
app.delete('/api/job-orders/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const id = req.params.id;
        
        const [existing] = await pool.query(
            'SELECT id, submitted_by FROM job_orders WHERE id = ? OR job_order_number = ?',
            [isNaN(id) ? 0 : parseInt(id), id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        // Only allow deleting own orders (or admin - handled in admin route)
        if (existing[0].submitted_by !== decoded.id && decoded.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own job orders' });
        }
        
        await pool.query('DELETE FROM job_orders WHERE id = ?', [existing[0].id]);
        res.json({ success: true, message: 'Job order deleted' });
    } catch (error) {
        console.error('❌ Error deleting job order:', error);
        res.status(500).json({ error: error.message });
    }
});


// ============================================
// SECTION 2: ADMIN JOB ORDER ENDPOINTS
// ============================================
// GET - Get all job orders (Admin)
app.get('/api/admin/job-orders', async (req, res) => {
    try {
        // ✅ USE req.user from middleware instead of verifying token again
        const userId = req.user?.id;
        const userRole = req.user?.role || '';
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        console.log('📋 Admin GET all orders - user:', userId, 'role:', userRole);
        
        // ✅ More flexible role check
        const roleLower = (userRole || '').toLowerCase();
        const allowedRoles = ['admin', 'technician', 'head/manager', 'supervisor', 'branch manager', 'staff'];
        
        // Also check if user exists in users table (EDP staff)
        let isAllowed = allowedRoles.includes(roleLower);
        if (!isAllowed) {
            const [userCheck] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
            if (userCheck.length > 0) {
                isAllowed = true;
            }
        }
        
        if (!isAllowed) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        
        const [orders] = await pool.query(`
            SELECT 
                jo.*,
                b.name as branch_name,
                b.company_name,
                d.name as department_name,
                u.fullname as submitted_by_name,
                u.branch_id as submitter_branch_id,
                u.department_id as submitter_dept_id,
                fb.name as forwarded_to_branch_name,
                fb.company_name as forwarded_to_company_name,
                fd.name as forwarded_to_department_name
            FROM job_orders jo
            LEFT JOIN branches b ON jo.branch_id = b.id
            LEFT JOIN departments d ON jo.department_id = d.id
            LEFT JOIN users u ON jo.submitted_by = u.id
            LEFT JOIN branches fb ON jo.forwarded_to_branch_id = fb.id
            LEFT JOIN departments fd ON jo.forwarded_to_department_id = fd.id
            ORDER BY jo.created_at DESC
        `);
        
        res.json(orders);
        
    } catch (error) {
        console.error('❌ Error fetching job orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Get single job order by ID (Admin)
app.get('/api/admin/job-orders/:id', async (req, res) => {
    try {
        // ✅ USE req.user from middleware
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const { id } = req.params;
        
        console.log('📋 Admin GET single order - id:', id);
        
        let queryId = id;
        if (!isNaN(id)) {
            queryId = parseInt(id);
        }
        
        const [orders] = await pool.query(`
            SELECT 
                jo.*,
                b.name as branch_name,
                b.company_name,
                d.name as department_name,
                d.supervisor as department_supervisor,
                u.fullname as submitted_by_name
            FROM job_orders jo
            LEFT JOIN branches b ON jo.branch_id = b.id
            LEFT JOIN departments d ON jo.department_id = d.id
            LEFT JOIN users u ON jo.submitted_by = u.id
            WHERE jo.id = ? OR jo.job_order_number = ?
        `, [queryId, id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        res.json({ jobOrder: orders[0] });
        
    } catch (error) {
        console.error('❌ Error fetching admin job order:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST - Create new job order (Admin)
app.post('/api/admin/job-orders', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const {
            date, time, company, ctrl_no, date_needed, department,
            is_charge, is_expense, request_dept, particulars,
            job_order_for, requested_date, requested_name,
            approved_name, approved_date, received_date, received_name,
            job_order_number, submitted_by,
            requested_signature, approved_signature, received_signature,
            branch_id, department_id, status,
            remarks, attn, request_from, 
            prepared_name, prepared_date, prepared_signature  // ✅ ADDED
        } = req.body;
        
        console.log('📋 Admin creating job order:', { 
            job_order_number, 
            branch_id, 
            department_id,
            has_requested_signature: !!(requested_signature || prepared_signature),
            has_approved_signature: !!approved_signature,
            has_received_signature: !!received_signature
        });
        
        const userId = submitted_by || decoded.id;
        
        if (job_order_number) {
            const [existing] = await pool.query(
                'SELECT id FROM job_orders WHERE job_order_number = ?',
                [job_order_number]
            );
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Job order number already exists' });
            }
        }
        
        const joNumber = job_order_number || `JO-${Date.now().toString(36).toUpperCase()}`;
        
        const [result] = await pool.query(`
            INSERT INTO job_orders (
                job_order_number, date, time, company, crtk_no, ctrl_no, date_needed, department,
                branch_id, department_id,
                is_charge, is_expense, request_dept, particulars, job_order_for,
                requested_date, requested_name, approved_name, approved_date, received_date,
                received_name, requested_signature, approved_signature, received_signature,
                submitted_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            joNumber,
            date || null,
            time || null,
            company || null,
            ctrl_no || null,
            ctrl_no || null,
            date_needed || null,
            department || null,
            branch_id || null,
            department_id || null,
            is_charge ? 1 : 0,
            is_expense ? 1 : 0,
            request_dept || request_from || null,
            particulars || remarks || null,
            job_order_for || attn || null,
            requested_date || prepared_date || null,
            requested_name || prepared_name || null,
            approved_name || null,
            approved_date || null,
            received_date || null,
            received_name || null,
            requested_signature || prepared_signature || null,  // ✅ FIXED
            approved_signature || null,
            received_signature || null,
            userId,
            status || 'pending'
        ]);
        
        console.log('✅ Admin job order created:', result.insertId);
        res.json({ success: true, id: result.insertId, job_order_number: joNumber });
        
    } catch (error) {
        console.error('❌ Error creating admin job order:', error);
        res.status(500).json({ error: error.message });
    }
});
// PUT - Update job order (Admin)
app.put('/api/admin/job-orders/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { id } = req.params;
        
        const {
            date, company, ctrl_no, date_needed, department,
            is_charge, is_expense, request_dept, particulars,
            job_order_for, requested_date, requested_name,
            approved_name, approved_date, received_date, received_name,
            requested_signature, approved_signature, received_signature,
            branch_id, department_id, time, status
        } = req.body;
        
        console.log('📝 Admin updating job order:', id);
        
        const [result] = await pool.query(`
            UPDATE job_orders SET
                date = ?, time = ?, company = ?, ctrl_no = ?, date_needed = ?,
                department = ?, branch_id = ?, department_id = ?,
                is_charge = ?, is_expense = ?, request_dept = ?, particulars = ?,
                job_order_for = ?, requested_date = ?, requested_name = ?,
                approved_name = ?, approved_date = ?, received_date = ?,
                received_name = ?, requested_signature = ?, approved_signature = ?,
                received_signature = ?, status = ?
            WHERE id = ?
        `, [
            date || null, time || null, company || null, ctrl_no || null,
            date_needed || null, department || null,
            branch_id || null, department_id || null,
            is_charge ? 1 : 0, is_expense ? 1 : 0,
            request_dept || null, particulars || null,
            job_order_for || null, requested_date || null,
            requested_name || null, approved_name || null, approved_date || null,
            received_date || null, received_name || null,
            requested_signature || null, approved_signature || null, received_signature || null,
            status || 'pending', id
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        console.log('✅ Admin job order updated:', id);
        res.json({ success: true, message: 'Job order updated successfully' });
        
    } catch (error) {
        console.error('❌ Error updating admin job order:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update job order status (Admin)
app.put('/api/admin/job-orders/:id/status', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const allowedRoles = ['admin', 'Technician', 'Head/Manager', 'head/manager', 'supervisor', 'branch manager'];
        let isEDP = allowedRoles.includes(decoded.role);
        if (!isEDP) {
            const [userCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [decoded.id]);
            isEDP = userCheck.length > 0;
        }
        if (!isEDP) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { id } = req.params;
        const { status, done_name, done_date, assigned_to, assigned_users, assigned_names } = req.body;
        
        console.log('📊 Admin updating job order status:', { id, status });
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['pending', 'approved', 'assigned', 'forwarded', 'done', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const [orders] = await pool.query('SELECT * FROM job_orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        const jo = orders[0];
        const updates = [];
        const values = [];
        
        if (jo.is_forwarded) {
            if (status === 'assigned') {
                updates.push('forwarded_status = ?');
                values.push('assigned');
            } else if (status === 'done') {
                updates.push('status = ?');
                values.push('done');
                updates.push('forwarded_status = ?');
                values.push('done');
            } else {
                updates.push('status = ?');
                values.push(status);
            }
        } else {
            updates.push('status = ?');
            values.push(status);
        }
        
        if (done_name !== undefined) {
            updates.push('done_name = ?');
            values.push(done_name || null);
        }
        if (done_date !== undefined) {
            updates.push('done_date = ?');
            values.push(done_date || null);
        }
        if (assigned_to !== undefined) {
            updates.push('assigned_to = ?');
            values.push(assigned_to || null);
        }
        if (assigned_users !== undefined) {
            updates.push('assigned_users = ?');
            values.push(JSON.stringify(assigned_users) || null);
        }
        if (assigned_names !== undefined) {
            updates.push('assigned_names = ?');
            values.push(assigned_names || null);
        }
        
        if (updates.length > 0) {
            values.push(id);
            await pool.query(`UPDATE job_orders SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        
        console.log('✅ Admin job order status updated:', { id, status });
        res.json({ success: true, message: `Job order ${status}` });
        
    } catch (error) {
        console.error('❌ Error updating job order status:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Receive job order (Admin)
app.put('/api/admin/job-orders/:id/receive', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { id } = req.params;
        const { received_name, received_date, received_signature, status } = req.body;
        
        console.log('📥 Admin receiving job order:', { id, received_name });
        
        if (!received_name) {
            return res.status(400).json({ error: 'Received name is required' });
        }
        
        const [result] = await pool.query(`
            UPDATE job_orders SET
                received_name = ?,
                received_date = ?,
                received_signature = ?,
                status = ?
            WHERE id = ?
        `, [
            received_name,
            received_date || new Date().toISOString().split('T')[0],
            received_signature || null,
            status || 'approved',
            id
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        console.log('✅ Admin job order received:', id);
        res.json({ success: true, message: 'Job order received successfully' });
        
    } catch (error) {
        console.error('❌ Error receiving job order:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Forward Job Order (Admin)
app.put('/api/admin/job-orders/:id/forward', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const { forwarded_to_branch_id, forwarded_to_department_id, forwarded_by_name } = req.body;
        
        await pool.query(`
            UPDATE job_orders SET 
                is_forwarded = 1,
                forwarded_to_branch_id = ?,
                forwarded_to_department_id = ?,
                forwarded_by_name = ?,
                forwarded_date = CURDATE(),
                status = 'forwarded'
            WHERE id = ?
        `, [forwarded_to_branch_id, forwarded_to_department_id, forwarded_by_name, req.params.id]);
        
        console.log('✅ Job order forwarded:', req.params.id);
        res.json({ success: true, message: 'Job order forwarded' });
    } catch (error) {
        console.error('Forward error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Approve/Receive Job Order with signatures (Admin)
app.put('/api/admin/job-orders/:id/approve', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const { approved_name, approved_signature, received_name, received_date, received_signature, status } = req.body;
        
        const [orders] = await pool.query('SELECT * FROM job_orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        const jo = orders[0];
        
        let userBranchId = null;
        let userDeptId = null;
        let userRole = '';
        
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id, role FROM users WHERE id = ?', [decoded.id]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
            userRole = userInfo[0].role || '';
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id, role FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
                userRole = newUserInfo[0].role || '';
            }
        }
        
        const isAdmin = decoded.role === 'admin' || decoded.role === 'Technician' || userRole === 'admin' || userRole === 'Technician';
        const isRecipient = jo.branch_id == userBranchId && jo.department_id == userDeptId;
        const isHeadOrSupervisor = userRole === 'head/manager' || userRole === 'supervisor' || userRole === 'branch manager';
        
        if (!isAdmin && !(isRecipient && isHeadOrSupervisor)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const updates = [];
        const values = [];
        
        if (status) { updates.push('status = ?'); values.push(status); }
        if (approved_name !== undefined) { updates.push('approved_name = ?'); values.push(approved_name || null); }
        if (approved_signature !== undefined) { updates.push('approved_signature = ?'); values.push(approved_signature || null); }
        if (received_name !== undefined) { updates.push('received_name = ?'); values.push(received_name || null); }
        if (received_date !== undefined) { updates.push('received_date = ?'); values.push(received_date || null); }
        if (received_signature !== undefined) { updates.push('received_signature = ?'); values.push(received_signature || null); }
        
        if (updates.length > 0) {
            values.push(req.params.id);
            await pool.query(`UPDATE job_orders SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        
        console.log('✅ Admin job order approved/received:', req.params.id);
        res.json({ success: true, message: 'Job order updated' });
    } catch (error) {
        console.error('❌ Error approving job order:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete job order (Allow for all authenticated users)
app.delete('/api/admin/job-orders/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { id } = req.params;
        
        console.log('🗑️ Deleting job order:', id);
        
        const [result] = await pool.query('DELETE FROM job_orders WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job order not found' });
        }
        
        console.log('✅ Job order deleted:', id);
        res.json({ success: true, message: 'Job order deleted successfully' });
        
    } catch (error) {
        console.error('❌ Error deleting job order:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// REQUISITIONS API ENDPOINTS (FIXED ORDER)
// ============================================
// GET - My Requisitions (FIXED)
app.get('/api/requisitions/my', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        console.log('📋 GET /api/requisitions/my - User:', decoded.id);
        
        // Get user's branch and department from both tables
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id FROM users WHERE id = ?', [decoded.id]
        );
        
        let userBranchId = null;
        let userDeptId = null;
        
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
            }
        }
        
        console.log('📋 User branch:', userBranchId, 'dept:', userDeptId);
        
        // ✅ FIXED: Get requisitions with creator info
        // This returns:
        // 1. Requisitions I created (submitted_by = me)
        // 2. Requisitions created by colleagues in my branch+department (for "Our Requests")
        // 3. Requisitions sent TO my branch+department (for "Request Management")
        // 4. Requisitions forwarded TO my branch+department
        const [reqs] = await pool.query(
            `SELECT r.*, 
                    COALESCE(u.department_id, nu.department_id) as creator_dept_id,
                    COALESCE(u.branch_id, nu.branch_id) as creator_branch_id
             FROM requisitions r
             LEFT JOIN users u ON r.submitted_by = u.id
             LEFT JOIN new_user nu ON r.submitted_by = nu.id
             WHERE 
                -- My own requisitions
                r.submitted_by = ?
                -- OR Colleagues in my same branch+department (creator info match)
                OR (COALESCE(u.department_id, nu.department_id) = ? AND COALESCE(u.branch_id, nu.branch_id) = ?)
                -- OR Sent to my branch+department (original destination)
                OR (r.branch_id = ? AND r.department_id = ? AND r.submitted_by != ?)
                -- OR Forwarded TO my branch+department
                OR (r.is_forwarded = 1 AND r.forwarded_to_branch_id = ? AND r.forwarded_to_department_id = ?)
             ORDER BY r.created_at DESC`,
            [
                decoded.id,                          // My own
                userDeptId, userBranchId,            // Colleagues in same dept/branch
                userBranchId, userDeptId, decoded.id, // Sent to my dept (not by me)
                userBranchId, userDeptId             // Forwarded to me
            ]
        );
        
        // Load items for each requisition
        for (const reqRecord of reqs) {
            const [items] = await pool.query('SELECT * FROM requisition_items WHERE requisition_id = ?', [reqRecord.id]);
            reqRecord.items = items;
        }
        
        console.log('📋 Returning', reqs.length, 'requisitions');
        res.json(reqs);
    } catch (error) { 
        console.error('GET /api/requisitions/my error:', error);
        res.status(500).json({ error: error.message }); 
    }
});
// 2. GET - All Requisitions (Admin) (STATIC)
// GET - All Requisitions (Admin)
app.get('/api/admin/requisitions', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, 'secret_key');
        } catch (jwtError) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        // Get user info from both tables
        const [userInfo] = await pool.query(
            'SELECT department_id, branch_id, department, role FROM users WHERE id = ?', [decoded.id]
        );
        
        let userDeptId = null;
        let userBranchId = null;
        let userRole = decoded.role || '';
        
        if (userInfo.length > 0) {
            userDeptId = userInfo[0].department_id;
            userBranchId = userInfo[0].branch_id;
            userRole = userInfo[0].role || userRole;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT department_id, branch_id, department, role FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userDeptId = newUserInfo[0].department_id;
                userBranchId = newUserInfo[0].branch_id;
                userRole = newUserInfo[0].role || userRole;
            }
        }
        
        console.log('📋 GET /api/admin/requisitions - User:', decoded.id, 'Role:', userRole);
        
        // Check if admin role
        const isAdminRole = userRole === 'admin' || userRole === 'Technician' || userRole === 'head/manager';
        
        let query;
        let params;
        
        if (isAdminRole) {
            // Show ALL requisitions with creator info
            query = `SELECT r.*, 
                            COALESCE(u.department_id, nu.department_id) as creator_dept_id,
                            COALESCE(u.branch_id, nu.branch_id) as creator_branch_id
                     FROM requisitions r
                     LEFT JOIN users u ON r.submitted_by = u.id
                     LEFT JOIN new_user nu ON r.submitted_by = nu.id
                     ORDER BY r.created_at DESC`;
            params = [];
        } else {
            // For non-admin users:
query = `SELECT r.*, 
                COALESCE(u.department_id, nu.department_id) as creator_dept_id,
                COALESCE(u.branch_id, nu.branch_id) as creator_branch_id
         FROM requisitions r
         LEFT JOIN users u ON r.submitted_by = u.id
         LEFT JOIN new_user nu ON r.submitted_by = nu.id
         WHERE r.submitted_by = ? 
         OR (r.branch_id = ? AND r.department_id = ?)
         OR (r.forwarded_to_branch_id = ? AND r.forwarded_to_department_id = ?)
         OR (COALESCE(u.department_id, nu.department_id) = ? AND COALESCE(u.branch_id, nu.branch_id) = ?)
         ORDER BY r.created_at DESC`;
params = [decoded.id, userBranchId, userDeptId, userBranchId, userDeptId, userDeptId, userBranchId];
        }
        
        const [reqs] = await pool.query(query, params);
        
        for (const req of reqs) {
            const [items] = await pool.query('SELECT * FROM requisition_items WHERE requisition_id = ?', [req.id]);
            req.items = items;
        }
        
        console.log('📋 Returning', reqs.length, 'requisitions');
        res.json(reqs);
        
    } catch (error) { 
        console.error('GET /api/admin/requisitions error:', error);
        res.status(500).json({ error: error.message }); 
    }
});
app.post('/api/admin/requisitions', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const {
            requisition_number, request_from, attn, date, remarks, items,
            prepared_name, prepared_signature, prepared_date,
            approved_name, approved_signature, approved_date,
            items_prepared_name, items_prepared_signature, items_prepared_date,
            returned_name, returned_date,
            submitted_by, department_id, branch_id
        } = req.body;
        
        const userId = submitted_by || decoded.id;
        
        console.log('📝 POST /api/admin/requisitions - Admin Creating:', requisition_number);
        console.log('   department_id:', department_id, 'branch_id:', branch_id);
        
        const [result] = await pool.query(`
            INSERT INTO requisitions (
                requisition_number, request_from, attn, department_id, branch_id, date, remarks,
                prepared_name, prepared_signature, prepared_date,
                approved_name, approved_signature, approved_date,
                items_prepared_name, items_prepared_signature, items_prepared_date,
                returned_name, returned_date,
                submitted_by, status
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [requisition_number, request_from, attn, department_id || null, branch_id || null, date, remarks,
             prepared_name, prepared_signature, prepared_date,
             approved_name || null, approved_signature || null, approved_date || null,
             items_prepared_name || null, items_prepared_signature || null, items_prepared_date || null,
             returned_name || null, returned_date || null,
             userId, 'pending']
        );
        
        if (items && items.length > 0) {
            for (const item of items) {
                await pool.query('INSERT INTO requisition_items (requisition_id, qty, item, unit_price) VALUES (?,?,?,?)',
                    [result.insertId, item.qty, item.item, item.unit_price]);
            }
        }
        
        console.log('✅ Admin Requisition created:', result.insertId);
        res.json({ success: true, id: result.insertId, requisition_number });
    } catch (error) { 
        console.error('POST /api/admin/requisitions error:', error);
        res.status(500).json({ error: error.message }); 
    }
});
// PUT - Admin Update/Edit Requisition
app.put('/api/admin/requisitions/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { id } = req.params;
        const {
            request_from, attn, date, remarks, items,
            prepared_name, prepared_signature, prepared_date,
            approved_name, approved_signature, approved_date,
            items_prepared_name, items_prepared_signature, items_prepared_date,
            returned_name, returned_date,
            department_id, branch_id
        } = req.body;
        
        console.log('✏️ PUT /api/admin/requisitions/:id - Updating:', id);
        
        await pool.query(`
            UPDATE requisitions SET
                request_from = ?, attn = ?, department_id = ?, branch_id = ?, date = ?, remarks = ?,
                prepared_name = ?, prepared_signature = ?, prepared_date = ?,
                approved_name = ?, approved_signature = ?, approved_date = ?,
                items_prepared_name = ?, items_prepared_signature = ?, items_prepared_date = ?,
                returned_name = ?, returned_date = ?
            WHERE id = ?`,
            [request_from, attn, department_id || null, branch_id || null, date, remarks,
             prepared_name, prepared_signature, prepared_date,
             approved_name || null, approved_signature || null, approved_date || null,
             items_prepared_name || null, items_prepared_signature || null, items_prepared_date || null,
             returned_name || null, returned_date || null,
             id]
        );
        
        // Delete old items and re-insert
        await pool.query('DELETE FROM requisition_items WHERE requisition_id = ?', [id]);
        
        if (items && items.length > 0) {
            for (const item of items) {
                await pool.query('INSERT INTO requisition_items (requisition_id, qty, item, unit_price) VALUES (?,?,?,?)',
                    [id, item.qty, item.item, item.unit_price]);
            }
        }
        
        console.log('✅ Admin Requisition updated:', id);
        res.json({ success: true, id });
    } catch (error) { 
        console.error('PUT /api/admin/requisitions/:id error:', error);
        res.status(500).json({ error: error.message }); 
    }
});
// POST - Client Submit Requisition
app.post('/api/requisitions', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const {
            requisition_number, request_from, attn, date, remarks, items,
            prepared_name, prepared_signature, prepared_date,
            approved_name, approved_signature, approved_date,
            items_prepared_name, items_prepared_signature, items_prepared_date,
            returned_name, returned_signature, returned_date,
            submitted_by, department_id, branch_id
        } = req.body;
        
        const userId = submitted_by || decoded.id;
        
        console.log('📝 POST /api/requisitions - Creating:', requisition_number);
        console.log('   department_id:', department_id, 'branch_id:', branch_id);
        
        const [result] = await pool.query(`
    INSERT INTO requisitions (
        requisition_number, request_from, attn, department_id, branch_id, date, remarks,
        prepared_name, prepared_signature, prepared_date,
        approved_name, approved_signature, approved_date,
        items_prepared_name, items_prepared_signature, items_prepared_date,
        returned_name, returned_signature, returned_date,
        submitted_by, status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [requisition_number, request_from, attn, department_id || null, branch_id || null, date, remarks,
     prepared_name, prepared_signature, prepared_date,
     approved_name || null, approved_signature || null, approved_date || null,
     items_prepared_name || null, items_prepared_signature || null, items_prepared_date || null,
     returned_name || null, returned_signature || null, returned_date || null,
     userId, 'pending']
);
        
        if (items && items.length > 0) {
            for (const item of items) {
                await pool.query('INSERT INTO requisition_items (requisition_id, qty, item, unit_price) VALUES (?,?,?,?)',
                    [result.insertId, item.qty, item.item, item.unit_price]);
            }
        }
        
        console.log('✅ Requisition created:', result.insertId);
        res.json({ success: true, id: result.insertId, requisition_number });
    } catch (error) { 
        console.error('POST /api/requisitions error:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// Update the PUT /api/admin/requisitions/:id/status endpoint
// PUT - Forward Requisition (Admin)
app.put('/api/admin/requisitions/:id/forward', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { id } = req.params;
        const { 
            forwarded_to_branch_id, 
            forwarded_to_department_id, 
            forwarded_by_name 
        } = req.body;
        
        console.log('📤 Forwarding requisition:', id, 'to branch:', forwarded_to_branch_id, 'dept:', forwarded_to_department_id);
        
        await pool.query(`
            UPDATE requisitions SET 
                is_forwarded = 1,
                forwarded_to_branch_id = ?,
                forwarded_to_department_id = ?,
                forwarded_by_name = ?,
                forwarded_date = CURDATE(),
                status = 'forwarded'
            WHERE id = ?
        `, [forwarded_to_branch_id, forwarded_to_department_id, forwarded_by_name, id]);
        
        console.log('✅ Requisition forwarded:', id);
        res.json({ success: true, message: 'Requisition forwarded successfully' });
    } catch (error) {
        console.error('PUT /api/admin/requisitions/:id/forward error:', error);
        res.status(500).json({ error: error.message });
    }
});
// 4. GET - Single Requisition by ID
app.get('/api/requisitions/:id', async (req, res) => {
    try {
        console.log('🔍 Backend received GET /api/requisitions/:id with params:', req.params);
        
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const id = req.params.id;
        const numericId = parseInt(id);
        
        let [requisitions] = await pool.query(
            'SELECT * FROM requisitions WHERE id = ? OR requisition_number = ?', 
            [isNaN(numericId) ? 0 : numericId, id]
        );
        
        if (requisitions.length === 0) {
            return res.status(404).json({ error: 'Requisition not found' });
        }
        
        const requisition = requisitions[0];
        const [items] = await pool.query('SELECT * FROM requisition_items WHERE requisition_id = ?', [requisition.id]);
        requisition.items = items;
        
        // ✅ Get user's branch, department, AND ROLE
        let userBranchId = null;
        let userDeptId = null;
        let userRole = '';
        
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id, role FROM users WHERE id = ?', [decoded.id]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
            userRole = userInfo[0].role || '';
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id, role FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
                userRole = newUserInfo[0].role || '';
            }
        }
        
        // ✅ Check if user is the recipient (same branch + department)
        const isRecipient = userBranchId && userDeptId && 
                           requisition.branch_id == userBranchId && 
                           requisition.department_id == userDeptId;
        
        // ✅ Check if user is Head/Manager or Supervisor from same department
        const isHeadOrSupervisor = userRole === 'head/manager' || userRole === 'supervisor' || userRole === 'branch manager';
        const isSameDept = userBranchId && userDeptId && 
                          requisition.branch_id == userBranchId && 
                          requisition.department_id == userDeptId;
        
        // Allow access if:
        // 1. User is admin/Technician
        // 2. User is the creator (submitted_by)
        // 3. User is the recipient (same branch + department)
        // 4. User is Head/Manager or Supervisor from same department
        const hasAccess = decoded.role === 'admin' ||
                        decoded.role === 'Head/Manager' ||
                        decoded.role === 'Branch Manager' || 
                        decoded.role === 'supervisor' ||  
                         decoded.role === 'Technician' || 
                         requisition.submitted_by === decoded.id ||
                         isRecipient ||
                         (isHeadOrSupervisor && isSameDept);
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        console.log('📦 Returning requisition:', {
            id: requisition.id,
            number: requisition.requisition_number,
            isCreator: requisition.submitted_by === decoded.id,
            isRecipient: isRecipient,
            isHeadOrSupervisor: isHeadOrSupervisor
        });
        
        res.json(requisition);
    } catch (error) { 
        console.error('❌ GET /api/requisitions/:id error:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// 5. PUT - Admin Status Update (UPDATED to support release AND recipient access)
app.put('/api/admin/requisitions/:id/status', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        // ✅ Get user info
        let userBranchId = null;
        let userDeptId = null;
        
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id, role FROM users WHERE id = ?', [decoded.id]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
            decoded.role = userInfo[0].role || decoded.role;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id, role FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
                decoded.role = newUserInfo[0].role || decoded.role;
            }
        }
        
        const { id } = req.params;
        
        // ✅ Get existing requisition with forwarded info
        const [existing] = await pool.query(
            'SELECT * FROM requisitions WHERE id = ?', [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Requisition not found' });
        }
        
        const reqData = existing[0];
        
        // ✅ Check access
        const isAdmin = decoded.role === 'admin' || decoded.role === 'Technician';
        const isOriginalRecipient = userBranchId && userDeptId &&
                                    reqData.branch_id == userBranchId && 
                                    reqData.department_id == userDeptId;
        const isForwardedRecipient = reqData.is_forwarded && userBranchId && userDeptId &&
                                     reqData.forwarded_to_branch_id == userBranchId && 
                                     reqData.forwarded_to_department_id == userDeptId;
        
        console.log('🔍 Status update access check:', {
            isAdmin,
            isOriginalRecipient,
            isForwardedRecipient,
            userBranchId,
            userDeptId,
            reqBranchId: reqData.branch_id,
            reqDeptId: reqData.department_id,
            forwardedToBranch: reqData.forwarded_to_branch_id,
            forwardedToDept: reqData.forwarded_to_department_id,
            isForwarded: reqData.is_forwarded,
            currentStatus: reqData.status,
            forwardedStatus: reqData.forwarded_status
        });
        
        if (!isAdmin && !isOriginalRecipient && !isForwardedRecipient) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { 
            status, 
            approved_name, approved_date, approved_signature,
            items_prepared_name, items_prepared_date, items_prepared_signature,
            released_name, released_date
        } = req.body;
        
        // ✅ Handle forwarded request status updates
        if (reqData.is_forwarded) {
            
            if (status === 'processing') {
                // 🔑 Recipient processing - keep status as 'forwarded', only update forwarded_status
                const updates = ['forwarded_status = ?'];
                const values = ['processing'];
                
                if (items_prepared_name !== undefined) { updates.push('items_prepared_name = ?'); values.push(items_prepared_name); }
                if (items_prepared_date !== undefined) { updates.push('items_prepared_date = ?'); values.push(items_prepared_date); }
                
                values.push(id);
                await pool.query(`UPDATE requisitions SET ${updates.join(', ')} WHERE id = ?`, values);
                console.log('✅ Forwarded request processing (status stays forwarded):', id);
                
            } else if (status === 'released') {
                
                // 🔑 Check WHO is releasing
                if (isForwardedRecipient && !isOriginalRecipient) {
                    // RECIPIENT releasing - keep status as 'forwarded', set forwarded_status to 'released'
                    const updates = ['forwarded_status = ?'];
                    const values = ['released'];
                    
                    if (released_name !== undefined) { updates.push('released_name = ?'); values.push(released_name); }
                    if (released_date !== undefined) { updates.push('released_date = ?'); values.push(released_date); }
                    
                    values.push(id);
                    await pool.query(`UPDATE requisitions SET ${updates.join(', ')} WHERE id = ?`, values);
                    console.log('✅ Forwarded request released by recipient (status stays forwarded):', id);
                    
                } else if (isOriginalRecipient || isAdmin) {
                    // FORWARDING DEPT releasing - FINAL release, change status to 'released'
                    const updates = ['status = ?', 'forwarded_status = NULL'];
                    const values = ['released'];
                    
                    if (released_name !== undefined) { updates.push('released_name = ?'); values.push(released_name); }
                    if (released_date !== undefined) { updates.push('released_date = ?'); values.push(released_date); }
                    
                    values.push(id);
                    await pool.query(`UPDATE requisitions SET ${updates.join(', ')} WHERE id = ?`, values);
                    console.log('✅ Forwarding dept FINAL release:', id, '→ released');
                }
                
            } else {
                // Other status updates (approve, reject, etc.)
                const updates = ['status = ?'];
                const values = [status];
                
                if (approved_name !== undefined) { updates.push('approved_name = ?'); values.push(approved_name); }
                if (approved_date !== undefined) { updates.push('approved_date = ?'); values.push(approved_date); }
                if (approved_signature !== undefined) { updates.push('approved_signature = ?'); values.push(approved_signature); }
                
                values.push(id);
                await pool.query(`UPDATE requisitions SET ${updates.join(', ')} WHERE id = ?`, values);
                console.log('✅ Forwarded request other update:', id, '→', status);
            }
            
        } else {
            // ✅ Normal (non-forwarded) status update
            const updates = ['status = ?'];
            const values = [status];
            
            if (approved_name !== undefined) { updates.push('approved_name = ?'); values.push(approved_name); }
            if (approved_date !== undefined) { updates.push('approved_date = ?'); values.push(approved_date); }
            if (approved_signature !== undefined) { updates.push('approved_signature = ?'); values.push(approved_signature); }
            if (items_prepared_name !== undefined) { updates.push('items_prepared_name = ?'); values.push(items_prepared_name); }
            if (items_prepared_date !== undefined) { updates.push('items_prepared_date = ?'); values.push(items_prepared_date); }
            if (items_prepared_signature !== undefined) { updates.push('items_prepared_signature = ?'); values.push(items_prepared_signature); }
            if (released_name !== undefined) { updates.push('released_name = ?'); values.push(released_name); }
            if (released_date !== undefined) { updates.push('released_date = ?'); values.push(released_date); }
            
            values.push(id);
            await pool.query(`UPDATE requisitions SET ${updates.join(', ')} WHERE id = ?`, values);
            console.log('✅ Status update:', id, '→', status);
        }
        
        res.json({ success: true });
    } catch (error) { 
        console.error('PUT /api/admin/requisitions/:id/status error:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// 6. PUT - Admin Approve (UPDATED to support recipient access)
app.put('/api/admin/requisitions/:id/approve', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        // ✅ Get user info for recipient check
        let userBranchId = null;
        let userDeptId = null;
        
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id, role FROM users WHERE id = ?', [decoded.id]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
            decoded.role = userInfo[0].role || decoded.role;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id, role FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
                decoded.role = newUserInfo[0].role || decoded.role;
            }
        }
        
        // ✅ Check if user is the recipient of this requisition
        const [requisition] = await pool.query(
            'SELECT branch_id, department_id FROM requisitions WHERE id = ?', [req.params.id]
        );
        const isRecipient = requisition.length > 0 && 
                           userBranchId && userDeptId &&
                           requisition[0].branch_id == userBranchId && 
                           requisition[0].department_id == userDeptId;
        
        // Allow if admin, Technician, OR the recipient
        const isAdmin = decoded.role === 'admin' || decoded.role === 'Technician';
        if (!isAdmin && !isRecipient) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { status, items, items_prepared_name, items_prepared_date, items_prepared_signature } = req.body;
        const updates = ['status = ?'];
        const values = [status || 'approved'];
        
        if (items_prepared_name !== undefined) { 
            updates.push('items_prepared_name = ?'); 
            values.push(items_prepared_name); 
        }
        if (items_prepared_date !== undefined) { 
            updates.push('items_prepared_date = ?'); 
            values.push(items_prepared_date); 
        }
        if (items_prepared_signature !== undefined) { 
            updates.push('items_prepared_signature = ?'); 
            values.push(items_prepared_signature); 
        }
        values.push(req.params.id);
        
        await pool.query(`UPDATE requisitions SET ${updates.join(', ')} WHERE id = ?`, values);
        
        // Update items with unit prices
        if (items && items.length > 0) {
            for (const item of items) {
                await pool.query(
                    'UPDATE requisition_items SET unit_price = ? WHERE id = ?',
                    [item.unit_price, item.id]
                );
            }
        }
        
        console.log('✅ Approve:', req.params.id);
        res.json({ success: true });
    } catch (error) { 
        console.error('PUT /api/admin/requisitions/:id/approve error:', error);
        res.status(500).json({ error: error.message }); 
    }
});
// DELETE - Admin Delete Requisition
app.delete('/api/admin/requisitions/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { id } = req.params;
        
        console.log('🗑️ DELETE /api/admin/requisitions/:id - Deleting:', id);
        
        // Delete items first (foreign key)
        await pool.query('DELETE FROM requisition_items WHERE requisition_id = ?', [id]);
        // Delete the requisition
        await pool.query('DELETE FROM requisitions WHERE id = ?', [id]);
        
        console.log('✅ Requisition deleted:', id);
        res.json({ success: true, id });
    } catch (error) { 
        console.error('DELETE /api/admin/requisitions/:id error:', error);
        res.status(500).json({ error: error.message }); 
    }
});
// 7. PUT - Update Requisition (client edit) - GENERIC, comes last
app.put('/api/requisitions/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const id = req.params.id;
        const numericId = parseInt(id);
        
        const [existing] = await pool.query(
            'SELECT * FROM requisitions WHERE id = ? OR requisition_number = ?',
            [isNaN(numericId) ? 0 : numericId, id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Requisition not found' });
        }
        
        const reqRecord = existing[0];
        
        // ✅ Get user role and department info for access check
        let userBranchId = null;
        let userDeptId = null;
        let userRole = '';
        let userId = decoded.id;
        
        const [userInfo] = await pool.query(
            'SELECT id, branch_id, department_id, role FROM users WHERE id = ?', [decoded.id]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
            userRole = userInfo[0].role || '';
            userId = userInfo[0].id;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT id, branch_id, department_id, role FROM new_user WHERE id = ?', [decoded.id]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
                userRole = newUserInfo[0].role || '';
                userId = newUserInfo[0].id;
            }
        }
        
        // ✅ Normalize role to lowercase for comparison
        const normalizedRole = (userRole || '').toLowerCase();
        
        // ✅ Check access with expanded permissions
        const isCreator = reqRecord.submitted_by == userId;
        const isAdmin = decoded.role === 'admin' || normalizedRole === 'admin' || normalizedRole === 'technician';
        
        // ✅ Head/Manager, Supervisor, Branch Manager can edit if same BRANCH
        const isHeadOrSupervisor = normalizedRole === 'head/manager' || 
                                   normalizedRole === 'supervisor' || 
                                   normalizedRole === 'branch manager';
        const isSameBranch = reqRecord.branch_id == userBranchId;
        
        // ✅ Also allow if user is in the same department (regardless of role)
        const isSameDept = reqRecord.branch_id == userBranchId && reqRecord.department_id == userDeptId;
        
        console.log('🔑 ACCESS CHECK:');
        console.log('   userId:', userId, 'submitted_by:', reqRecord.submitted_by);
        console.log('   isCreator:', isCreator);
        console.log('   isAdmin:', isAdmin);
        console.log('   isHeadOrSupervisor:', isHeadOrSupervisor);
        console.log('   isSameBranch:', isSameBranch);
        console.log('   isSameDept:', isSameDept);
        console.log('   userBranchId:', userBranchId, 'reqBranchId:', reqRecord.branch_id);
        console.log('   userDeptId:', userDeptId, 'reqDeptId:', reqRecord.department_id);
        
        // ✅ UPDATED ACCESS LOGIC:
        // Allow if: Creator OR Admin OR (Head/Supervisor in same branch) OR Same department
        const hasAccess = isCreator || 
                         isAdmin || 
                         (isHeadOrSupervisor && isSameBranch) || 
                         isSameDept;
        
        console.log('   HAS ACCESS:', hasAccess);
        
        if (!hasAccess) {
            console.log('❌ ACCESS DENIED');
            return res.status(403).json({ 
                error: 'Access denied. You can only edit your own requisitions or requisitions in your branch/department.',
                debug: {
                    isCreator,
                    isAdmin,
                    isHeadOrSupervisor,
                    isSameBranch,
                    isSameDept,
                    yourBranch: userBranchId,
                    yourDept: userDeptId,
                    reqBranch: reqRecord.branch_id,
                    reqDept: reqRecord.department_id
                }
            });
        }
        
        console.log('✅ ACCESS GRANTED');
        
        const { request_from, attn, date, remarks, items,
                prepared_name, prepared_signature, prepared_date,
                approved_name, approved_signature, approved_date,
                items_prepared_name, items_prepared_signature, items_prepared_date,
                returned_name, returned_signature, returned_date,
                department_id, branch_id } = req.body;
        
        console.log('📝 Updating requisition with:', {
            request_from,
            attn,
            department_id,
            branch_id,
            date,
            items_count: items?.length || 0
        });
        
        await pool.query(`UPDATE requisitions SET 
            request_from = ?, attn = ?, department_id = ?, branch_id = ?, date = ?, remarks = ?,
            prepared_name = ?, prepared_signature = ?, prepared_date = ?,
            approved_name = ?, approved_signature = ?, approved_date = ?,
            items_prepared_name = ?, items_prepared_signature = ?, items_prepared_date = ?,
            returned_name = ?, returned_signature = ?, returned_date = ?
            WHERE id = ?`,
            [request_from, attn, department_id || null, branch_id || null, date, remarks,
             prepared_name, prepared_signature, prepared_date,
             approved_name || null, approved_signature || null, approved_date || null,
             items_prepared_name || null, items_prepared_signature || null, items_prepared_date || null,
             returned_name || null, returned_signature || null, returned_date || null,
             reqRecord.id]);
        
        if (items !== undefined) {
            await pool.query('DELETE FROM requisition_items WHERE requisition_id = ?', [reqRecord.id]);
            if (items && items.length > 0) {
                for (const item of items) {
                    await pool.query('INSERT INTO requisition_items (requisition_id, qty, item, unit_price) VALUES (?,?,?,?)',
                        [reqRecord.id, item.qty, item.item, item.unit_price]);
                }
            }
        }
        
        console.log('✅ Requisition updated successfully:', reqRecord.id);
        res.json({ success: true, id: reqRecord.id });
    } catch (error) {
        console.error('PUT /api/requisitions/:id error:', error);
        res.status(500).json({ error: error.message }); 
    }
});
// GET - Specific Users basing on the specific department of specific branch
app.get('/api/admin/users', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        
        // ✅ Better error handling for JWT
        let decoded;
        try {
            decoded = jwt.verify(token, 'secret_key');
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        // ✅ Add department_id
        const [users] = await pool.query(
            "SELECT id, fullname, username, role, branch_id, department_id FROM users ORDER BY fullname"
        );
        
        // ✅ Also check new_user table with department_id
        const [newUsers] = await pool.query(
            "SELECT id, fullname, username, role, branch_id, department_id FROM new_user ORDER BY fullname"
        );
        
        // ✅ Combine both tables
        const allUsers = [...users, ...newUsers];
        
        console.log(`📋 /api/admin/users - Returning ${allUsers.length} users`);
        res.json(allUsers);
    } catch (error) {
        console.error('GET /api/admin/users error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - Client users by department (for assign modal)
app.get('/api/client/users/by-dept/:departmentId', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { departmentId } = req.params;
        
        // ✅ Get users from new_user table only, filtered by department_id
        const [users] = await pool.query(
            `SELECT id, fullname, username, role, branch_id, department_id 
             FROM new_user 
             WHERE department_id = ? AND role != 'admin'
             ORDER BY fullname`,
            [departmentId]
        );
        
        console.log(`📋 /api/client/users/by-dept/${departmentId} - Returning ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('Error fetching client users by dept:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - All client users (fallback)
app.get('/api/client/users', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const [users] = await pool.query(
            `SELECT id, fullname, username, role, branch_id, department_id 
             FROM new_user 
             WHERE role != 'admin'
             ORDER BY fullname`
        );
        
        console.log(`📋 /api/client/users - Returning ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('Error fetching all client users:', error);
        res.status(500).json({ error: error.message });
    }
});
// 8. DELETE - Delete Requisition
app.delete('/api/requisitions/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const id = req.params.id;
        const [existing] = await pool.query(
            'SELECT id FROM requisitions WHERE id = ? OR requisition_number = ?', 
            [isNaN(id) ? 0 : parseInt(id), id]
        );
        
        if (existing.length > 0) {
            await pool.query('DELETE FROM requisition_items WHERE requisition_id = ?', [existing[0].id]);
            await pool.query('DELETE FROM requisitions WHERE id = ?', [existing[0].id]);
            console.log('✅ Requisition deleted:', existing[0].id);
            res.json({ success: true });
        } else { 
            res.status(404).json({ error: 'Not found' }); 
        }
    } catch (error) { 
        console.error('DELETE /api/requisitions/:id error:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// ============================================
// COMPUTER MONITORING - Optimized
// ============================================

// ✅ NEW: GET - Distinct Locations (fast, direct from DB)
app.get('/api/computers/locations', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        // Direct from MySQL - no Python dependency
        const [locations] = await pool.query(
            `SELECT DISTINCT location 
             FROM computer_monitoring 
             WHERE location IS NOT NULL AND location != '' 
             ORDER BY location ASC`
        );
        
        // Return as simple array of strings
        const locationList = locations.map(row => row.location);
        
        res.json(locationList);
        
    } catch (error) { 
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// GET - All Computers - OPTIMIZED (fast path for local DB)
app.get('/api/computers', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        // ✅ Check if Python is available with a quick health check
        let pythonAvailable = false;
        try {
            const healthCheck = await fetch('http://localhost:5000/api/health', {
                timeout: 1000 // Quick 1 second check
            });
            pythonAvailable = healthCheck.ok;
        } catch (e) {
            pythonAvailable = false;
        }
        
        // If Python is available, try to get data from it
        if (pythonAvailable) {
            try {
                const response = await fetch('http://localhost:5000/api/computers', {
                    headers: { 'Authorization': authHeader },
                    timeout: 5000
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Data from Python API');
                    return res.json(data);
                }
            } catch (pythonError) {
                console.log('⚠️ Python API failed, using local database');
            }
        } else {
            console.log('ℹ️ Python API not available, using local database directly');
        }
        
        // ✅ Direct from MySQL (fast - no timeout delay)
        const [computers] = await pool.query(
            `SELECT 
                id, 
                computer_name, 
                user_name, 
                location,
                department, 
                ip_address, 
                mac_address, 
                os, 
                bit, 
                ram, 
                storage, 
                processor, 
                antivirus, 
                ms_license_type, 
                DATE_FORMAT(license_activation, '%Y-%m-%d') as license_activation,
                license_duration,
                DATE_FORMAT(license_expiry, '%Y-%m-%d') as license_expiry,
                status, 
                DATE_FORMAT(last_checked, '%Y-%m-%d %H:%i:%s') as last_checked,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM computer_monitoring 
            ORDER BY INET_ATON(SUBSTRING_INDEX(ip_address, '/', 1))`
        );
        
        // Return in the format Angular expects
        res.json({
            success: true,
            count: computers.length,
            computers: computers
        });
        
    } catch (error) { 
        console.error('Error fetching computers:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// GET - Single Computer - OPTIMIZED
app.get('/api/computers/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        // ✅ Quick health check instead of waiting for timeout
        let pythonAvailable = false;
        try {
            const healthCheck = await fetch('http://localhost:5000/api/health', {
                timeout: 500
            });
            pythonAvailable = healthCheck.ok;
        } catch (e) {
            pythonAvailable = false;
        }
        
        if (pythonAvailable) {
            try {
                const response = await fetch(`http://localhost:5000/api/computers/${req.params.id}`, {
                    headers: { 'Authorization': authHeader },
                    timeout: 3000
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return res.json(data);
                }
            } catch (pythonError) {
                console.log('Python API not available for single computer');
            }
        }
        
        // Fallback to local DB
        const [computers] = await pool.query(
            `SELECT 
                id, computer_name, user_name, location, department, ip_address, mac_address,
                os, bit, ram, storage, processor, antivirus, ms_license_type,
                DATE_FORMAT(license_activation, '%Y-%m-%d') as license_activation,
                license_duration,
                DATE_FORMAT(license_expiry, '%Y-%m-%d') as license_expiry,
                status, last_checked, created_at
            FROM computer_monitoring WHERE id = ?`,
            [req.params.id]
        );
        
        if (computers.length === 0) {
            return res.status(404).json({ error: 'Computer not found' });
        }
        
        res.json({ success: true, computer: computers[0] });
        
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// POST - Trigger Network Scan
app.post('/api/computers/scan', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        // Try to call Python for scan
        try {
            const response = await fetch('http://localhost:5000/api/computers/scan', {
                method: 'POST',
                headers: { 'Authorization': authHeader },
                timeout: 3000
            });
            
            if (response.ok) {
                const data = await response.json();
                return res.json(data);
            }
        } catch (pythonError) {
            console.log('⚠️ Python scan service not available');
        }
        
        // If Python is not available, return a message
        res.json({ 
            success: false, 
            message: 'Python scanning service is not running. Please start computer_monitor.py on port 5000 for network scanning.' 
        });
        
    } catch (error) { 
        console.error('Scan trigger error:', error);
        res.status(500).json({ error: 'Python scanning service unavailable' }); 
    }
});

// GET - Expiring Licenses - OPTIMIZED
app.get('/api/computers/expiring', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        // ✅ Direct from MySQL (fast - no Python dependency needed for this)
        const [expiring] = await pool.query(
            `SELECT 
                id, computer_name, user_name, location, department, ip_address, 
                ms_license_type, license_expiry, status,
                DATEDIFF(license_expiry, CURDATE()) as days_remaining
            FROM computer_monitoring 
            WHERE license_expiry IS NOT NULL 
            AND license_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND license_expiry > CURDATE()
            ORDER BY license_expiry ASC`
        );
        
        const [expired] = await pool.query(
            `SELECT 
                id, computer_name, user_name, location, department, ip_address, 
                ms_license_type, license_expiry, status,
                DATEDIFF(CURDATE(), license_expiry) as days_expired
            FROM computer_monitoring 
            WHERE license_expiry IS NOT NULL 
            AND license_expiry <= CURDATE()
            ORDER BY license_expiry ASC`
        );
        
        res.json({ 
            success: true, 
            expiring: expiring, 
            expired: expired,
            expiring_count: expiring.length,
            expired_count: expired.length
        });
        
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// POST - Add Computer (direct to MySQL)
app.post('/api/computers', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { computer_name, user_name, location, department, ip_address, mac_address,
                os, bit, ram, storage, processor, antivirus,
                ms_license_type, license_activation, license_duration, license_expiry } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO computer_monitoring 
            (computer_name, user_name, location, department, ip_address, mac_address,
             os, bit, ram, storage, processor, antivirus,
             ms_license_type, license_activation, license_duration, license_expiry, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online')`,
            [computer_name, user_name, location, department, ip_address, mac_address,
             os, bit, ram, storage, processor, antivirus,
             ms_license_type, license_activation, license_duration, license_expiry]
        );
        
        res.json({ success: true, message: 'Computer added', id: result.insertId });
    } catch (error) { 
        console.error('Error adding computer:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// PUT - Update Computer
app.put('/api/computers/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { computer_name, user_name, location, department, ip_address, mac_address,
                os, bit, ram, storage, processor, antivirus,
                ms_license_type, license_activation, license_duration, license_expiry } = req.body;
        
        await pool.query(`UPDATE computer_monitoring SET
            computer_name=?, user_name=?, location=?, department=?, ip_address=?,
            mac_address=?, os=?, bit=?, ram=?, storage=?,
            processor=?, antivirus=?, ms_license_type=?,
            license_activation=?, license_duration=?, license_expiry=?
            WHERE id=?`,
            [computer_name, user_name, location, department, ip_address, mac_address,
             os, bit, ram, storage, processor, antivirus,
             ms_license_type, license_activation, license_duration, license_expiry, req.params.id]
        );
        
        res.json({ success: true, message: 'Computer updated' });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// DELETE - Delete Computer
app.delete('/api/computers/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        await pool.query('DELETE FROM computer_monitoring WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Computer deleted' });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// GET - Dashboard Statistics - OPTIMIZED (direct from DB, no Python needed)
app.get('/api/computers/dashboard/stats', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        // ✅ Direct from MySQL - statistics don't need Python
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_computers,
                SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
                SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_count,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count,
                SUM(CASE WHEN ms_license_type IS NOT NULL THEN 1 ELSE 0 END) as licensed_count,
                SUM(CASE WHEN license_expiry IS NOT NULL AND license_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND license_expiry > CURDATE() THEN 1 ELSE 0 END) as expiring_soon,
                SUM(CASE WHEN license_expiry IS NOT NULL AND license_expiry <= CURDATE() THEN 1 ELSE 0 END) as expired_count,
                DATE_FORMAT(MAX(last_checked), '%Y-%m-%d %H:%i:%s') as last_scan_time
            FROM computer_monitoring
        `);
        
        res.json({ success: true, stats: stats[0] });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});
// ============================================
// KNOWLEDGE BASE ROUTES
// ============================================

// GET - All knowledge base articles
app.get('/api/knowledge-base', async (req, res) => {
    try {
        const [articles] = await pool.query(
            `SELECT id, title, category, summary, content, featured, 
                    author_name, views, helpful_yes, helpful_no,
                    created_at, updated_at
             FROM knowledge_base 
             ORDER BY featured DESC, updated_at DESC`
        );
        res.json(articles);
    } catch (error) {
        console.error('Error loading knowledge base:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Single article
app.get('/api/knowledge-base/:id', async (req, res) => {
    try {
        const [articles] = await pool.query(
            'SELECT * FROM knowledge_base WHERE id = ?',
            [req.params.id]
        );
        
        if (articles.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        // Increment view count
        await pool.query(
            'UPDATE knowledge_base SET views = views + 1 WHERE id = ?',
            [req.params.id]
        );
        
        res.json(articles[0]);
    } catch (error) {
        console.error('Error loading article:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Create article
app.post('/api/knowledge-base', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const { title, category, summary, content, featured } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO knowledge_base (title, category, summary, content, featured, author_name)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, category, summary, content, featured || false, decoded.fullname || decoded.username]
        );
        
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update article
app.put('/api/knowledge-base/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { title, category, summary, content, featured } = req.body;
        
        await pool.query(
            `UPDATE knowledge_base 
             SET title = ?, category = ?, summary = ?, content = ?, featured = ?, updated_at = NOW()
             WHERE id = ?`,
            [title, category, summary, content, featured || false, req.params.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete article
app.delete('/api/knowledge-base/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        await pool.query('DELETE FROM knowledge_base WHERE id = ?', [req.params.id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Vote on article (helpful yes/no)
app.post('/api/knowledge-base/:id/vote', async (req, res) => {
    try {
        const { type } = req.body;
        
        if (type === 'yes') {
            await pool.query('UPDATE knowledge_base SET helpful_yes = helpful_yes + 1 WHERE id = ?', [req.params.id]);
        } else if (type === 'no') {
            await pool.query('UPDATE knowledge_base SET helpful_no = helpful_no + 1 WHERE id = ?', [req.params.id]);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Seed default articles
app.post('/api/knowledge-base/seed', async (req, res) => {
    try {
        // Check if articles already exist
        const [existing] = await pool.query('SELECT COUNT(*) as count FROM knowledge_base');
        if (existing[0].count > 0) {
            return res.json({ success: true, message: 'Articles already exist' });
        }
        
        const defaultArticles = [
            {
                title: 'How to Submit a Support Ticket',
                category: 'getting-started',
                featured: true,
                summary: 'Learn how to create and submit tickets for IT support.',
                content: '<h4>Step-by-Step Guide</h4><ol><li>Navigate to My Tickets</li><li>Click New Ticket</li><li>Fill in the details</li><li>Submit</li></ol>',
                author_name: 'IT Support Team'
            },
            {
                title: 'Understanding Ticket Statuses',
                category: 'tickets',
                summary: 'Learn what each ticket status means.',
                content: '<h4>Ticket Lifecycle</h4><ul><li>New - Just submitted</li><li>Assigned - Given to technician</li><li>In Progress - Being worked on</li><li>Resolved - Fixed</li></ul>',
                author_name: 'IT Admin'
            },
            {
                title: 'Frequently Asked Questions',
                category: 'faq',
                summary: 'Quick answers to common questions.',
                content: '<h4>Common Questions</h4><p><strong>Q: How do I check ticket status?</strong></p><p>A: Go to My Tickets.</p>',
                author_name: 'IT Support Team'
            }
        ];
        
        for (const article of defaultArticles) {
            await pool.query(
                `INSERT INTO knowledge_base (title, category, summary, content, featured, author_name)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [article.title, article.category, article.summary, article.content, article.featured || false, article.author_name]
            );
        }
        
        res.json({ success: true, message: 'Default articles created' });
    } catch (error) {
        console.error('Error seeding articles:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// Python Proxy - Only for scan & license check
// ============================================
// Only proxy computer monitoring routes to Python
app.use('/api/computers', (req, res, next) => {
    // Check if it's a route that Python handles (scan, check-license, expiring)
    const pythonRoutes = ['scan', 'check-license', 'expiring', 'dashboard'];
    const shouldProxy = pythonRoutes.some(route => req.path.includes(route));
    
    if (shouldProxy || req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        // Proxy to Python for computer operations
        return createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
            onError: (err, req, res) => {
                console.error('Python proxy error:', err);
                res.status(500).json({ error: 'Python scanning service unavailable' });
            }
        })(req, res, next);
    }
    next();
});
// ============================================
// SYSTEM SETTINGS API - Updated
// ============================================

// GET - All Settings
app.get('/api/admin/settings', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
         const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager',];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const [rows] = await pool.query('SELECT settings_key, settings_value FROM system_settings');
        
        const settings = {};
        rows.forEach(row => {
            if (row.settings_key === 'logo') {
                // Don't try to JSON parse the logo - it's stored as a plain string
                settings[row.settings_key] = row.settings_value;
            } else {
                try {
                    settings[row.settings_key] = JSON.parse(row.settings_value);
                } catch {
                    settings[row.settings_key] = row.settings_value;
                }
            }
        });
        
        res.json(settings);
    } catch (error) {
        console.error('GET /api/admin/settings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Save Settings
app.post('/api/admin/settings', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const settings = req.body;
        const userId = decoded.id;
        
        // Save each settings category (excluding logo)
        const categories = ['general', 'notification', 'security', 'monitoring', 'appearance', 'backup'];
        
        for (const category of categories) {
            if (settings[category]) {
                const value = settings[category];
                await pool.query(
                    `INSERT INTO system_settings (settings_key, settings_value, updated_by) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE settings_value = VALUES(settings_value), updated_by = VALUES(updated_by)`,
                    [category, JSON.stringify(value), userId]
                );
            }
        }
        
        // Save logo separately - store as plain string, not JSON
        if (settings.logo) {
            await pool.query(
                `INSERT INTO system_settings (settings_key, settings_value, updated_by) 
                 VALUES ('logo', ?, ?) 
                 ON DUPLICATE KEY UPDATE settings_value = VALUES(settings_value), updated_by = VALUES(updated_by)`,
                [settings.logo, userId]  // Store as-is, don't JSON.stringify
            );
        }
        
        console.log('✅ Settings saved by user:', userId);
        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        console.error('POST /api/admin/settings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Upload Logo (using multer)
app.post('/api/admin/upload-logo', uploadLogo.single('logo'), async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
         const allowedRoles = ['admin', 'head/manager', 'head manager', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        // Get the relative path for storage
        const logoUrl = '/uploads/logos/' + req.file.filename;
        
        // Store file path in database
        await pool.query(
            `INSERT INTO system_settings (settings_key, settings_value, updated_by) 
             VALUES ('logo', ?, ?) 
             ON DUPLICATE KEY UPDATE settings_value = VALUES(settings_value), updated_by = VALUES(updated_by)`,
            [logoUrl, decoded.id]
        );
        
        console.log('✅ Logo uploaded by user:', decoded.id, 'File:', req.file.filename);
        res.json({ 
            success: true, 
            logoUrl: logoUrl, 
            message: 'Logo uploaded successfully' 
        });
    } catch (error) {
        console.error('POST /api/admin/upload-logo error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Remove Logo
app.delete('/api/admin/remove-logo', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
         const allowedRoles = ['admin', 'head/manager', 'head manager', 'branch manager',];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        // Get current logo path from database
        const [rows] = await pool.query(
            "SELECT settings_value FROM system_settings WHERE settings_key = 'logo'"
        );
        
        // Delete the physical file if it exists
        if (rows.length > 0 && rows[0].settings_value) {
            const filepath = path.join(__dirname, rows[0].settings_value);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log('✅ Logo file deleted:', filepath);
            }
        }
        
        // Remove logo from system_settings
        await pool.query(
            `UPDATE system_settings SET settings_value = NULL, updated_by = ? WHERE settings_key = 'logo'`,
            [decoded.id]
        );
        
        console.log('✅ Logo removed by user:', decoded.id);
        res.json({ success: true, message: 'Logo removed successfully' });
    } catch (error) {
        console.error('DELETE /api/admin/remove-logo error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Public Settings (for client dashboard)
app.get('/api/public/settings', async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT settings_key, settings_value FROM system_settings WHERE settings_key IN ('general', 'appearance', 'logo')"
        );
        
        const settings = {};
        rows.forEach(row => {
            if (row.settings_key === 'logo') {
                // Logo is stored as a plain string (file path)
                // Don't try to JSON parse it
                settings[row.settings_key] = row.settings_value;
            } else {
                try {
                    settings[row.settings_key] = JSON.parse(row.settings_value);
                } catch {
                    settings[row.settings_key] = row.settings_value;
                }
            }
        });
        
        res.json(settings);
    } catch (error) {
        console.error('GET /api/public/settings error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// BRANCH MANAGEMENT API
// ============================================

// GET - All Branches
app.get('/api/admin/branches', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager', 'technician'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const [rows] = await pool.query(
            'SELECT id, name, company_name, registration_key, address, is_active, created_at, updated_at FROM branches ORDER BY name'
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/admin/branches error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Single Branch
app.get('/api/admin/branches/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager', 'Technician'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const [rows] = await pool.query(
            'SELECT id, name, company_name, registration_key, address, is_active, created_at, updated_at FROM branches WHERE id = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('GET /api/admin/branches/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Create Branch
app.post('/api/admin/branches', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
       const allowedRoles = ['admin', 'head/manager', 'head manager',  'branch manager', ];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const { name, company_name, registration_key, address, is_active } = req.body;
        
        // Check if registration_key already exists
        const [existing] = await pool.query(
            'SELECT id FROM branches WHERE registration_key = ?',
            [registration_key]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                error: 'Registration key already exists' 
            });
        }
        
        const [result] = await pool.query(
            `INSERT INTO branches (name, company_name, registration_key, address, is_active, created_by) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, company_name || null, registration_key, address || '', is_active !== false, decoded.id]
        );
        
        const [newBranch] = await pool.query(
            'SELECT id, name, company_name, registration_key, address, is_active, created_at FROM branches WHERE id = ?',
            [result.insertId]
        );
        
        console.log(`✅ Branch created: ${name} by user ${decoded.id}`);
        res.status(201).json(newBranch[0]);
    } catch (error) {
        console.error('POST /api/admin/branches error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update Branch
app.put('/api/admin/branches/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const { name, company_name, registration_key, address, is_active } = req.body;
        const branchId = req.params.id;
        
        // Check if branch exists
        const [existing] = await pool.query(
            'SELECT id FROM branches WHERE id = ?',
            [branchId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }
        
        // Check if registration_key already exists (excluding current branch)
        const [duplicate] = await pool.query(
            'SELECT id FROM branches WHERE registration_key = ? AND id != ?',
            [registration_key, branchId]
        );
        
        if (duplicate.length > 0) {
            return res.status(400).json({ 
                error: 'Registration key already exists' 
            });
        }
        
        await pool.query(
            `UPDATE branches 
             SET name = ?, company_name = ?, registration_key = ?, address = ?, is_active = ?, updated_by = ? 
             WHERE id = ?`,
            [name, company_name || null, registration_key, address || '', is_active !== false, decoded.id, branchId]
        );
        
        const [updatedBranch] = await pool.query(
            'SELECT id, name, company_name, registration_key, address, is_active, updated_at FROM branches WHERE id = ?',
            [branchId]
        );
        
        console.log(`✅ Branch updated: ${name} by user ${decoded.id}`);
        res.json(updatedBranch[0]);
    } catch (error) {
        console.error('PUT /api/admin/branches/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete Branch
app.delete('/api/admin/branches/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
       const allowedRoles = ['admin', 'head/manager', 'head manager', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const branchId = req.params.id;
        
        // Check if branch exists
        const [existing] = await pool.query(
            'SELECT id, name FROM branches WHERE id = ?',
            [branchId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }
        
        // Check if branch has users
        const [users] = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE branch_id = ?',
            [branchId]
        );
        
        if (users[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete branch with existing users. Reassign users first.' 
            });
        }
        
        // Check if branch has departments
        const [departments] = await pool.query(
            'SELECT COUNT(*) as count FROM departments WHERE branch_id = ?',
            [branchId]
        );
        
        if (departments[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete branch with existing departments. Reassign departments first.' 
            });
        }
        
        await pool.query(
            'DELETE FROM branches WHERE id = ?',
            [branchId]
        );
        
        console.log(`✅ Branch deleted: ${existing[0].name} by user ${decoded.id}`);
        res.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/admin/branches/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PUBLIC API - Get branches with departments
// ============================================
app.get('/api/public/branches', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, company_name, registration_key, address 
             FROM branches 
             WHERE is_active = 1 
             ORDER BY name`
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/public/branches error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Validate Registration Key (for registration)
app.post('/api/public/validate-key', async (req, res) => {
    try {
        const { registration_key } = req.body;
        
        if (!registration_key) {
            return res.status(400).json({ error: 'Registration key is required' });
        }
        
        const [rows] = await pool.query(
            'SELECT id, name, company_name FROM branches WHERE registration_key = ? AND is_active = 1',
            [registration_key]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or inactive registration key' });
        }
        
        res.json({ 
            valid: true, 
            branch_id: rows[0].id,
            branch_name: rows[0].name,
            company_name: rows[0].company_name
        });
    } catch (error) {
        console.error('POST /api/public/validate-key error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PUBLIC API - Get departments by branch
// ============================================
app.get('/api/public/branches/:branchId/departments', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name 
             FROM departments 
             WHERE branch_id = ? 
             ORDER BY name`,
            [req.params.branchId]
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/public/branches/:branchId/departments error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// PUBLIC API - Get roles by department
// ============================================
app.get('/api/public/departments/:departmentId/roles', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, role_name, role_value, role_description 
             FROM department_roles 
             WHERE department_id = ? 
             ORDER BY role_name`,
            [req.params.departmentId]
        );
        
        console.log(`✅ Roles loaded for department ${req.params.departmentId}:`, rows.length);
        res.json(rows);
    } catch (error) {
        console.error('GET /api/public/departments/:departmentId/roles error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// DATABASE MANAGEMENT API
// ============================================

// GET - Database Info (tables, sizes, etc.)
app.get('/api/admin/database/info', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
       const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const [tables] = await pool.query(`
            SELECT 
                TABLE_NAME as \`name\`,
                TABLE_ROWS as \`rows\`,
                ROUND((DATA_LENGTH + INDEX_LENGTH)/1024, 1) as \`size\`,
                ENGINE as \`engine\`
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'edptech_helpdesk'
            ORDER BY TABLE_NAME
        `);
        
        const totalRows = tables.reduce((sum, t) => sum + (t.rows || 0), 0);
        const totalSize = tables.reduce((sum, t) => sum + (parseFloat(t.size) || 0), 0);
        
        res.json({
            tables: tables,
            totalTables: tables.length,
            totalRows: totalRows,
            size: totalSize.toFixed(1) + ' KiB',
            status: 'connected'
        });
    } catch (error) {
        console.error('GET /api/admin/database/info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Verify password without generating new token
app.post('/api/auth/verify-password', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const { password } = req.body;
        const username = decoded.username;
        const userTable = decoded.userTable || 'users';
        
        // Find user in their table
        const [users] = await pool.query(
            `SELECT password FROM ${userTable} WHERE username = ?`,
            [username]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const isValid = await bcrypt.compare(password, users[0].password);
        
        if (isValid) {
            res.json({ success: true, message: 'Password verified' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid password' });
        }
    } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// POST - Optimize specific table
app.post('/api/admin/database/optimize/:table', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        await pool.query(`OPTIMIZE TABLE \`${req.params.table}\``);
        res.json({ success: true, message: 'Table optimized' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Repair specific table
app.post('/api/admin/database/repair/:table', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        await pool.query(`REPAIR TABLE \`${req.params.table}\``);
        res.json({ success: true, message: 'Table repaired' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Truncate specific table
app.post('/api/admin/database/truncate/:table', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        await pool.query(`TRUNCATE TABLE \`${req.params.table}\``);
        res.json({ success: true, message: 'Table truncated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Optimize all tables
app.post('/api/admin/database/optimize-all', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Access denied.' });
}
        
        const [tables] = await pool.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'edptech_helpdesk'`
        );
        
        for (const table of tables) {
            await pool.query(`OPTIMIZE TABLE \`${table.TABLE_NAME}\``);
        }
        
        res.json({ success: true, message: 'All tables optimized' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ══════════════════════════════════════════════════════════════════════════
//  CCTV API ROUTES — paste this block into your existing server.js
//  Place it just before the app.listen() call at the bottom.
//
//  These routes connect to:
//    • MySQL  (cctv_cameras, cctv_dvr, cctv_chargers, cctv_changelog)
//    • Python stream server on http://localhost:5001
// ══════════════════════════════════════════════════════════════════════════

const PYTHON_STREAM = 'http://localhost:5001';

// ── Auth helper (reuses your existing JWT setup) ─────────────────────────
function verifyToken(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) { res.status(401).json({ error: 'No token provided' }); return null; }
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, 'secret_key');
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
//  CAMERAS  /api/cctv
// ═══════════════════════════════════════════════════════════

// GET cameras with location info
app.get('/api/cctv', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [rows] = await pool.query(
      `SELECT c.*, l.name AS location, l.monitor_number
       FROM cctv_cameras c
       LEFT JOIN cctv_locations l ON c.location_id = l.id
       ORDER BY l.name, c.id`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// GET  /api/cctv/:id  — single camera
app.get('/api/cctv/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM cctv_cameras WHERE id = ?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/cctv  — add camera
app.post('/api/cctv', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const {
    location, ip_address, rtsp_url, mjpeg_port,
    type, resolution, frame_rate, storage_days,
    status, dvr_id, installed_date, last_maintained, notes
  } = req.body;

  if (!location || !ip_address) {
    return res.status(400).json({ error: 'location and ip_address are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO cctv_cameras
         (location, ip_address, rtsp_url, mjpeg_port, type, resolution,
          frame_rate, storage_days, status, dvr_id,
          installed_date, last_maintained, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        location, ip_address, rtsp_url || null,
        mjpeg_port || 80, type || null, resolution || null,
        frame_rate || 25, storage_days || 30,
        status || 'active', dvr_id || null,
        installed_date || null, last_maintained || null, notes || null
      ]
    );

   async function logActivity(type, item, description, performed_by, before_value = null, after_value = null) {
  await pool.query(
    `INSERT INTO cctv_changelog (type, item, description, before_value, after_value, performed_by, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [type, item, description, before_value, after_value, performed_by, new Date()]
  );
}

// Example usage in camera add:
await logActivity('camera_added', location, 'New camera installed', decoded.username);

    // Ping Python health check (non-blocking)
    fetch(`${PYTHON_STREAM}/health/${result.insertId}`).catch(() => {});

    res.json({ success: true, id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT  /api/cctv/:id  — update camera
app.put('/api/cctv/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const fields = [
    'location','ip_address','rtsp_url','mjpeg_port','type',
    'resolution','frame_rate','storage_days','status',
    'dvr_id','installed_date','last_maintained','notes'
  ];
  const sets = [], values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { sets.push(`${f} = ?`); values.push(req.body[f]); }
  });
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  try {
    await pool.query(`UPDATE cctv_cameras SET ${sets.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/cctv/:id
app.delete('/api/cctv/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [cam] = await pool.query('SELECT location FROM cctv_cameras WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM cctv_cameras WHERE id = ?', [req.params.id]);
    if (cam.length) {
      await pool.query(
        `INSERT INTO cctv_changelog (type, item, description, performed_by)
         VALUES ('other', ?, 'Camera removed from system', ?)`,
        [cam[0].location, decoded.username || 'Admin']
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/cctv/stream-url/:id  — returns safe stream URL for Angular
// Angular uses this to get the Python stream URL without hardcoding port
app.get('/api/cctv/stream-url/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [rows] = await pool.query(
      'SELECT id, ip_address, rtsp_url, mjpeg_port, status FROM cctv_cameras WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const cam = rows[0];
    // Return the Python MJPEG stream URL — Angular <img> points here
    const streamUrl = `${PYTHON_STREAM}/stream/${cam.id}`;
    res.json({ stream_url: streamUrl, status: cam.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/cctv/health/all  — proxy to Python health poller
app.get('/api/cctv/health/all', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const resp = await fetch(`${PYTHON_STREAM}/health/all`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Python stream server unavailable', detail: e.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  DVR  /api/dvr
// ═══════════════════════════════════════════════════════════

app.get('/api/dvr', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [rows] = await pool.query('SELECT * FROM cctv_dvr ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/dvr', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const {
    name, ip_address, model, location, channels,
    used_channels, status, firmware_version, storage_tb,
    installed_date, notes
  } = req.body;
  if (!name || !ip_address) return res.status(400).json({ error: 'name and ip_address required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO cctv_dvr
         (name, ip_address, model, location, channels, used_channels,
          status, firmware_version, storage_tb, installed_date, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        name, ip_address, model || null, location || null,
        channels || 16, used_channels || 0,
        status || 'online', firmware_version || null,
        storage_tb || null, installed_date || null, notes || null
      ]
    );
    await pool.query(
      `INSERT INTO cctv_changelog (type, item, description, performed_by)
       VALUES ('dvr_added', ?, 'New DVR unit installed', ?)`,
      [name, decoded.username || 'Admin']
    );
    res.json({ success: true, id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/dvr/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const fields = [
    'name','ip_address','model','location','channels',
    'used_channels','status','firmware_version','storage_tb',
    'installed_date','notes'
  ];
  const sets = [], values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { sets.push(`${f} = ?`); values.push(req.body[f]); }
  });
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  try {
    await pool.query(`UPDATE cctv_dvr SET ${sets.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/dvr/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    await pool.query('DELETE FROM cctv_dvr WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  CHARGERS  /api/chargers
// ═══════════════════════════════════════════════════════════

app.get('/api/chargers', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [rows] = await pool.query('SELECT * FROM cctv_chargers ORDER BY label');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chargers', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const {
    label, device_type, connected_to, ip_address,
    watts, status, installed_date, last_checked, notes
  } = req.body;
  if (!label) return res.status(400).json({ error: 'label required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO cctv_chargers
         (label, device_type, connected_to, ip_address, watts,
          status, installed_date, last_checked, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        label, device_type || null, connected_to || null,
        ip_address || null, watts || null,
        status || 'ok', installed_date || null,
        last_checked || null, notes || null
      ]
    );
    await pool.query(
      `INSERT INTO cctv_changelog (type, item, description, performed_by)
       VALUES ('charger_added', ?, 'New power device added', ?)`,
      [label, decoded.username || 'Admin']
    );
    res.json({ success: true, id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/chargers/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const fields = [
    'label','device_type','connected_to','ip_address',
    'watts','status','installed_date','last_checked','notes'
  ];
  const sets = [], values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { sets.push(`${f} = ?`); values.push(req.body[f]); }
  });
  if (!sets.length) return res.status(400).json({ error: 'No fields' });
  values.push(req.params.id);
  try {
    await pool.query(`UPDATE cctv_chargers SET ${sets.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/chargers/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    await pool.query('DELETE FROM cctv_chargers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  CHANGE LOG  /api/changelog
// ═══════════════════════════════════════════════════════════

app.get('/api/changelog', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM cctv_changelog ORDER BY date DESC LIMIT 500'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/changelog', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const {
    type, item, description, before_value,
    after_value, performed_by, date
  } = req.body;
  if (!item || !description) return res.status(400).json({ error: 'item and description required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO cctv_changelog
         (type, item, description, before_value, after_value, performed_by, date, user_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        type || 'other', item, description,
        before_value || null, after_value || null,
        performed_by || decoded.username || 'Admin',
        date ? new Date(date) : new Date(),
        decoded.id || null
      ]
    );
    res.json({ success: true, id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/changelog/:id', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    await pool.query('DELETE FROM cctv_changelog WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// List all locations
app.get('/api/locations', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  try {
    const [rows] = await pool.query('SELECT * FROM cctv_locations ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add location
app.post('/api/locations', async (req, res) => {
  const decoded = verifyToken(req, res); if (!decoded) return;
  const { name, monitor_number, notes } = req.body;
  if (!name || !monitor_number) return res.status(400).json({ error: 'name and monitor_number required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO cctv_locations (name, monitor_number, notes) VALUES (?, ?, ?)',
      [name, monitor_number, notes || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// ============================================
// UPDATED CHAT MESSAGES API
// ============================================

// GET - Messages between two users (using usernames)
app.get('/api/messages/:username', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const currentUsername = decoded.username;
        const otherUsername = req.params.username;
        
        const [messages] = await pool.query(
            `SELECT * FROM chat_messages 
             WHERE (from_username = ? AND to_username = ?) 
                OR (from_username = ? AND to_username = ?)
             ORDER BY timestamp ASC`,
            [currentUsername, otherUsername, otherUsername, currentUsername]
        );
        
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Send a message (with file upload and reply support)
app.post('/api/messages', uploadChat.single('file'), async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const { to_username, message, reply_to_id, reply_to_message, reply_to_username } = req.body;
        const from_username = decoded.username;
        
        if (!to_username) {
            return res.status(400).json({ error: 'Missing to_username' });
        }
        
        if (!message && !req.file) {
            return res.status(400).json({ error: 'Message or file is required' });
        }
        
        // Find the target user
        let to_user_id = null;
        let to_user_table = 'users';
        
        const [userRows] = await pool.query('SELECT id FROM users WHERE username = ?', [to_username]);
        if (userRows.length > 0) {
            to_user_id = userRows[0].id;
            to_user_table = 'users';
        } else {
            const [clientRows] = await pool.query('SELECT id FROM new_user WHERE username = ?', [to_username]);
            if (clientRows.length > 0) {
                to_user_id = clientRows[0].id;
                to_user_table = 'new_user';
            }
        }
        
        if (!to_user_id) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get from_user_id
        let from_user_id = null;
        let from_user_table = 'users';
        const [fromUserRows] = await pool.query('SELECT id FROM users WHERE username = ?', [from_username]);
        if (fromUserRows.length > 0) {
            from_user_id = fromUserRows[0].id;
            from_user_table = 'users';
        } else {
            const [fromClientRows] = await pool.query('SELECT id FROM new_user WHERE username = ?', [from_username]);
            if (fromClientRows.length > 0) {
                from_user_id = fromClientRows[0].id;
                from_user_table = 'new_user';
            }
        }
        
        // File info
        let file_url = null;
        let file_name = null;
        let file_type = null;
        
        if (req.file) {
            file_url = '/uploads/chat/' + req.file.filename;
            file_name = req.file.originalname;
            file_type = req.file.mimetype;
        }
        
        const [result] = await pool.query(
            `INSERT INTO chat_messages (
                from_user_id, to_user_id, from_username, to_username, 
                from_user_table, to_user_table, message, 
                file_url, file_name, file_type,
                reply_to_id, reply_to_message, reply_to_username,
                timestamp, is_read
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)`,
            [
                from_user_id, to_user_id, from_username, to_username,
                from_user_table, to_user_table, message || '',
                file_url, file_name, file_type,
                reply_to_id || null, reply_to_message || null, reply_to_username || null
            ]
        );
        
        console.log('Message sent successfully, ID:', result.insertId);
        if (req.file) {
            console.log('File uploaded:', req.file.filename);
        }

        // ── 🔔 CREATE NOTIFICATION FOR THE RECIPIENT ──────────────────
        try {
            const notifMessage = message 
                ? `New message from ${from_username}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`
                : `New file from ${from_username}: 📎 ${req.file.originalname}`;
            
            await pool.query(
                `INSERT INTO notifications (user_id, user_table, username, title, message, type, link, is_read, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
                [
                    to_user_id,
                    to_user_table,
                    to_username,
                    '💬 New Message',
                    notifMessage,
                    'message',
                    '/chat',
                ]
            );
            console.log('✅ Notification created for recipient:', to_username);
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }
        // ──────────────────────────────────────────────────────────────
        
        res.json({ success: true, id: result.insertId, file_url });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete a specific message
app.delete('/api/messages/:messageId', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const messageId = req.params.messageId;
        
        // Only allow deletion of own messages
        const [message] = await pool.query(
            'SELECT * FROM chat_messages WHERE id = ? AND from_username = ?',
            [messageId, decoded.username]
        );
        
        if (message.length === 0) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }
        
        // Delete the file if exists
        if (message[0].file_url) {
            const filePath = path.join(__dirname, message[0].file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Deleted file:', filePath);
            }
        }
        
        await pool.query('DELETE FROM chat_messages WHERE id = ?', [messageId]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete entire conversation
app.delete('/api/conversation/:username', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const currentUsername = decoded.username;
        const otherUsername = req.params.username;
        
        // Get all messages with files to delete
        const [messages] = await pool.query(
            `SELECT * FROM chat_messages 
             WHERE (from_username = ? AND to_username = ?) 
                OR (from_username = ? AND to_username = ?)
                AND file_url IS NOT NULL`,
            [currentUsername, otherUsername, otherUsername, currentUsername]
        );
        
        // Delete associated files
        messages.forEach(msg => {
            if (msg.file_url) {
                const filePath = path.join(__dirname, msg.file_url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted file:', filePath);
                }
            }
        });
        
        // Delete all messages in the conversation
        await pool.query(
            `DELETE FROM chat_messages 
             WHERE (from_username = ? AND to_username = ?) 
                OR (from_username = ? AND to_username = ?)`,
            [currentUsername, otherUsername, otherUsername, currentUsername]
        );
        
        console.log(`Conversation between ${currentUsername} and ${otherUsername} deleted`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - Unread messages count
app.get('/api/messages/unread/:username', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const [count] = await pool.query(
            `SELECT from_username, COUNT(*) as count FROM chat_messages 
             WHERE to_username = ? AND is_read = 0 
             GROUP BY from_username`,
            [req.params.username]
        );
        res.json(count);
    } catch (error) {
        console.error('Error loading unread counts:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Last message for each conversation
app.get('/api/messages/last/:username', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const [messages] = await pool.query(
            `SELECT DISTINCT 
                CASE WHEN from_username = ? THEN to_username ELSE from_username END as username,
                message, timestamp
             FROM chat_messages 
             WHERE from_username = ? OR to_username = ?
             ORDER BY timestamp DESC`,
            [req.params.username, req.params.username, req.params.username]
        );
        
        // Process to get unique conversations (latest message only)
        const uniqueMessages = [];
        const seenKeys = new Set();
        
        for (const msg of messages) {
            if (!seenKeys.has(msg.username)) {
                seenKeys.add(msg.username);
                uniqueMessages.push(msg);
            }
        }
        
        res.json(uniqueMessages);
    } catch (error) {
        console.error('Error loading last messages:', error);
        res.status(500).json({ error: error.message });
    }
});
// PUT - Mark messages as read
app.put('/api/messages/read/:fromUsername', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        await pool.query(
            `UPDATE chat_messages SET is_read = 1 
             WHERE from_username = ? AND to_username = ? AND is_read = 0`,
            [req.params.fromUsername, decoded.username]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/notifications', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC LIMIT 50',
            [decoded.username]
        );
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const id = req.params.id.replace('srv_', ''); // Remove prefix if present
        
        await pool.query(
            'DELETE FROM notifications WHERE id = ? AND username = ?',
            [id, decoded.username]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ============ CLIENT NOTIFICATION ROUTES ============
// POST - Save requisition notification for branch+department users
app.post('/api/client-notifications/requisition', async (req, res) => {
    try {
        const { branch_id, department_id, type, title, message, ticket_number, exclude_user_id } = req.body;
        
        if (!branch_id || !department_id) {
            return res.status(400).json({ error: 'branch_id and department_id are required' });
        }
        
        // Build the query string
        let userQuery = 'SELECT id FROM users WHERE branch_id = ? AND department_id = ? AND (role = ? OR role = ? OR role = ? OR role = ?)';
        let userParams = [branch_id, department_id, 'head/manager', 'supervisor', 'admin', 'Technician'];
        
        if (exclude_user_id) {
            userQuery += ' AND id != ?';
            userParams.push(exclude_user_id);
        }
        
        // Find all EDP/IT users in the target branch+department
        const [users] = await pool.query(userQuery, userParams);
        
        // Also check new_user table
        let newUserQuery = 'SELECT id FROM new_user WHERE branch_id = ? AND department_id = ?';
        let newUserParams = [branch_id, department_id];
        
        if (exclude_user_id) {
            newUserQuery += ' AND id != ?';
            newUserParams.push(exclude_user_id);
        }
        
        const [newUsers] = await pool.query(newUserQuery, newUserParams);
        
        const allUserIds = [...users.map((u) => u.id), ...newUsers.map((u) => u.id)];
        
        // Insert notification for each user
        let insertCount = 0;
        for (const userId of allUserIds) {
            await pool.query(
                'INSERT INTO client_notifications (user_id, type, title, message, ticket_number, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())',
                [userId, type || 'info', title, message, ticket_number || null]
            );
            insertCount++;
        }
        
        console.log('Saved ' + insertCount + ' requisition notifications for branch ' + branch_id + ', dept ' + department_id);
        res.json({ success: true, count: insertCount });
    } catch (error) {
        console.error('POST /api/client-notifications/requisition error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - Client notifications (filtered by user's branch+department)
app.get('/api/client-notifications/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        // Get user's branch and department
        let userBranchId = null;
        let userDeptId = null;
        
        const [userInfo] = await pool.query(
            'SELECT branch_id, department_id FROM users WHERE id = ?', [userId]
        );
        if (userInfo.length > 0) {
            userBranchId = userInfo[0].branch_id;
            userDeptId = userInfo[0].department_id;
        } else {
            const [newUserInfo] = await pool.query(
                'SELECT branch_id, department_id FROM new_user WHERE id = ?', [userId]
            );
            if (newUserInfo.length > 0) {
                userBranchId = newUserInfo[0].branch_id;
                userDeptId = newUserInfo[0].department_id;
            }
        }
        
        // Get notifications for this specific user
        const [notifications] = await pool.query(
            `SELECT * FROM client_notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );
        
        res.json(notifications);
    } catch (error) {
        console.error('GET /api/client-notifications/:userId error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Create a new client notification
app.post('/api/client-notifications', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const { user_id, type, title, message, ticket_id, ticket_number } = req.body;
        
        if (!user_id || !title) {
            return res.status(400).json({ error: 'user_id and title are required' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO client_notifications (user_id, type, title, message, ticket_id, ticket_number)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, type || 'info', title, message || null, ticket_id || null, ticket_number || null]
        );
        
        res.status(201).json({
            id: result.insertId,
            user_id,
            type: type || 'info',
            title,
            message,
            ticket_id,
            ticket_number,
            is_read: 0,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating client notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Mark notification as read
app.put('/api/client-notifications/:id/read', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const [result] = await pool.query(
            'UPDATE client_notifications SET is_read = 1 WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Delete a notification
app.delete('/api/client-notifications/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret_key');
        
        const id = req.params.id.replace('srv_', ''); // Remove prefix if present
        
        await pool.query('DELETE FROM client_notifications WHERE id = ?', [id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: error.message });
    }
});
// In your backend routes
app.post('/api/client-notifications/branch', async (req, res) => {
    try {
        const { branch_id, type, title, message, ticket_id, ticket_number, exclude_user_id } = req.body;
        
        // ✅ Get EDP/IT users ONLY in this specific branch
        const [edpUsers] = await pool.query(`
            SELECT id FROM users 
            WHERE branch_id = ? 
            AND (department LIKE '%EDP%' OR department LIKE '%IT%')
        `, [branch_id]);
        
        const [edpNewUsers] = await pool.query(`
            SELECT id FROM new_user 
            WHERE branch_id = ? 
            AND (department LIKE '%EDP%' OR department LIKE '%IT%')
        `, [branch_id]);
        
        let allEdpIds = [...edpUsers.map(u => u.id), ...edpNewUsers.map(u => u.id)];
        
        // ✅ Exclude the ticket creator
        if (exclude_user_id) {
            allEdpIds = allEdpIds.filter(id => id !== exclude_user_id);
        }
        
        // ✅ Also filter: only users whose branch_id matches (already done by SQL)
        console.log(`📢 Branch notification: branch ${branch_id}, notifying ${allEdpIds.length} EDP/IT users`);
        
        // Insert notification for each EDP/IT user
        for (const userId of allEdpIds) {
            await pool.query(`
                INSERT INTO client_notifications (user_id, type, title, message, ticket_id, ticket_number)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, type, title, message, ticket_id, ticket_number]);
        }
        
        res.json({ success: true, notified: allEdpIds.length });
    } catch (error) {
        console.error('Error saving branch notification:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - New users endpoint (for client users) - SINGLE VERSION
app.get('/api/new-users', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        
        try {
            jwt.verify(token, 'secret_key');
        } catch (jwtError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        const [users] = await pool.query(
            'SELECT id, username, fullname, email, role, department, avatar_color, photo_url, created_at FROM new_user ORDER BY fullname'
        );
        
        console.log('📋 /api/new-users - Returning', users.length, 'users');
        res.json(users);
    } catch (error) {
        console.error('Error loading new users:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SYSTEM LOGS API
// ============================================

// GET - Fetch system logs
app.get('/api/admin/logs', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        
        const [logs] = await pool.query(
            'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 500'
        );
        
        res.json(logs);
    } catch (error) {
        console.error('Error loading logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Clear all logs
app.delete('/api/admin/logs', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        
        await pool.query('TRUNCATE TABLE system_logs');
        
        res.json({ success: true, message: 'All logs cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to log system events
async function logSystemEvent(level, type, userId, userName, userTable, action, ip) {
    try {
        await pool.query(
            `INSERT INTO system_logs (level, type, user_id, user_name, user_table, action, ip_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [level, type, userId || null, userName || 'System', userTable || null, action, ip || null]
        );
    } catch (error) {
        console.error('Failed to log event:', error);
    }
}
// ============================================
// Department stats API
// ============================================
// GET - Department Statistics
app.get('/api/department-stats', async (req, res) => {
    try {
        // Verify token
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, 'secret_key');
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        const userId = decoded.id;
        
        // Get user info with department and branch names
        const [users] = await pool.query(
            `SELECT u.id, u.department_id, u.branch_id,
                    d.name as department_name, b.name as branch_name
             FROM new_user u
             LEFT JOIN departments d ON u.department_id = d.id
             LEFT JOIN branches b ON u.branch_id = b.id
             WHERE u.id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[0];
        const departmentId = user.department_id;
        const branchId = user.branch_id;
        
        console.log(`📊 Loading stats for User ${userId}, Dept ${departmentId}, Branch ${branchId}`);
        
        // ==================== FETCH ALL DATA ====================
        const [tickets] = await pool.query(
            'SELECT * FROM tickets WHERE department_id = ? AND branch_id = ?',
            [departmentId, branchId]
        );
        
        const [requisitions] = await pool.query(
            'SELECT * FROM requisitions WHERE department_id = ? AND branch_id = ?',
            [departmentId, branchId]
        );
        
        const [jobOrders] = await pool.query(
            'SELECT * FROM job_orders WHERE department_id = ? AND branch_id = ?',
            [departmentId, branchId]
        );
        
        console.log(`  Tickets: ${tickets.length}, Requisitions: ${requisitions.length}, Job Orders: ${jobOrders.length}`);
        
        // ==================== PROCESS TICKETS ====================
        const ticketStats = {
            total_tickets: tickets.length,
            open_tickets: 0,
            resolved_tickets: 0,
            pending_tickets: 0,
            new_tickets: 0,
            assigned_tickets: 0,
            in_progress_tickets: 0,
            closed_tickets: 0,
            critical_tickets: 0,
            high_tickets: 0,
            medium_tickets: 0,
            low_tickets: 0,
        };
        
        const resolvedTimes = [];
        
        tickets.forEach(ticket => {
            // Status counts
            if (ticket.status === 'new') ticketStats.new_tickets++;
            if (ticket.status === 'assigned') ticketStats.assigned_tickets++;
            if (ticket.status === 'in_progress') ticketStats.in_progress_tickets++;
            if (ticket.status === 'pending') ticketStats.pending_tickets++;
            if (ticket.status === 'resolved') ticketStats.resolved_tickets++;
            if (ticket.status === 'closed') ticketStats.closed_tickets++;
            
            // Open tickets
            if (!['resolved', 'closed'].includes(ticket.status)) {
                ticketStats.open_tickets++;
            }
            
            // Priority counts
            if (ticket.priority === 'critical') ticketStats.critical_tickets++;
            if (ticket.priority === 'high') ticketStats.high_tickets++;
            if (ticket.priority === 'medium') ticketStats.medium_tickets++;
            if (ticket.priority === 'low') ticketStats.low_tickets++;
            
            // Resolution time
            if (ticket.status === 'resolved' && ticket.resolved_at) {
                const created = new Date(ticket.created_at).getTime();
                const resolved = new Date(ticket.resolved_at).getTime();
                const hours = (resolved - created) / (1000 * 60 * 60);
                resolvedTimes.push(hours);
            }
        });
        
        // Calculate average resolution time
        let avgResolutionTime = 'N/A';
        if (resolvedTimes.length > 0) {
            const avgHours = resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length;
            if (avgHours < 1) {
                avgResolutionTime = Math.round(avgHours * 60) + ' mins';
            } else if (avgHours < 24) {
                avgResolutionTime = Math.round(avgHours) + ' hours';
            } else if (avgHours < 168) {
                avgResolutionTime = Math.round(avgHours / 24) + ' days';
            } else {
                avgResolutionTime = (avgHours / 24).toFixed(1) + ' days';
            }
        }
        
        // Calculate SLA compliance
        let slaCompliance = 0;
        if (resolvedTimes.length > 0) {
            const compliant = resolvedTimes.filter(hours => hours <= 24).length;
            slaCompliance = Math.round((compliant / resolvedTimes.length) * 100);
        }
        
        // ==================== PROCESS REQUISITIONS ====================
        const reqStats = {
            total_requisitions: requisitions.length,
            pending_requisitions: 0,
            approved_requisitions: 0,
            released_requisitions: 0,
            rejected_requisitions: 0,
            forwarded_requisitions: 0,
        };
        
        requisitions.forEach(req => {
            if (req.status === 'pending') reqStats.pending_requisitions++;
            if (req.status === 'approved') reqStats.approved_requisitions++;
            if (req.status === 'released') reqStats.released_requisitions++;
            if (req.status === 'rejected') reqStats.rejected_requisitions++;
            if (req.is_forwarded === 1 || req.status === 'forwarded') reqStats.forwarded_requisitions++;
        });
        
        // ==================== PROCESS JOB ORDERS ====================
        const joStats = {
            total_job_orders: jobOrders.length,
            pending_job_orders: 0,
            approved_job_orders: 0,
            assigned_job_orders: 0,
            forwarded_job_orders: 0,
            done_job_orders: 0,
            rejected_job_orders: 0,
        };
        
        jobOrders.forEach(jo => {
            if (jo.status === 'pending') joStats.pending_job_orders++;
            if (jo.status === 'approved' || jo.status === 'received') joStats.approved_job_orders++;
            if (jo.status === 'assigned') joStats.assigned_job_orders++;
            if (jo.status === 'forwarded' || jo.is_forwarded === 1) joStats.forwarded_job_orders++;
            if (jo.status === 'done') joStats.done_job_orders++;
            if (jo.status === 'rejected') joStats.rejected_job_orders++;
        });
        
        // ==================== WEEKLY TRENDS ====================
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        
        const weeklyTickets = [];
        const weeklyResolved = [];
        const weeklyRequisitions = [];
        const weeklyJobOrders = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Count tickets created
            const ticketCount = tickets.filter(t => {
                return new Date(t.created_at).toISOString().split('T')[0] === dateStr;
            }).length;
            
            // Count resolved tickets
            const resolvedCount = tickets.filter(t => {
                return t.status === 'resolved' && t.resolved_at && 
                       new Date(t.resolved_at).toISOString().split('T')[0] === dateStr;
            }).length;
            
            // Count requisitions
            const reqCount = requisitions.filter(r => {
                return new Date(r.created_at).toISOString().split('T')[0] === dateStr;
            }).length;
            
            // Count job orders
            const joCount = jobOrders.filter(j => {
                return new Date(j.created_at).toISOString().split('T')[0] === dateStr;
            }).length;
            
            weeklyTickets.push({ day: days[i], count: ticketCount });
            weeklyResolved.push({ day: days[i], count: resolvedCount });
            weeklyRequisitions.push({ day: days[i], count: reqCount });
            weeklyJobOrders.push({ day: days[i], count: joCount });
        }
        
        // ==================== BUILD RESPONSE ====================
        const response = {
            department: user.department_name || 'N/A',
            department_id: departmentId || 0,
            branch_id: branchId || 0,
            branch_name: user.branch_name || 'N/A',
            avg_resolution_time: avgResolutionTime,
            sla_compliance: slaCompliance,
            weekly_tickets: weeklyTickets,
            weekly_resolved: weeklyResolved,
            weekly_requisitions: weeklyRequisitions,
            weekly_job_orders: weeklyJobOrders,
            ...ticketStats,
            ...reqStats,
            ...joStats
        };
        
        console.log('✅ Department stats response ready');
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error in department-stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch department statistics',
            message: error.message 
        });
    }
});
// GET - System Status (Client View)
app.get('/api/system-status', async (req, res) => {
    try {
        // Verify token (but don't require admin - any authenticated user can see status)
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, 'secret_key');
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        const userId = decoded.id;
        const today = new Date().toISOString().split('T')[0];
        
        // Check database connection
        let dbStatus = 'operational';
        let dbLatency = 0;
        let apiLatency = 0;
        
        try {
            const start = Date.now();
            await pool.query('SELECT 1');
            dbLatency = Date.now() - start;
            apiLatency = dbLatency;
        } catch (err) {
            dbStatus = 'down';
        }
        
        // Get today's counts (overall system counts - not filtered by user)
        const [ticketCount] = await pool.query(
            "SELECT COUNT(*) as count FROM tickets WHERE DATE(created_at) = ?", 
            [today]
        );
        
        const [reqCount] = await pool.query(
            "SELECT COUNT(*) as count FROM requisitions WHERE DATE(created_at) = ?", 
            [today]
        );
        
        const [joCount] = await pool.query(
            "SELECT COUNT(*) as count FROM job_orders WHERE DATE(created_at) = ?", 
            [today]
        );
        
        // Get active users count
        const [activeUsers] = await pool.query(
            "SELECT COUNT(DISTINCT created_by) as count FROM tickets WHERE DATE(created_at) = ?",
            [today]
        );
        
        // Overall system status
        const overallStatus = dbStatus === 'operational' ? 'operational' : 'degraded';
        
        const response = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            services: {
                api: {
                    name: 'Helpdesk API',
                    status: 'operational',
                    latency: apiLatency,
                    lastChecked: new Date().toISOString(),
                    uptime: 99.9
                },
                database: {
                    name: 'Database',
                    status: dbStatus,
                    latency: dbLatency,
                    lastChecked: new Date().toISOString(),
                    uptime: dbStatus === 'operational' ? 99.9 : 95.0
                },
                email: {
                    name: 'Email Notifications',
                    status: 'operational',
                    latency: 120,
                    lastChecked: new Date().toISOString(),
                    uptime: 99.5
                },
                storage: {
                    name: 'File Storage',
                    status: 'operational',
                    latency: 65,
                    lastChecked: new Date().toISOString(),
                    uptime: 99.8
                }
            },
            metrics: {
                uptime: '30 days',
                response_time: apiLatency,
                active_users: activeUsers[0]?.count || 0,
                total_tickets_today: ticketCount[0]?.count || 0,
                total_requisitions_today: reqCount[0]?.count || 0,
                total_job_orders_today: joCount[0]?.count || 0
            },
            recent_incidents: []
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching system status:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST - Submit Feedback
app.post('/api/feedback', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, 'secret_key');
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        const userId = decoded.id;
        const { rating, category, subject, message, likes, improvements, contactOk } = req.body;
        
        // Validate required fields
        if (!rating || !category || !message || message.trim().length < 10) {
            return res.status(400).json({ error: 'Please fill in all required fields (rating, category, and message of at least 10 characters).' });
        }
        
        // Insert feedback into database
        // Note: Create a feedbacks table if it doesn't exist
        const [result] = await pool.query(
            `INSERT INTO feedbacks (user_id, rating, category, subject, message, likes, improvements, contact_ok, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                userId,
                rating,
                category,
                subject || '',
                message,
                JSON.stringify(likes || []),
                JSON.stringify(improvements || []),
                contactOk ? 1 : 0
            ]
        );
        
        console.log(`✅ Feedback submitted by user ${userId}, ID: ${result.insertId}`);
        
        res.json({ 
            success: true, 
            message: 'Feedback submitted successfully!',
            id: result.insertId 
        });
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
    }
});

// GET - Reports (Branch Manager or Head/Manager only)
app.get('/api/reports/:type', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        const userId = decoded.id;
        const reportType = req.params.type;
        const scope = req.query.scope || 'department';
        
        // Get user info
        const [users] = await pool.query(
            `SELECT u.id, u.department_id, u.branch_id, u.role, u.department,
                    b.name as branch_name, d.name as dept_name
             FROM new_user u
             LEFT JOIN branches b ON u.branch_id = b.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [userId]
        );
        
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        
        const user = users[0];
        const branchId = user.branch_id;
        const departmentId = user.department_id;
        const userRole = (user.role || '').toLowerCase().trim();
        
        // Verify permissions
        const isBranchManager = userRole === 'branch manager';
        const isHeadManager = userRole === 'head/manager' || userRole === 'head manager';
        
        if (!isBranchManager && !isHeadManager) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        
        // Determine scope
        const isBranchScope = scope === 'branch' && isBranchManager;
        
        // Calculate date range
        const now = new Date();
        let dateFrom = '';
        
        switch (reportType) {
            case 'daily':
                dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
                break;
            case 'weekly':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay() + 1);
                weekStart.setHours(0, 0, 0, 0);
                dateFrom = weekStart.toISOString().split('T')[0];
                break;
            case 'monthly':
                dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                break;
            case 'yearly':
                dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                break;
            default:
                dateFrom = now.toISOString().split('T')[0];
        }
        
        // Build WHERE clause and params
        let ticketWhere = 'branch_id = ? AND DATE(created_at) >= ?';
        let reqWhere = 'branch_id = ? AND DATE(created_at) >= ?';
        let joWhere = 'branch_id = ? AND DATE(created_at) >= ?';
        const queryParams = [branchId, dateFrom];
        
        if (!isBranchScope) {
            ticketWhere += ' AND department_id = ?';
            reqWhere += ' AND department_id = ?';
            joWhere += ' AND department_id = ?';
            queryParams.push(departmentId);
        }
        
        // Fetch data
        const [tickets] = await pool.query(
            `SELECT * FROM tickets WHERE ${ticketWhere}`, queryParams
        );
        
        const [requisitions] = await pool.query(
            `SELECT * FROM requisitions WHERE ${reqWhere}`, queryParams
        );
        
        const [jobOrders] = await pool.query(
            `SELECT * FROM job_orders WHERE ${joWhere}`, queryParams
        );
        
        // Fetch departments for branch (only for branch scope)
        let departmentBreakdown = [];
        if (isBranchScope) {
            const [depts] = await pool.query(
                `SELECT DISTINCT d.id, d.name FROM departments d
                 JOIN tickets t ON t.department_id = d.id
                 WHERE t.branch_id = ? AND DATE(t.created_at) >= ?`,
                [branchId, dateFrom]
            );
            departmentBreakdown = depts.map((d) => ({
                name: d.name,
                count: tickets.filter((t) => t.department_id === d.id).length
            }));
        }
        
        // Calculate average resolution time
        const resolvedTickets = tickets.filter((t) => t.status === 'resolved' && t.resolved_at);
        let avgResolutionTime = 'N/A';
        let slaCompliance = 0;
        
        if (resolvedTickets.length > 0) {
            const totalHours = resolvedTickets.reduce((sum, t) => {
                const created = new Date(t.created_at).getTime();
                const resolved = new Date(t.resolved_at).getTime();
                return sum + (resolved - created) / (1000 * 60 * 60);
            }, 0);
            
            const avgHours = totalHours / resolvedTickets.length;
            
            if (avgHours < 1) {
                avgResolutionTime = Math.round(avgHours * 60) + 'm';
            } else if (avgHours < 24) {
                avgResolutionTime = Math.round(avgHours) + 'h';
            } else {
                avgResolutionTime = (avgHours / 24).toFixed(1) + 'd';
            }
            
            const compliant = resolvedTickets.filter((t) => {
                const created = new Date(t.created_at).getTime();
                const resolved = new Date(t.resolved_at).getTime();
                return (resolved - created) / (1000 * 60 * 60) <= 24;
            }).length;
            
            slaCompliance = Math.round((compliant / resolvedTickets.length) * 100);
        }
        
        // Process tickets
        const ticketStats = {
            total: tickets.length,
            open: tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length,
            resolved: tickets.filter((t) => t.status === 'resolved').length,
            closed: tickets.filter((t) => t.status === 'closed').length,
            byPriority: {
                critical: tickets.filter((t) => t.priority === 'critical').length,
                high: tickets.filter((t) => t.priority === 'high').length,
                medium: tickets.filter((t) => t.priority === 'medium').length,
                low: tickets.filter((t) => t.priority === 'low').length
            },
            byStatus: {
                new: tickets.filter((t) => t.status === 'new').length,
                assigned: tickets.filter((t) => t.status === 'assigned').length,
                in_progress: tickets.filter((t) => t.status === 'in_progress').length,
                pending: tickets.filter((t) => t.status === 'pending').length,
                resolved: tickets.filter((t) => t.status === 'resolved').length,
                closed: tickets.filter((t) => t.status === 'closed').length
            },
            byDepartment: departmentBreakdown,
            avgResolutionTime: avgResolutionTime,
            slaCompliance: slaCompliance
        };
        
        // Process requisitions
        const reqStats = {
            total: requisitions.length,
            pending: requisitions.filter((r) => r.status === 'pending').length,
            approved: requisitions.filter((r) => r.status === 'approved').length,
            processing: requisitions.filter((r) => r.status === 'processing').length,
            released: requisitions.filter((r) => r.status === 'released').length,
            rejected: requisitions.filter((r) => r.status === 'rejected').length,
            forwarded: requisitions.filter((r) => r.is_forwarded === 1 || r.status === 'forwarded').length,
            byDepartment: []
        };
        
        // Process job orders
        const joStats = {
            total: jobOrders.length,
            pending: jobOrders.filter((j) => j.status === 'pending').length,
            approved: jobOrders.filter((j) => j.status === 'approved' || j.status === 'received').length,
            assigned: jobOrders.filter((j) => j.status === 'assigned').length,
            forwarded: jobOrders.filter((j) => j.is_forwarded === 1 || j.status === 'forwarded').length,
            done: jobOrders.filter((j) => j.status === 'done').length,
            byDepartment: []
        };
        
        // Summary
        const totalRequests = tickets.length + requisitions.length + jobOrders.length;
        const completedRequests = ticketStats.resolved + ticketStats.closed + reqStats.released + joStats.done;
        
        const response = {
            period: reportType,
            branch_name: user.branch_name || '',
            department_name: user.dept_name || '',
            scope: isBranchScope ? 'branch' : 'department',
            tickets: ticketStats,
            requisitions: reqStats,
            jobOrders: joStats,
            summary: {
                totalRequests,
                completedRequests,
                completionRate: totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0,
                departments: departmentBreakdown.length
            },
            generatedAt: new Date().toISOString()
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET - SLA Stats for Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, 'secret_key');
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        const userId = decoded.id;
        const today = new Date().toISOString().split('T')[0];
        
        // Get user info to filter by department/branch if needed
        const [users] = await pool.query(
            'SELECT department_id, branch_id FROM new_user WHERE id = ?',
            [userId]
        );
        
        const user = users[0] || {};
        const departmentId = user.department_id;
        const branchId = user.branch_id;
        
        // ==================== TICKET STATS ====================
        
        // Total tickets
        const [totalResult] = await pool.query(
            'SELECT COUNT(*) as count FROM tickets WHERE department_id = ? AND branch_id = ?',
            [departmentId, branchId]
        );
        const total = totalResult[0]?.count || 0;
        
        // Open tickets
        const [openResult] = await pool.query(
            "SELECT COUNT(*) as count FROM tickets WHERE department_id = ? AND branch_id = ? AND status NOT IN ('resolved', 'closed')",
            [departmentId, branchId]
        );
        const open = openResult[0]?.count || 0;
        
        // Resolved today
        const [resolvedTodayResult] = await pool.query(
            'SELECT COUNT(*) as count FROM tickets WHERE department_id = ? AND branch_id = ? AND status = "resolved" AND DATE(resolved_at) = ?',
            [departmentId, branchId, today]
        );
        const resolvedToday = resolvedTodayResult[0]?.count || 0;
        
        // Critical tickets
        const [criticalResult] = await pool.query(
            "SELECT COUNT(*) as count FROM tickets WHERE department_id = ? AND branch_id = ? AND priority = 'critical' AND status NOT IN ('resolved', 'closed')",
            [departmentId, branchId]
        );
        const critical = criticalResult[0]?.count || 0;
        
        // SLA Compliance - resolved within 24 hours
        const [slaResult] = await pool.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) <= 24 THEN 1 ELSE 0 END) as compliant FROM tickets WHERE department_id = ? AND branch_id = ? AND status = "resolved" AND resolved_at IS NOT NULL',
            [departmentId, branchId]
        );
        
        let slaCompliance = 98; // default
        if (slaResult[0]?.total > 0) {
            slaCompliance = Math.round((slaResult[0].compliant / slaResult[0].total) * 100);
        }
        
        // Average resolution time
        const [avgResult] = await pool.query(
            'SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_minutes FROM tickets WHERE department_id = ? AND branch_id = ? AND status = "resolved" AND resolved_at IS NOT NULL',
            [departmentId, branchId]
        );
        
        let avgResolutionTime = 'N/A';
        const avgMinutes = avgResult[0]?.avg_minutes;
        if (avgMinutes) {
            if (avgMinutes < 60) {
                avgResolutionTime = Math.round(avgMinutes) + 'm';
            } else if (avgMinutes < 1440) {
                avgResolutionTime = (avgMinutes / 60).toFixed(1) + 'h';
            } else {
                avgResolutionTime = (avgMinutes / 1440).toFixed(1) + 'd';
            }
        }
        
        // Tickets by priority
        const [priorityResult] = await pool.query(
            `SELECT 
                SUM(CASE WHEN priority = 'critical' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as critical_open,
                SUM(CASE WHEN priority = 'high' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as high_open,
                SUM(CASE WHEN priority = 'medium' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as medium_open,
                SUM(CASE WHEN priority = 'low' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as low_open
             FROM tickets WHERE department_id = ? AND branch_id = ?`,
            [departmentId, branchId]
        );
        
        // Requisitions count
        const [reqResult] = await pool.query(
            'SELECT COUNT(*) as count FROM requisitions WHERE department_id = ? AND branch_id = ?',
            [departmentId, branchId]
        );
        
        // Job Orders count
        const [joResult] = await pool.query(
            'SELECT COUNT(*) as count FROM job_orders WHERE department_id = ? AND branch_id = ?',
            [departmentId, branchId]
        );
        
        const response = {
            total: total,
            open: open,
            resolvedToday: resolvedToday,
            critical: critical,
            avgResolutionTime: avgResolutionTime,
            slaCompliance: slaCompliance,
            priorities: {
                critical: priorityResult[0]?.critical_open || 0,
                high: priorityResult[0]?.high_open || 0,
                medium: priorityResult[0]?.medium_open || 0,
                low: priorityResult[0]?.low_open || 0
            },
            requisitions: reqResult[0]?.count || 0,
            jobOrders: joResult[0]?.count || 0,
            timestamp: new Date().toISOString()
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// DATABASE EXPORT API
// ============================================
// GET - Export entire database
app.get('/api/admin/database/export', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        console.log('💾 Starting database export...');
        
        // Get all tables ONLY (skip views)
        const [tables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = 'edptech_helpdesk' 
             AND TABLE_TYPE = 'BASE TABLE'
             ORDER BY TABLE_NAME`
        );
        
        console.log(`   Found ${tables.length} tables (views excluded)`);
        
        let sql = '-- ============================================\n';
        sql += '-- EDPTech Helpdesk Database Export\n';
        sql += `-- Generated: ${new Date().toISOString()}\n`;
        sql += `-- Database: edptech_helpdesk\n`;
        sql += `-- Tables: ${tables.length}\n`;
        sql += '-- ============================================\n\n';
        sql += 'SET FOREIGN_KEY_CHECKS = 0;\n';
        sql += 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n';
        sql += 'START TRANSACTION;\n\n';
        
        let totalRows = 0;
        let successTables = 0;
        let skippedTables = 0;
        
        for (const tableObj of tables) {
            const tableName = tableObj.TABLE_NAME;
            
            try {
                console.log(`  📋 Exporting table: ${tableName}`);
                
                // Get CREATE TABLE statement
                const [createResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
                const createStatement = createResult[0]['Create Table'];
                
                sql += `-- --------------------------------------------------------\n`;
                sql += `-- Table: \`${tableName}\`\n`;
                sql += `-- --------------------------------------------------------\n\n`;
                sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                sql += `${createStatement};\n\n`;
                
                // Get table data
                const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
                
                if (rows.length > 0) {
                    sql += `-- Data for table \`${tableName}\` (${rows.length} rows)\n`;
                    
                    // Get column names
                    const columns = Object.keys(rows[0]);
                    const columnList = columns.map(col => `\`${col}\``).join(', ');
                    
                    // Build INSERT statements in batches of 50 rows
                    const batchSize = 50;
                    for (let i = 0; i < rows.length; i += batchSize) {
                        const batch = rows.slice(i, i + batchSize);
                        const values = batch.map(row => {
                            const rowValues = columns.map(col => {
                                const value = row[col];
                                if (value === null) return 'NULL';
                                if (value instanceof Date) {
                                    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                }
                                if (typeof value === 'number') return value;
                                if (typeof value === 'boolean') return value ? 1 : 0;
                                // String or Buffer - escape special characters
                                if (Buffer.isBuffer(value)) {
                                    return `0x${value.toString('hex')}`;
                                }
                                return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
                            });
                            return `(${rowValues.join(', ')})`;
                        });
                        
                        sql += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n${values.join(',\n')};\n\n`;
                    }
                    
                    totalRows += rows.length;
                } else {
                    sql += `-- Table \`${tableName}\` is empty\n\n`;
                }
                
                successTables++;
                
            } catch (tableError) {
                console.warn(`  ⚠️ Skipping table ${tableName}: ${tableError.message}`);
                sql += `-- ⚠️ Table \`${tableName}\` skipped due to error: ${tableError.message}\n\n`;
                skippedTables++;
            }
        }
        
        sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';
        sql += 'COMMIT;\n';
        sql += '\n-- ============================================\n';
        sql += `-- Export completed: ${successTables} tables, ${totalRows} rows`;
        if (skippedTables > 0) sql += `, ${skippedTables} skipped`;
        sql += '\n-- ============================================\n';
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `edptech_helpdesk_backup_${timestamp}.sql`;
        
        console.log(`✅ Database export complete: ${filename}`);
        console.log(`   Tables: ${successTables} (${skippedTables} skipped)`);
        console.log(`   Total rows: ${totalRows}`);
        console.log(`   Size: ${(sql.length / 1024).toFixed(1)} KB`);
        
        // Log the export event
        try {
            await logSystemEvent('info', 'database_export', decoded.id, decoded.username, 
                decoded.userTable || 'users', `Database exported: ${successTables} tables`, req.ip);
        } catch (logError) {
            console.warn('⚠️ Could not log export event:', logError.message);
        }
        
        // Send as downloadable file
        res.setHeader('Content-Type', 'application/sql; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(sql, 'utf8'));
        res.send(sql);
        
    } catch (error) {
        console.error('❌ Database export error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to export database: ' + error.message 
        });
    }
});
// Optional: Export single table
app.get('/api/admin/database/export/:table', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        const tableName = req.params.table;
        console.log(`💾 Exporting table: ${tableName}`);
        
        // Get CREATE TABLE statement
        const [createResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
        const createStatement = createResult[0]['Create Table'];
        
        let sql = `-- Table: ${tableName}\n`;
        sql += `-- Exported: ${new Date().toISOString()}\n\n`;
        sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sql += `${createStatement};\n\n`;
        
        // Get table data
        const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
            const columns = Object.keys(rows[0]);
            const columnList = columns.map(col => `\`${col}\``).join(', ');
            
            const values = rows.map(row => {
                const rowValues = columns.map(col => {
                    const value = row[col];
                    if (value === null) return 'NULL';
                    if (value instanceof Date) {
                        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                    }
                    if (typeof value === 'number') return value;
                    return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                });
                return `(${rowValues.join(', ')})`;
            });
            
            sql += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n${values.join(',\n')};\n`;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${tableName}_backup_${timestamp}.sql`;
        
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(sql);
        
    } catch (error) {
        console.error('❌ Table export error:', error);
        res.status(500).json({ error: 'Failed to export table: ' + error.message });
    }
});
// POST - Import/restore database from SQL file
app.post('/api/admin/database/import', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'secret_key');
        
        // Only admin can restore
        const allowedRoles = ['admin', 'head/manager', 'head manager', 'supervisor', 'branch manager'];
        if (!allowedRoles.includes((decoded.role || '').toLowerCase())) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        
        const { sql, filename } = req.body;
        
        if (!sql) {
            return res.status(400).json({ error: 'No SQL content provided' });
        }
        
        console.log(`🔄 Starting database restore from: ${filename || 'unknown file'}`);
        console.log(`   SQL size: ${(sql.length / 1024).toFixed(1)} KB`);
        
        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SET '));
        
        let executed = 0;
        let errors = 0;
        
        for (const statement of statements) {
            try {
                await pool.query(statement);
                executed++;
            } catch (stmtError) {
                console.warn(`⚠️ Skipping statement: ${stmtError.message}`);
                errors++;
            }
        }
        
        console.log(`✅ Database restore complete: ${executed} statements executed, ${errors} skipped`);
        
        // Log the restore event
        await logSystemEvent('warning', 'database_restore', decoded.id, decoded.username, 
            decoded.userTable || 'users', `Database restored from: ${filename || 'upload'}`, req.ip);
        
        res.json({ 
            success: true, 
            message: `Database restored successfully!`,
            executed,
            errors,
            filename: filename || 'uploaded file'
        });
        
    } catch (error) {
        console.error('❌ Database import error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to restore database: ' + error.message 
        });
    }
});
// ============================================
// FORGOT PASSWORD - Send Reset Code via Discord
// ============================================
const { sendPasswordResetToDiscord } = require('./discord-notify');

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const [users] = await pool.query(
            'SELECT id, username, email FROM users WHERE email = ? UNION SELECT id, username, email FROM new_user WHERE email = ?',
            [email, email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'No account found with this email address.' });
        }
        
        const user = users[0];
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        await pool.query(
            `INSERT INTO password_resets (email, code, expires_at, created_at) 
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE code = ?, expires_at = ?`,
            [email, resetCode, expiresAt, resetCode, expiresAt]
        );
        try {
            await sendPasswordResetToDiscord(email, resetCode, user.username);
        } catch (discordError) {
            console.error('Discord send failed:', discordError.message);
        }
        
        console.log(`🔑 Reset code for ${email}: ${resetCode}`);
        
        // Return code to frontend so user can see it
        res.json({ 
            message: 'Reset code generated successfully.',
            code: resetCode
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// Start server
async function startServer() {
    await testConnection();
    await createAttachmentsTable();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 EDPtech Helpdesk Backend running on:`);
        console.log(`   Local:    http://localhost:${PORT}`);
        console.log(`   Network:  http://192.168.10.250:${PORT}`);
        console.log(`\n📋 API Endpoints:`);
        console.log(`   POST   /api/auth/login`);
        console.log(`   POST   /api/auth/register`);
        console.log(`   POST   /api/auth/validate-key`);
        console.log(`   GET    /api/tickets`);
        console.log(`   POST   /api/tickets`);
        console.log(`   PUT    /api/tickets/:id`);
        console.log(`   GET    /api/department-roles`);
        console.log(`   POST   /api/department-roles`);
        console.log(`   PUT    /api/department-roles/:id`);
        console.log(`   DELETE /api/department-roles/:id`); 
        console.log(`   GET    /api/stats`);
        console.log(`   GET    /api/departments`);
        console.log(`   GET    /api/users`);
        console.log(`\n✅ Server is ready!\n`);
    });
}

startServer();