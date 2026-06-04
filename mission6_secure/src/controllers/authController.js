const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

function isPlainString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!isPlainString(username) || !isPlainString(email) || !isPlainString(password)) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'user'
    });

    return res.status(201).json({
      message: 'User created',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!isPlainString(username) || !isPlainString(password)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
