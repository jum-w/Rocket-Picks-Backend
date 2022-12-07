const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

require("dotenv").config();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3000/register",
      "http://localhost:3000/leaderboard",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    key: process.env.KEY,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000,
    },
  })
);

const db = mysql.createConnection({
  user: process.env.USER,
  host: process.env.HOST,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

app.post("/create", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  bcrypt.hash(password, 10).then((hash) => {
    db.query(
      "INSERT INTO users (id, username, password) SELECT MAX(id)+1, ?, ? FROM users;",
      [username, hash],
      (err, result) => {
        if (!err) {
          res.send({ message: "Done" });
        } else if (err.sqlMessage.includes("username")) {
          res.send({ message: "Username is already in use." });
        }
      }
    );
  });
});

app.get("/names", (req, res) => {
  db.query(
    "SELECT username, points FROM users ORDER BY points desc LIMIT 10;",
    (err, result) => {
      if (err) {
        res.send(err);
      } else res.send(result);
    }
  );
});

app.post("/points", (req, res) => {
  const username = req.body.username;

  db.query(
    "SELECT points FROM login_register.users WHERE username = ?;",
    [username],
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/results", (req, res) => {
  const username = req.body.username;
  const s1 = req.body.score1;
  const s2 = req.body.score2;
  const s3 = req.body.score3;
  const s4 = req.body.score4;
  const s5 = req.body.score5;
  const s6 = req.body.score6;
  const s7 = req.body.score7;

  db.query(
    "UPDATE login_register.users SET winner1 = ?, winner2 = ?, winner3 = ?, winner4 = ?, winner5 = ?, winner6 = ?, winner7 = ? WHERE username = ?;",
    [s1, s2, s3, s4, s5, s6, s7, username],
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/check", (req, res) => {
  const username = req.body.username;

  db.query(
    "SELECT winner1 FROM login_register.users WHERE username = ?;",
    [username],
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.get("/teams", (req, res) => {
  db.query("SELECT * FROM login_register.top8;", (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

app.post("/teams", (req, res) => {
  const username = req.body.username;

  db.query(
    "SELECT winner1, winner2, winner3, winner4, winner5, winner6, winner7 FROM login_register.users WHERE username = ?;",
    [username],
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.query(
    "SELECT * FROM users WHERE (username) = (?)",
    [username],
    (err, result) => {
      if (err) {
        console.log("err");
      } else if (result.length <= 0) {
        res.send({ message: "Invalid username/password." });
      } else {
        bcrypt.compare(password, result[0].password, (err, match) => {
          if (err) {
            console.log(err);
          }

          if (match) {
            req.session.user = result;
            console.log(req.session.user);
            res.send({ message: "Login complete." });
          } else {
            res.send({ message: "Invalid username/password." });
          }
        });
      }
    }
  );
});

app.listen(3001, () => {
  console.log("server running");
});
