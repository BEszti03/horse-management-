module.exports = function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Nincs hitelesített felhasználó." });
  }

  if (req.user.szerepkor !== "admin") {
    return res.status(403).json({ message: "Nincs admin jogosultság." });
  }

  next();
};