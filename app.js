import express from 'express'
import mysql2 from 'mysql2/promise'
import session from 'express-session'
import MySQLSessionStoreImport from "express-mysql-session";
import passport from 'passport';
import localStrat from 'passport-local'
import crypto from 'crypto'
import z from 'zod'

const password = process.env.PASSWORD_MYSQL
const MySQLSessionStore = MySQLSessionStoreImport(session);

const strategy = localStrat.Strategy
/**
 * -------------- GENERAL SETUP ----------------
 */

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax

// // Create the Express application
var app = express();

// // Middleware that allows Express to parse through both JSON and x-www-form-urlencoded request bodies
// // These are the same as `bodyParser` - you probably would see bodyParser put here in most apps
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//_------------------------------ DAatbases----------------
const optionsConnection = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: password,
    database: 'passport_test'
};

const storeSessionOptions = {
	createDatabaseTable: false,
    schema: {
		tableName: 'sessions_customs',
		columnNames: {
			session_id: 'sessions_id',
			expires: 'hash',
			data: 'salt'
		}
	}
}

const connection = await mysql2.createConnection(optionsConnection)


const result =  await connection.query("SELECT * FROM sessions_customs;");


const storeCon = new MySQLSessionStore(storeSessionOptions,connection)

const User = z.object({
	username: z.string(),
	hash: z.string(),
	salt: z.string()
})

const Userfind = async (usuario) => {
	const result = await connection.query("SELECT usuarios(username) WHERE username = ?",usuario)
}

// /**
//  * -------------- Passport use ----------------
//  */
passport.use(new strategy(
	function(username,password,cb){
		const [usuario] = Userfind(username)
		usuario.then((user)=>{
			if (!user) { return cb(null, false) }
                
			// Function defined at bottom of app.js
			const isValid = validPassword(password, user.hash, user.salt);
			
			if (isValid) {
				return cb(null, user);
			} else {
				return cb(null, false);
			}
		})
	}
))


// /**
//  * See the documentation for all possible options - https://www.npmjs.com/package/express-session
//  *
//  * As a brief overview (we will add more later):
//  *
//  * secret: This is a random string that will be used to "authenticate" the session.  In a production environment,
//  * you would want to set this to a long, randomly generated string
//  *
//  * resave: when set to true, this will force the session to save even if nothing changed.  If you don't set this,
//  * the app will still run but you will get a warning in the terminal
//  *
//  * saveUninitialized: Similar to resave, when set true, this forces the session to be saved even if it is unitialized
//  */
 app.use(
   session({
	 key: 'cookie',
     secret: process.env.SECRET,
     resave: false,
     saveUninitialized: true,
     store: storeCon,
	 cookie: {
		maxAge: 1000 * 60 * 60 * 24
	 }

 })
 );

// /**
//  * -------------- ROUTES ----------------
//  */
console.log()
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

// /**
//  * -------------- SERVER ----------------
//  */

// // Server listens on http://localhost:3000

app.listen(3000,()=>{
    console.log('Server running on 3000')
})