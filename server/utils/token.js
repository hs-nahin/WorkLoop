// Legacy file - JWT auth no longer used. Firebase Admin SDK handles all authentication.
// This file is kept for backward compatibility but generateToken/verifyToken are no-ops.
const generateToken = (user) => {
  console.warn('JWT generateToken is deprecated. Use Firebase Auth.');
  return null;
};

const verifyToken = (token) => {
  console.warn('JWT verifyToken is deprecated. Use Firebase Auth.');
  return null;
};

module.exports = { generateToken, verifyToken };
