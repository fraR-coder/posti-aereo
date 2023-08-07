import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { React, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


import API from './API';
import MessageContext from './messageCtx';
import { NotFoundLayout, DefaultLayout, LoadingLayout } from './components/PageLayout';
import { LoginForm } from './components/Auth';
import MainPage from './components/MainPage';
import PlanePage from './components/PlanePage';
import PastReservationsPage from './components/OldReservations';

function App() {

  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);
  // This state contains the user's info.
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  //il messaggio di errore
  const [message, setMessage] = useState('');

  //per gestire l'errore posto prenotato non libero
  const [seatsOccupied, setSeats] = useState([]);

  // If an error occurs, the error message will be shown in a toast.
  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    //caso prenotazione contemporanea di più utenti, server ritorna {occupati:[posto,...]}
    else if (err.occupati) {
      msg = "alcuni posti non sono più disponibili"
      setSeats(err.occupati);
    }
    else msg = "Unknown Error";
    setMessage(msg);
  }

  //al caricamento iniziale prendo i dati dell'utente loggato
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        //recupero user info
        const user = await API.getUserInfo();
        setUser(user);
        setLoggedIn(true); setLoading(false);
      } catch (err) {
        handleErrors(err);
        setUser(null);
        setLoggedIn(false); setLoading(false);
      }
    };
    init();
  }, []);


  /**
 * This function handles the login process.
 * It requires a username and a password inside a "credentials" object.
 */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setUser(null);
    setLoggedIn(false);
    setSeats([]);
  };

  return (
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors, seatsOccupied,setSeats,message,setMessage}}>
        <Routes>

          <Route path="/" element={loading? <LoadingLayout/> : <DefaultLayout handleLogout={handleLogout} loggedInUser={user} />} >

            <Route index element={<Navigate replace to='/planes' />} /> {/*sostituisce url corrente con nuovo percorso*/}

            <Route path='planes' element={<MainPage loggedInUser={user} />} />

            <Route path='planes/:planeType' element={<PlanePage loggedInUser={user} />} />

            <Route path='planes/booked' element={<PastReservationsPage loggedInUser={user} />} />

            <Route path="login" element={!loggedIn ? <LoginForm login={handleLogin} /> : <Navigate replace to='/planes' />} />

          </Route>

          <Route path="*" element={<NotFoundLayout />} />

        </Routes>
      </MessageContext.Provider>
    </BrowserRouter>
  )
}

export default App
