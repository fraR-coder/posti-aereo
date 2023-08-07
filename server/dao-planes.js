'use strict';

/* Data Access Object (DAO) module for accessing films data */

const db = require('./db');
const { Plane, Reservation } = require("./models");

//in caso di successo ritorna la lista di infoPlane
//altrimenti { error: 'No plane found'}
//supporta anche il caso di ricerca di singolo aereo, ritorna un array con unn solo elemento oppure errore
exports.getPlanes = (planeType) => {
  return new Promise((resolve, reject) => {
    let sql = "";
    if (planeType) {
      sql = "SELECT * FROM aerei WHERE tipo=?"
    } else {
      sql = "SELECT * FROM aerei"
    }
    db.all(sql, [planeType], (err, rows) => {
      if (err) { reject(err); }
      //se non ho trovato
      if (rows.length == 0) {
        resolve({ error: 'Plane not found' });
      }
      else {
        const planesInfo = rows.map((row) => new Plane(row.id, row.tipo, row.occupati, row.liberi, row.file, row.posti));
        resolve(planesInfo);
      }
    });
  });
};


//ottengo le prenotazioni per il tipo di aereo
exports.getResForPlane = (idPlane) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM prenotazioni WHERE aereoId=?';
    db.all(sql, [idPlane], (err, rows) => {
      if (err) { reject(err); }
      //se non ci sono prenotazioni ho un array vuoto
      //sono sicuro che idPlane esista perchè chiamo prima getPlanes(idPlane)
      const reservations = rows.map((row) => new Reservation(row.id, row.aereoId, row.userId, row.fila, row.posto));
      resolve(reservations);
    });
  });
};


//ottengo le prenotazioni dell'utente
exports.getUserRes = (idUser) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM prenotazioni WHERE userId=?';
    db.all(sql, [idUser], (err, rows) => {
      if (err) { reject(err); }
      //se non ci sono prenotazioni ho array vuoto
      const reservations = rows.map((row) => new Reservation(row.id, row.aereoId, row.userId, row.fila, row.posto));
      resolve(reservations);
    });
  });
};

exports.getType=(idPlane) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT tipo FROM aerei WHERE id=?';
    db.all(sql, [idPlane], (err, rows) => {
      if (err) { reject(err); }
      if(rows.length==0){
        resolve({ error: 'Plane not found with id: '+idPlane });
        return;
      }
      const type=rows[0]; //{tipo: ..}
      resolve(type);
    });
  });
}



//controlla la prenotazione,una sola per volo
exports.checkReservation = (planeId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM prenotazioni WHERE userId=? and aereoId=?';
    db.all(sql, [userId, planeId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      if (rows.length > 0) {
        resolve({ error: 'hai già effettuato una prenotazione per questo volo' });
      }
      else {
        resolve({ ok: "ok" });
      }
    });
  });
}


//ricava i dati sul'aereo e li confronta con i parametri arrivati dal client (seats)
exports.checkLimits = (planeId, seats) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM aerei WHERE id=?';
    db.get(sql, [planeId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      const file = row.file;
      const posti = row.posti;

      //in seat ho indici di fila e posto che partono da zero, metre file e posti sono numeri che partono da 1
      for (let seat of seats) {
        if (seat.fila > file - 1 || seat.posto > posti - 1) {
          resolve({ error: 'non esiste questa fila o posto per questo aereo ' + "fila:" + seat.fila + 1 + " posto:" + String.fromCharCode(65 + seat.posto) });
        }
      }

      resolve({ ok: "ok" });

    });
  });

}

exports.checkOccupied = (planeId, fila, posto) => {

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM prenotazioni WHERE aereoId=? and fila=? and posto=?';
    db.all(sql, [planeId, fila, posto], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      if (rows.length > 0) {
        resolve({ error: 'posto occupato ' + fila + " " + posto });
      }
      resolve({ ok: "ok" });
    });
  });


}


//res={planeId,userId,rowNumber,seatNumber}
exports.createReservation = (res) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO prenotazioni (aereoId,userId,fila,posto) values (?,?,?,?)';  
    db.run(sql, [res.idPlane, res.idUser, res.rowNumber, res.seatNumber], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);
    });
  });
}



//aggiorna psoti liberi e occupati sulla base del numero di posti prenotati
//posti è un numero negativo nel caso di delete 
exports.updatePlaneInfo = (planeId, posti) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE aerei SET occupati= occupati + ? , liberi=liberi-?  WHERE id = ?';
    db.run(sql, [posti, posti, planeId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.changes);
    });
  });
}


//trova le prenotazioni dell'utente per un planeId
exports.getResById = (planeId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM prenotazioni where aereoId=? and userId=?';
    db.all(sql, [planeId, userId], (err, rows) => {
      if (err) { reject(err); }

      if (rows == undefined) {
        resolve({ error: "reservations not found" });
        return;
      }
      let reservations = [];
      rows.forEach(row => reservations.push(row.id));
      resolve(reservations);
    });
  });
}

//canella una prenotazione dalla tabella 
exports.deleteReservation = (resId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM prenotazioni WHERE id = ? AND userId = ?';  // Double-check that the reservation belongs to the userId
    db.run(sql, [resId, userId], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);  // return the number of affected rows
    });
  });
}



/***
 * Utility
 */

exports.deleteAll = () => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM prenotazioni ' ;  
    db.run(sql, [], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.changes);  // return the number of affected rows
    });
  });
}

exports.restore = (plane) => {
  console.log(plane);
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE aerei SET occupati= 0 , liberi=? where id=?';
    db.run(sql, [plane.nTotal,plane.id], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.changes);
    });
  });
}






