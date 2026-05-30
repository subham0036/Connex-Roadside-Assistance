const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "Auth token missing" });
    }

    const secret = process.env.JWT_SECRET || "connex_super_secret_key_2024";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ msg: "Invalid token" });
  }
};