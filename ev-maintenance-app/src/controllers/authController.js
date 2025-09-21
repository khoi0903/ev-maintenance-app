const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            port: parseInt(process.env.DB_PORT, 10),
            options: { encrypt: false, trustServerCertificate: true }
        });

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Account WHERE Username = @username');

        const user = result.recordset[0];
        if (!user) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu!' });

        const match = await bcrypt.compare(password, user.PasswordHash);
        if (!match) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu!' });

        const token = jwt.sign(
            { accountId: user.AccountID, role: user.Role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        res.json({ token, accountId: user.AccountID, role: user.Role });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

module.exports = { login };