const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const token = req.cookies?.fyro_token
  if (!token) return res.status(401).json({ success: false, data: null, message: 'Unauthorized' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { userId: decoded.userId, role: decoded.role, name: decoded.name }
    next()
  } catch {
    return res.status(401).json({ success: false, data: null, message: 'Session expired' })
  }
}
