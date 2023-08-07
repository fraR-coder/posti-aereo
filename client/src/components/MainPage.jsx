import { Button, CardGroup, Card  } from 'react-bootstrap';

import {  useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';

import MessageContext from '../messageCtx.js';
import { LoadingLayout } from './PageLayout.jsx';
import API from '../API.js';

function MainPage(props) {

  const { handleErrors } = useContext(MessageContext);
  const [planes, setPlanes] = useState([]); //lista di arerei con relative informazioni
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    setTimeout(() => {
      API.getAllPlanes()
        .then((planes) => {
          setPlanes(planes);
          setLoading(false);
        })
        .catch((err) => {  handleErrors(err); });
    }, 300);

  }, []);//ricaricamento effettuato ogni volta che il componente viene renderizzato


  return (
    <>
      {loading ? <LoadingLayout />
        :
          <CardGroup className="justify-content-center " style={{paddingLeft:"70px"}}>
            {planes.map((plane) => (
              // Mappa ogni oggetto Plane in una Card usando la funzione PlaneCard
              <PlaneCard key={plane.id} plane={plane} />
            ))
            }
          </CardGroup>

       
      }
    </>

  );
}

function PlaneCard(props) {
  const navigate = useNavigate();
  const { id, nFree, nOccupied, type, nTotal,nRows,nSeats } = props.plane; // Destrutturazione dell'oggetto Plane

  return (

    <Card className="m-3 rounded border border-dark bg-dark text-white ">
      <Card.Body className="d-flex flex-column justify-content-between">
        <Card.Title className='align-self-center'>{type}</Card.Title>
        <Card.Text className='align-self-center'>
          Ci sono {nRows} file da {nSeats} posti
        </Card.Text>
        <Card.Text className='align-self-center'>
          Questo aereo ha {nTotal} posti, di cui {nFree} liberi e {nOccupied} occupati.
        </Card.Text>
        <Button className="btn-light align-self-center"
          onClick={() => { navigate("/planes/" + type) }}>
          Vedi dettagli
        </Button>
      </Card.Body>
    </Card>
  )
}

export default MainPage;