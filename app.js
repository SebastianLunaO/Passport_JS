import express from 'express'
import mysql2 from 'mysql2/promise'
import MySQLStore from 'express-mysql-session';
import session from 'express-session'



/**
 * -------------- GENERAL SETUP ----------------
 */

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax

// Create the Express application
var app = express();

// Middleware that allows Express to parse through both JSON and x-www-form-urlencoded request bodies
// These are the same as `bodyParser` - you probably would see bodyParser put here in most apps
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const optionsConnection = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: process.env.PASSWORD_MYSQL,
    database: 'pasport_test'
};

const storeSessionOptions = {
    schema: {
		tableName: 'sessions',
		columnNames: {
			session_id: 'session_id',
			expires: 'expires',
			data: 'data'
		}
	}
}

const connection = mysql2.createConnection(optionsConnection)
const sessionStore = new MySQLStore ({})

/**
 * -------------- DATABASE ----------------
 */

/**
 * Connect to MongoDB Server using the connection string in the `.env` file.  To implement this, place the following
 * string into the `.env` file
 *
 * DB_STRING=mongodb://<user>:<password>@localhost:27017/database_name
 */

// Creates simple schema for a User.  The hash and salt are derived from the user's given password when they register
var UserSchema = session.getSchema('newSchema');

// // Defines the model that we will use in the app
// mongoose.model("User", UserSchema);

/**
 * -------------- SESSION SETUP ----------------
 */

/**
 * The MongoStore is used to store session data.  We will learn more about this in the post.
 *
 * Note that the `connection` used for the MongoStore is the same connection that we are using above
 */
// const sessionStore = new MongoStore({
//   mongooseConnection: connection,
//   collection: "sessions",
// });

/**
 * See the documentation for all possible options - https://www.npmjs.com/package/express-session
 *
 * As a brief overview (we will add more later):
 *
 * secret: This is a random string that will be used to "authenticate" the session.  In a production environment,
 * you would want to set this to a long, randomly generated string
 *
 * resave: when set to true, this will force the session to save even if nothing changed.  If you don't set this,
 * the app will still run but you will get a warning in the terminal
 *
 * saveUninitialized: Similar to resave, when set true, this forces the session to be saved even if it is unitialized
 */
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
  })
);

/**
 * -------------- ROUTES ----------------
 */

// When you visit http://localhost:3000/login, you will see "Login Page"
app.get("/login", (req, res, next) => {
  res.send("<h1>Login Page</h1>");
});

app.post("/login", (req, res, next) => {});

// When you visit http://localhost:3000/register, you will see "Register Page"
app.get("/register", (req, res, next) => {
  res.send("<h1>Register Page</h1>");
});

app.post("/register", (req, res, next) => {});

/**
 * -------------- SERVER ----------------
 */

// Server listens on http://localhost:3000
app.listen(3000);