import { useState } from 'react';
import { Form, Button, Alert, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const [email, setEmail] = useState('john.doe@polito.it');
  const [password, setPassword] = useState('password');

  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = {
      username: email,
      password: password
    }

    props.login(credentials)
      .then(() => navigate(-1)) //ritorna alla pagina da cui ho premuto il tasto di login
      .catch((err) => {
        setErrorMessage(err.error);
      });
  };

  return (
    <Container  style={{
     paddingLeft:"35rem",
     paddingRight:"20rem",
      
    }}>


      <h1>Login</h1>
      <Form onSubmit={handleSubmit}  >
        <Form.Group controlId='email' className="mb-2">
          <Form.Label>Email</Form.Label>
          <Form.Control type='email' value={email} onChange={ev => setEmail(ev.target.value)} required={true} />
        </Form.Group>

        <Form.Group controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} required={true} minLength={6} />
        </Form.Group>

        <Button className="mt-3 me-2 btn-dark" type="submit">Login</Button>
        <Button className="mt-3 btn-danger" onClick={() => navigate("/planes")}>Cancel</Button>

        {errorMessage ? <Alert variant='danger' onClose={() => setErrorMessage('')} dismissible>{errorMessage}</Alert> : false}

      </Form>


    </Container>
  )

};


export { LoginForm };
