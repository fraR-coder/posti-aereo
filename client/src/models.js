"use strict";

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

//riceve una lista di Reservations
function createGridOfSeats(reservations, nRows, nCols) {
  
  //ottengo una lista di oggetti {row, col}
  //sarebbe la lista di posti prenotati, indicati come indice di riga e colonna
  const list = reservations.map(r => { return { row: r.rowNumber, col: r.seatNumber } });

  let matrix = [];

  for (let i = 0; i < nRows; i++) {
    matrix[i] = [];
    for (let j = 0; j < nCols; j++) {
      matrix[i][j] = 0; 
    }
  }
  //per ogni posto prenotato modifico la cella della matrice
  for (let seat of list) {
    matrix[seat.row][seat.col] = 1;
  }
  return matrix;
}





export { Plane, Reservation, createGridOfSeats};