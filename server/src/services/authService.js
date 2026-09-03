const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

async function register({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

async function googleAuth({ name, email, googleId, avatar }) {
  const normalizedEmail = (email || 'operator@agentflow.ai').toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(24).toString('hex') + 'A1!';
    user = await User.create({
      name: name || 'Google Operator',
      email: normalizedEmail,
      password: randomPassword,
      role: 'operator',
      avatar,
      googleId,
    });
  } else {
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  }

  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

module.exports = { register, login, getMe, googleAuth };


