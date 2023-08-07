import { Button, Col, Container, Row, ListGroup } from 'react-bootstrap';
import API from '../API.js';
import { useContext, useEffect, useState } from 'react';
import MessageContext from '../messageCtx.js';
import { LoadingLayout } from './PageLayout.jsx';

// Componente che mostra la pagina web
const PastReservationsPage = (props) => {

    const { handleErrors } = useContext(MessageContext);

    const [reservations, setReservations] = useState([]); //array di reservations 
    
    const [dirty, setDirty] = useState(true);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (dirty) {
            setLoading(true);
            API.getUserReservations(props.loggedInUser.id)
                .then((reservations) => { 
                    //reservations ={locale:[],regionale:[],internazionale:[]}
                    //se non ho  prenotazioni è un oggetto vuoto
                    setReservations(reservations);
                    setDirty(false);
                    setLoading(false)
                })
                .catch((err) => { handleErrors(err); });
        }

    }, [dirty]);

    //cancella tutti i posti prenotati dall'utente per un tipo di aereo
    const deleteReservation = (planeType) => {
        API.deleteReservation(planeType)
            .then(() => { setDirty(true) })
            .catch(err => { handleErrors(err); })

    }

    return (
        <Container fluid style={{ width: "93rem", }}>
            {loading ? <LoadingLayout />
                :
                <Row>
                    <h1 style={{ paddingLeft: "30rem", paddingRight: "10rem" }}>Le tue prenotazioni</h1>
                    <Col style={{ paddingLeft: "30rem", paddingRight: "10rem" }}>
                        {Object.keys(reservations).length > 0 ?
                            <ListGroup variant="flush" className='' >
                                {Object.entries(reservations).map((entry) => {
                                    //entry è array [tipo, vettore posti]
                                    return < Riga key={entry[0]} booking={entry} deleteBooking={deleteReservation} />

                                })}
                            </ListGroup>
                            :
                            <h3>Nessuna prenotazione effettuata</h3>
                        }
                    </Col>
                </Row>
            }
        </Container>

    );
};


const Riga = ({ booking, deleteBooking }) => {

    const [hide, setHide] = useState(true);

    return (
        <Row>
            <Col>
                <ListGroup.Item onClick={() => setHide(!hide)} className='border-dark rounded ' action >
                    <Row >
                        <Col md="auto"><h4>Aereo {booking[0]}</h4></Col>
                        <Col>
                            <div className="justify-content-end">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-down-circle" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z" />
                                </svg>
                            </div>
                        </Col>
                        <div hidden={hide}>
                            <ul>
                                <li> Posti:{" "}
                                    {booking[1]
                                        .map((seat) => seat.row + 1 + String.fromCharCode(65 + seat.seat))
                                        .join(", ")}</li>
                            </ul>
                        </div>
                    </Row>
                </ListGroup.Item>
            </Col>
            <Col>
                <Button variant="danger" onClick={() => deleteBooking(booking[0])} >
                    Cancella
                </Button>
            </Col>

        </Row >


    );
};

export default PastReservationsPage