import { Alert, Button, Form } from "react-bootstrap";

import {useState } from "react";


const BookingForm = (props) => {
    const [errorMsg, setErrorMsg] = useState('');
    const [nSeats,setN]=useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if(nSeats==='' || isNaN(parseInt(nSeats)) || parseInt(nSeats)<=0) {
            setErrorMsg('inserisci un numero di posti valido')
        }
        else{
            props.selectSeats(nSeats);
            setN('');
        }
    }

    return (
        <>
        {errorMsg? <Alert variant='danger' onClose={()=>setErrorMsg('')} dismissible>{errorMsg}</Alert> : false }
        <Form className="block-example rounded mb-0 form-padding" onSubmit={handleSubmit}>
            <Form.Label>Seleziona il numero di posti da prenotare</Form.Label>
            <Form.Control type="text" value={nSeats}
                onChange={ev => setN(ev.target.value)}
                placeholder="enter a number" />
            <Button variant="primary" type="submit" className="mt-2">
                Search
            </Button>
        </Form>
        </>
        
    )
}

export default BookingForm;
