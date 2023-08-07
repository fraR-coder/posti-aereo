'use strict';

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');                                  // logging middleware
const cors = require('cors');

const { check, validationResult, } = require('express-validator'); // validation middleware

const planeDao = require('./dao-planes'); // module for accessing the planes table in the DB
const userDao = require('./dao-users'); // module for accessing the user table in the DB
/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());
/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if (!user)
    return callback(null, false, 'Incorrect username or password');

  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));
// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + name 
  callback(null, user);
});
// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));

  return callback(null, user); // this will be available in req.user
});
/** Creating the session */
const session = require('express-session');
const { Reservation } = require('./models');
app.use(session({
  secret: "my secret phrase",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' });
}
/*** Utility Functions ***/
// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** Users APIs ***/
// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser() in LocalStratecy Verify Fn
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});










/***
 * PLANES API
 */

// GET /api/planes
app.get("/api/planes", async (req, res) => {
  try {
    const planes = await planeDao.getPlanes();
    if (planes.error) {
      return res.status(404).json(planes);  //{ error: 'No plane found'})
    }
    else
      return res.status(200).json(planes);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});



//GET /api/planes/:type/reservations
app.get("/api/planes/:type/reservations", async (req, res) => {
  try {
    //ritorna info su aereo type
    //getPlanes ritorna array di lunghezza 1 se passo il type come parametro
    const planes = await planeDao.getPlanes(req.params.type);
    if (planes.error) {
      return res.status(404).json(planes);
    }
    else {
      const plane = planes[0];
      if (plane.type !== req.params.type) {
        return res.status(422).json({ error: 'URL and found plane type mismatch' });
      }
      //ottengo le prenotazioni di quell'aereo
      const reservations = await planeDao.getResForPlane(plane.id);
      //ritorno un oggetto con i dati sull'aereo e tutte le prenotazioni per quell'aereo
      return res.status(200).json({ info: plane, res: reservations });
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
});



//get the reservations of the currrently logged user
//GET /api/users/reservations
app.get("/api/users/reservations", isLoggedIn, async (req, res) => {
  try {
    //ottengo la lista di Reservation
    const reservations = await planeDao.getUserRes(req.user.id);
    //crea oggetto result che contiene le prenotazioni divise per idAereo
    // result sarebbe un oggetto {1:[], 2:[], 3:[]}
    const result = reservations.reduce((acc, res) => {
      if (!acc[res.idPlane]) {
        acc[res.idPlane] = [];
      }
      acc[res.idPlane].push({ row: res.rowNumber, seat: res.seatNumber });
      return acc;
    }, {});

    // Ora ottieni il type associato a ogni id e crea l'oggetto resultWithType
    const resultWithType = {};
    for (let id of Object.keys(result)) {
      let typeObj = await planeDao.getType(id); //{tipo:...}
      if(typeObj.error){
        return resultWithType.status(404).json(typeObj);
      }
      resultWithType[typeObj.tipo] = result[id];
    }

    //ottengo {locale:[],regionale:[],internazionale:[]}
    return res.status(200).json(resultWithType);

  } catch (error) {
    return res.status(500).json(error.message);
  }
});



//create a new reservation
app.post('/api/reservations', isLoggedIn,
  [
    check("planeType").isString(),
    check("seats").isArray({ min: 1 }),
    check("seats.*.fila").isInt({ min: 0 }),
    check("seats.*.posto").isInt({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
    try {
      const plane = await planeDao.getPlanes(req.body.planeType);
      if (plane.error) {
        return res.status(404).json(plane);
      }
      const planeId = plane[0].id;
      //check  utente ha una sola prenotazione per volo
      const check1 = await planeDao.checkReservation(planeId, req.user.id);
      if (check1.error) {
        //403 forbidden
        return res.status(403).json(check1);//{ error: 'hai già effettuato una prenotazione per questo volo' }
      }

      //check fila < max fila e posto< maxposto
      const check2 = await planeDao.checkLimits(planeId, req.body.seats);
      if (check2.error) {
        //400 bad request
        return res.status(400).json(check2);//{ error: 'non esiste questa fila o posto per questo aereo ' + "fila:"+seat.fila+1 +" posto:"+String.fromCharCode(65 +seat.posto) }
      }
      //salvo un array di posti occupati tra quelli che voglio prenotare e lo mando al client
      let postiOccupati = [];

      for (let seat of req.body.seats) {
        //check posto libero 
        let check3 = await planeDao.checkOccupied(planeId, seat.fila, seat.posto);
        if (check3.error) {
          postiOccupati.push(seat);
        }
      }
      if (postiOccupati.length > 0) {
        let occupati = { occupati: postiOccupati };
        return res.status(403).json(occupati);
      }

      //se tutti i check sono ok inizio inserimento prenotazioni 
      let result = 0; // conterrà il numero di linee modificate
      for (let seat of req.body.seats) {
        result += Number(await planeDao.createReservation(
          new Reservation(0, planeId, req.user.id, seat.fila, seat.posto)));//id messo dal db
      }
      if (result !== req.body.seats.length) {
        return res.status(500).json({ error: "db no more consistent" });
      }
      //aggiornamento dati del volo
      const updated = await planeDao.updatePlaneInfo(planeId, req.body.seats.length);
      return res.status(200).json({ nuovi: result, updated: updated });
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new reservation: ${err}` });
    }
  }
)



//DELETE /api/reservations/:type
//cancella tutti i posti preotati dall'utente per un aereo
app.delete("/api/reservations/:type", isLoggedIn, check("type").isString(), //type=planeType
  async (req, res) => {
    try {
      //ottengo id per questo tipo di aereo
      const planes =await planeDao.getPlanes(req.params.type); //ritorna array di planes
      const id=planes[0].id;
      const reservations = await planeDao.getResById(id, req.user.id);
      if (reservations.error) {
        return res.status(404).json(reservations.error);//{ error: "reservations not found" }
      }
      //salvo il numero totale righe cancellate
      let result = 0;
      for (let reservation of reservations) {
        result += Number(await planeDao.deleteReservation(reservation, req.user.id));
      }

      if (result !== reservations.length) {
        return res.status(500).json({ error: "db no more consistent" });
      }
      //passo un valore negativo per numero posti, così aumento i posti liberi e diminusco gli occupati
      const updated = await planeDao.updatePlaneInfo(id, - reservations.length);

      // number of changed rows is sent to client as an indicator of success
      res.status(200).json({ deleted: result, updated: updated });
    } catch (err) {
      res.status(503).json({ error: `Database error during the delete of reservations for plane ${id}.` });
    }
  }
);





/***
 * Uility 
 */

//delete all reservations
app.delete("/api/reservations",
  async (req, res) => {
    try {
      const result = await planeDao.deleteAll();
      res.status(200).json(result);
    } catch (err) {
      res.status(503).json({ error: 'Database error during the deletion ' });
    }
  }
);



//restore PlaneInfos
app.put('/api/planes',
  async (req, res) => {

    try {
      const planes = await planeDao.getPlanes();

      for (let plane of planes) {
        await planeDao.restore(plane);
      }

      res.status(200).json(planes)
    } catch (err) {
      res.status(503).json({ error: `Database error : ${err}` });
    }
  }
)



const port = 3001;
// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
