const checkRole = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res
      .status(403)
      .send({ error: "You do not have the required permissions." })
  }
  next()
}

module.exports = checkRole
