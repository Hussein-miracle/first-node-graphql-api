const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  
  if(!authHeader){
    req.isAuth = false;

    return next();
  }

  const token = req.get("Authorization").split(" ")[1];
  // console.log("🚀 ~ file: is-auth.js ~ line 13 ~ token", token);

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, "postssupersec");
  } catch (err) {
    req.isAuth = false;

    return next();
  }

  if (!decodedToken) {
    req.isAuth = false;

    return next();
  }



  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
