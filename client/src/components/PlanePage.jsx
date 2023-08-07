import { Button, Col, Container, Row, Card, Table, Form, Toast, ListGroup } from 'react-bootstrap';

import { useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';

import MessageContext from '../messageCtx.js';
import { createGridOfSeats } from '../models.js';
import API from '../API.js';
import { LoadingLayout } from './PageLayout.jsx';
import BookingForm from './BookingForm.jsx';


// Componente che mostra la pagina web
const PlanePage = (props) => {

  const { handleErrors, seatsOccupied,setSeats } = useContext(MessageContext);

  //informazioni sul singolo aereo
  const [planeInfo, setPlaneInfo] = useState(undefined);
  //matrice di posti   0->posto libero  1-> occupato 
  const [reservations, setReservations] = useState([]);
  //posti selezionati per la prenotazione
  const [selectedSeats, setSelectedSeats] = useState([]);

  //il parametro /planes/planeType
  const { planeType } = useParams();
  //indica se l'utente ha già effettuato una prenotazione per questo aereo
  const [hasBooked, setBooked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(true);
  //evidenzia il messaggio di successo della prenotazione
  const [success, setSuccess] = useState('');

  //chiamata quando cambio tipo di aereo, altrimenti dirty ancora false
  useEffect(() => {
    setDirty(true);
  }, [planeType])

  //if iniziale per evitare chiamata doppia
  useEffect(() => {
    if (dirty) {
      setLoading(true);
      API.getPlaneInfoAndRes(planeType) //ritorna oggetto {info:Plane, reservations:Array(Reservation)}
        .then((plane) => {
          setPlaneInfo(plane.info);
          //prenotazioni mappate in una matrice 
          setReservations(createGridOfSeats(plane.reservations, plane.info.nRows, plane.info.nSeats));

          //all'inizio nessun posto selezionato
          setSelectedSeats([]);
          //clear posti lista posti visualizzati per l'errore
          setSeats([]);
          //check se l'utente loggato ha già fatto una prenotazione per l'aereo
          if (props.loggedInUser && plane.reservations.some((res) => res.idUser == props.loggedInUser.id)) {
            setBooked(true);
          }
          else {
            setBooked(false);
          }
          setLoading(false);
          setDirty(false);
        })
        .catch((err) => { handleErrors(err); });
    }
  }, [planeType, dirty]);

  //chiamata quando aggiorno i posti selezionati, propaga l'aggiornamento alla matrice
  useEffect(() => {
    setReservations((prevReservations) =>
      prevReservations.map((row, rowIndex) =>
        row.map((seat, seatIndex) => {
          //cerca tra i posti selezionati se uno matcha con indice di riga e colonna
          const isSelected = selectedSeats.some(
            (selectedSeat) =>
              selectedSeat.fila === rowIndex && selectedSeat.posto === seatIndex
          );
          // se il posto è selezionato mette -1 (giallo)
          //se non è selezionato ma vale -1, lo mette a 0 (libero)
          return isSelected ? -1 : seat === -1 ? 0 : seat;
        })
      )
    );
  }, [selectedSeats]);

  //utilizzata per l'errore dei posti prenotati da altri durante il completamento della mia prenotazione
  useEffect(() => {
    if (seatsOccupied.length > 0) {
      setReservations((prevReservations) =>
        prevReservations.map((row, rowIndex) =>
          row.map((seat, seatIndex) => {
            //cerca tra i psoti selezioanti se uno matcha con indice di riga e colonna
            const isOccupied = seatsOccupied.some(
              (occupato) =>
                occupato.fila === rowIndex && occupato.posto === seatIndex
            );
            // se il posto è occupato mette 2 (grigio)
            return isOccupied ? 2 : seat;
          })
        )
      );
      //dopo 5 secondi forzo il ricaricamento dei dati dal db per ottenere la visualizzazione aggiornata
      setTimeout(() => setDirty(true), 5000);
    }
  }, [seatsOccupied])

  //riceve numero di posti da prenotare
  const addReservation = (n, seats) => {
    if (n === 0) {
      handleErrors({ error: "devi selezionare almeno 1 posto" })
      return;
    }
    //crea oggetto da passare al server che contiene l'array di posti da prenotare
    const res = { planeType: planeInfo.type, seats: seats };

    API.addReservation(res)
      .then(() => {
        setDirty(true);
        setSelectedSeats([]);
        setBooked(true);
        setSuccess("Prenotazione avvenuta con successo");
      })
      .catch((err) => { handleErrors(err); });

  }

  const selectSeats = (n) => {

    if (hasBooked) {
      handleErrors({ error: "hai già effettuato una prenotazione per questo volo" });
      return;
    }
    if (n > planeInfo.nFree) {
      handleErrors({ error: "non ci sono abbastanza posti liberi per questo aereo" })
      return;
    }
    let selected = [];
    //crea array di posti selezionati, scorre la matrice e seleziona ogni posto libero che trova fino al numero richiesto
    for (let i = 0; i < reservations.length && n > 0; i++) {
      for (let j = 0; j < reservations[i].length && n > 0; j++) {
        //il posto è selezionabile se è libero (0) o selezionato manualmente dallo stesso utente (-1)
        if (reservations[i][j] !== 1) {
          selected.push({ fila: i, posto: j });
          n--;
        }
      }
    }
    setSelectedSeats(selected);
  }

  return (
    <>
      {loading ? <LoadingLayout />
        :

        <Container fluid style={{ display: "block", width: "93rem", marginTop: "100px" }}>
          <Row >
            {/*prima colonna a sx*/}
            <Col style={{
              display: "block",
              paddingLeft: "2rem",
              paddingRight: "3rem",
            }}>
              <PlaneInfo planeInfo={planeInfo} />

              <Container fluid style={{ paddingTop: "20px" }} >
                {props.loggedInUser ?

                  <BookingForm selectSeats={selectSeats} />

                  :

                  <Form>
                    <fieldset disabled>
                      <Form.Label htmlFor="disabledTextInput">Effettua il login per prenotare</Form.Label>
                      <Form.Control id="disabledTextInput" placeholder="Disabilitato" />
                    </fieldset>

                  </Form>

                }
              </Container>
            </Col>
            {/*colonna centrale*/}
            <Col style={{
              display: "block",
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}>
              <PlaneGrid reservations={reservations} planeInfo={planeInfo} setError={handleErrors}
                loggedInUser={props.loggedInUser} hasBooked={hasBooked}
                setSelectedSeats={setSelectedSeats} />
            </Col>
            {/*colonna a dx */}
            <Col style={{
              display: "block",
              paddingLeft: "3rem",
              paddingRight: "2rem",
            }}>

              {hasBooked ?

                <>
                  <Toast bg="warning">
                    <Toast.Body>Attenzione, hai già effettuato una prenotazione per questo volo</Toast.Body>
                  </Toast>
                  <Toast show={success !== ''} onClose={() => setSuccess('')} delay={3000} autohide bg="success">
                    <Toast.Body>{success}</Toast.Body>
                  </Toast>
                </>

                :
                props.loggedInUser ?
                  //se non ho prenotato e sono loggato
                  <Finalization selectedSeats={selectedSeats}
                    setSelectedSeats={setSelectedSeats} addReservation={addReservation} />

                  :
                  <Toast bg="warning">
                    <Toast.Body>Effettua il login per prenotare</Toast.Body>
                  </Toast>


              }
            </Col>
          </Row>
        </Container >
      }
    </>
  );
};

// Componente che mostra le informazioni sull'aereo
const PlaneInfo = (props) => {
  const plane = props.planeInfo;
  return (
    <Card className='bg-dark text-light'>
      <Card.Body>
        <Card.Title>Informazioni sull'aereo</Card.Title>
        <Card.Text>
          Tipo di aereo: {plane.type}
        </Card.Text>
        <Card.Text>
          Posti liberi: {plane.nFree}
        </Card.Text>
        <Card.Text>
          Posti occupati: {plane.nOccupied}
        </Card.Text>
        <Card.Text>
          Numero file: {plane.nRows}
        </Card.Text>
        <Card.Text>
          Numero posti per fila: {plane.nSeats}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};


function PlaneGrid(props) {
  const rows = props.planeInfo.nRows; // Il numero di righe della griglia
  const cols = props.planeInfo.nSeats; // Il numero di colonne della griglia
  const grid = props.reservations;// la matrice di posti

  const handleClick = (fila, posto) => {

    if (props.hasBooked) {
      props.setError({ error: "hai già effettuato una prenotazione per questo aereo" })
      return;
    }
    if (grid[fila][posto] == 1 || grid[fila][posto] ==2) {
      props.setError({ error: "non puoi selezionare un posto già prenotato" })
    }
    //rimuovo il posto dalla lista, deseleziono un posto
    else if (grid[fila][posto] === -1) {
      props.setSelectedSeats(old => { return old.filter(seat => !(seat.fila === fila && seat.posto === posto)); })
    }
    //posto libero viene selezionato,aggiungo il posto alla lista
    else {
      props.setSelectedSeats(old => [...old, { fila: fila, posto: posto }]);
    }

  };

  return (
    <Table size="sm" >
      <tbody>

        {//crea array di lunghezza rows
          [...Array(rows)].map((_, row) => (
            // Mappa ogni riga della griglia in una riga della tabella
            <tr key={row}>
              {//per ogni riga crea un array di lunghezza cols
                [...Array(cols)].map((_, col) => (
                  // Mappa ogni colonna della griglia in una cella della tabella
                  <td key={col}  >
                    {/*row è indice di linea,col indice di colonna*/}
                    <SeatInfo grid={grid} fila={row} posto={col}
                      handleClick={handleClick} isLoggedIn={props.loggedInUser} />
                  </td>
                ))}
            </tr>
          ))}
      </tbody>
    </Table>
  );
}


function SeatInfo(props) {

  return (
    <>
      <Button className='align-self-center' // Imposta il colore del bottone a seconda del valore della cella
        variant={
          props.grid[props.fila][props.posto] === 0 ? "outline-success" : //libero
            props.grid[props.fila][props.posto] === -1 ? "warning" :    //selezionato
              props.grid[props.fila][props.posto] === 2 ? "secondary" : "danger"  //prenotato
        }

        onClick={() => props.handleClick(props.fila, props.posto)}
        disabled={!props.isLoggedIn}>

        {props.fila + 1 + "" + String.fromCharCode(65 + props.posto)}
      </Button>
    </>
  )

}


function Finalization(props) {

  const seats = props.selectedSeats;
  const annulla = () => {
    if (seats.length === 0) {
      return;
    }
    //deseleziona i posti selezionati
    props.setSelectedSeats([]);
  }

  return (
    <Card >
      <Card.Body>
        <Card.Title>Conferma Prenotazione</Card.Title>
        <ListGroup>
          {seats.map((seat, index) => (
            <ListGroup.Item key={index} variant='warning' className='text-center'>
              {seat.fila + 1}{String.fromCharCode(65 + seat.posto)}
            </ListGroup.Item>
          ))}
        </ListGroup>
        <Button onClick={() => props.addReservation(seats.length, seats)} variant="success" className='mt-3 me-2'>
          CONFERMA
        </Button>
        <Button onClick={() => annulla()} variant="danger" className='mt-3'>
          RIPRISTINA
        </Button>
      </Card.Body>
    </Card >
  )
}


export default PlanePage