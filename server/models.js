"use strict";

function User(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
}

function Plane(id, type, nOccupied, nFree, nRows, nSeats) {
    this.id = id;
    this.type = type;
    this.nOccupied = nOccupied;
    this.nFree = nFree;
    this.nRows = nRows;
    this.nSeats = nSeats;
    this.nTotal = nOccupied + nFree;
}


function Reservation(id, idPlane, idUser, rowNumber, seatNumber) {
    this.id = id;
    this.idPlane = idPlane;
    this.idUser = idUser;
    this.rowNumber = rowNumber;
    this.seatNumber = seatNumber;

}


module.exports = { User, Plane, Reservation};