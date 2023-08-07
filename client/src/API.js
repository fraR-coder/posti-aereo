const SERVER_URL = 'http://localhost:3001/api/';

import { Plane, Reservation } from "./models";

//ritorna tutte le informazioni su tutti gli aerei
async function getAllPlanes() {
  return getJson(fetch(SERVER_URL + 'planes'))
    .then(json => {
      return json.map((plane) => new Plane(plane.id, plane.type, plane.nOccupied, plane.nFree, plane.nRows, plane.nSeats))
    });

}

//ritorna planeInfo e list di Reservation per l'aereo di tipo type
async function getPlaneInfoAndRes(planeType) {
  return getJson(fetch(SERVER_URL + 'planes/' + planeType + "/reservations"))
    .then(json => {
      const plane = json.info;
      const info = new Plane(plane.id, plane.type, plane.nOccupied, plane.nFree, plane.nRows, plane.nSeats);
      const reservations = json.res.map((res) => new Reservation(res.id, res.idPlane, res.idUser, res.rowNumber, res.seatNumber));
      return { info, reservations }
    });
}

//** API PER UTENTI AUTENTICATI */

//Ritorna prenotazioni,divise per tipo di aereo, dell'utente loggato
//{locale:[],regionale:[],internazionale:[]}
async function getUserReservations() {
  return getJson(fetch(`${SERVER_URL}users/reservations`, { credentials: 'include' }))
    .then(json => {
      //json è oggetto con prenotazioni separate per tipo Aereo
      //json sarebbe un oggetto {locale:[], regionale:[],internazionale:[]}
      return json;
    });
}


//crea una nuova prenotazione, riceve come parametro {planeType, seats:[{fila,posto},...]};
async function addReservation(reservation) {
  return getJson(fetch(SERVER_URL + "reservations", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(reservation)
  }))

}


//cancella una prenotazione, riceve type dell'aereo perchè per ogni utente c'è massimo una prenotazione per ogni aereo
//quindi è sufficiente eliminare tutte le prenotazioni dell'utente per quell'aereo
async function deleteReservation(planeType) {
  return getJson(fetch(SERVER_URL + "reservations/" + planeType, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  }))
}

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {
          // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
          response.json()
            .then(json => resolve(json))
            .catch(err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj =>
              reject(obj)
            ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err =>
        reject({ error: "Cannot communicate" })
      ) // connection error
  });
}


/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
    body: JSON.stringify(credentials),
  })
  )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    // this parameter specifies that authentication cookie must be forwared
    credentials: 'include'
  })
  )
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
  })
  )
}

const API = { getAllPlanes, getPlaneInfoAndRes, getUserReservations, addReservation, deleteReservation, logIn, getUserInfo, logOut };
export default API;
