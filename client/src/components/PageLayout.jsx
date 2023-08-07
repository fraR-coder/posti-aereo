import { React, useContext } from 'react';
import { Button, Spinner, Container, Toast, Row } from 'react-bootstrap';
import { Link, Outlet } from 'react-router-dom';
import MessageContext from '../messageCtx';

import MainHeader from './MainHeader';

function NotFoundLayout() {
  return (
    <>
      <h2>This is not the route you are looking for!</h2>
      <Link to="/">
        <Button variant="primary">Go Home!</Button>
      </Link>
    </>
  );
}

/**
 * This layout shuld be rendered while we are waiting a response from the server.
 */
function LoadingLayout(props) {
  return (

    <Container fluid>
      <h3>Loading, please wait...</h3>
      <Spinner className='m-2' animation="border" role="status" />
    </Container>
  )
}

function DefaultLayout(props) {

  const { message, setMessage } = useContext(MessageContext);

  return (
    <>

      <MainHeader handleLogout={props.handleLogout} loggedInUser={props.loggedInUser} />

      <Row >
        <Toast show={message !== ''} onClose={() => setMessage('')} delay={2000} autohide bg="danger" style={{marginTop:"100px"}}>
          <Toast.Body>{message}</Toast.Body>
        </Toast>
      </Row>
      <Row>
        <Outlet />
      </Row>

    </>
  )

}



export { NotFoundLayout, LoadingLayout, DefaultLayout }; 
