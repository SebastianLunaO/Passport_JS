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

async function Userfind(usuario) {
	const result = await connection.query("SELECT * FROM usuarios WHERE username = ?",usuario)
	return result[0][0]
}

async function getById(id) {
	try {
	const result = await connection.query("SELECT * FROM usuarios WHERE id = ?",id)
		
	} catch (error) {
		return error
	}
	return result[0][0]
}

async function createUSER(username,hash,salt) {
 try {
	const [result] = await connection.query("INSERT INTO usuarios(username,hash,salt) VALUES (?,?,?)",[username,hash,salt]);
	
	const id = result.insertId
	return await getById(id)
 } catch (error) {
	console.error(error)
 }
	
}


// /**
//  * -------------- Passport use ----------------
//  */
passport.use(new strategy(
	async (username, password, cb) => {
				const respuesta = await Userfind(username)
				if (!respuesta) { return cb(null, false) }
				
				// Function defined at bottom of app.js
				const isValid = validPassword(password,respuesta.hash,respuesta.salt);

				if (isValid) {
					return cb(null, respuesta);
				} else {
					return cb(null, false);
				}
 }));

/**
 * This function is used in conjunction with the `passport.authenticate()` method.  See comments in
 * `passport.use()` above ^^ for explanation
 */
passport.serializeUser(function(user, done) {
	console.log(`serialice user: ${user.id}`)
	done(null, user.id);
});


/**
 * This function is used in conjunction with the `app.use(passport.session())` middleware defined below.
 * Scroll down and read the comments in the PASSPORT AUTHENTICATION section to learn how this works.
 * 
 * In summary, this method is "set" on the passport object and is passed the user ID stored in the `req.session.passport`
 * object later on.
 */
passport.deserializeUser( async function(id, cb) {
	try {
		const resultado = await getById(id);
		cb(null,resultado)
	} catch (error) {
		cb(error)
	}
}); 


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
	  secret: process.env.SECRET,
	  resave: false,
	  saveUninitialized: true,
	  store: storeCon,
	  cookie: {
		 maxAge: 1000 * 60 * 60 * 24 
	  }})
 ); 

 app.use(passport.initialize());
 app.use(passport.session());
 

 app.use((req,res,next)=>{
	console.log(req.session)
	console.log(req.user)
	next()
 })
 /**
  * -------------- ROUTES ----------------
  */
 
 app.get('/', (req, res, next) => {
	 res.send('<h1>Home</h1><p>Please <a href="/register">register</a></p>');
 });
 
 // When you visit http://localhost:3000/login, you will see "Login Page"
 app.get('/login', (req, res, next) => {
	
	 const form = '<h1>Login Page</h1><form method="POST" action="/login">\
	 Enter Username:<br><input type="text" name="username">\
	 <br>Enter Password:<br><input type="password" name="password">\
	 <br><br><input type="submit" value="Submit"></form>';
 
	 res.send(form);
 
 });
 
 // Since we are using the passport.authenticate() method, we should be redirected no matter what 
 app.post('/login', passport.authenticate('local', { failureRedirect: '/login-failure', successRedirect: '/login-success' }), (err, req, res, next) => {
	 if (err) next(err);
 });
 
 // When you visit http://localhost:3000/register, you will see "Register Page"
 app.get('/register', (req, res, next) => {
 
	 const form = '<h1>Register Page</h1><form method="post" action="register">\
					 Enter Username:<br><input type="text" name="username">\
					 <br>Enter Password:<br><input type="password" name="password">\
					 <br><br><input type="submit" value="Submit"></form>';
 
	 res.send(form);
	 
 });
 
 app.post('/register', async (req, res, next) => {
	 
	 const saltHash = genPassword(req.body.password);
	 const username = req.body.username
	 const salt = saltHash.salt;
	 const hash = saltHash.hash;

	 const result = await createUSER(username,hash,salt)
 
	try {
		console.log(result)
	} catch (error) {
		console.error(error)
	}	
	
	res.redirect('/login');
 
 });
 
 /**
  * Lookup how to authenticate users on routes with Local Strategy
  * Google Search: "How to use Express Passport Local Strategy"
  * 
  * Also, look up what behaviour express session has without a maxage set
  */
 app.get('/protected-route', (req, res, next) => {
	
	 // This is how you check if a user is authenticated and protect a route.  You could turn this into a custom middleware to make it less redundant
	 if (req.isAuthenticated()) {
		 res.send('<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>');
	 } else {
		 res.send('<h1>You are not authenticated</h1><p><a href="/login">Login</a></p>');
	 }
 });
 
 // Visiting this route logs the user out
 app.get('/logout', (req, res, next) => {
	 req.logout(req.user, err => {
	console.log(req.user)
	 	if(err) return next(err);
 	res.redirect("/protected-route");
	 }); 
 });
 
 app.get('/login-success', (req, res, next) => {
	 res.status(200).send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
 });
 
 app.get('/login-failure', (req, res, next) => {
	 res.send('You entered the wrong password.');
 });
 
 


// // Server listens on http://localhost:3000

app.listen(3000,()=>{
    console.log('Server running on 3000')
})





function validPassword(password, hash, salt) {
	var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
	return hash === hashVerify;
}


function genPassword(password) {
	var salt = crypto.randomBytes(32).toString('hex');
	var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
	
	return {
	  salt: salt,
	  hash: genHash
	};
}