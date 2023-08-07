import {  Navbar, Button, Nav } from 'react-bootstrap';
import {  useLocation, useNavigate, useParams } from 'react-router-dom';


export default function MainHeader(props) {

    //name è settato se l'utente è loggato e esiste il campo name
    const name = props.loggedInUser && props.loggedInUser.name;

    const navigate = useNavigate();
    const location = useLocation();

    const { planeType } = useParams(); //il parametro planeType  nell'url

    // se planeType true allora type=planeType
    // altrimenti se la location è /planes type=All Planes, se è /login type=Login altrimenti type=Prenotazioni
    const type = planeType || (location.pathname === "/planes" ? 'All planes' : location.pathname==="/login" ?"Login" : "Prenotazioni"); 

    const onLogout = () => {
        props.handleLogout();
        // Go back to main screen
        navigate("/");
    }

    return (
        <>
            <Navbar bg="dark" className="navbar navbar-expand-md navbar-dark fixed-top navbar-padding">
                
                <>
                    <div className="d-flex align-items-center" style={{
                        paddingLeft:"50px"
                    }}>
                        <div>
                            <h1 className="text-white">{type}</h1>
                        </div>
                        <Button className=" btn-dark btn-outline-light ms-3" onClick={() => navigate("/planes")}>
                            Planes
                        </Button>
                    </div>
                </>

                {name ?
                    <>
                        <Nav.Item>
                            <Button className='mx-2 btn-dark btn-outline-light'
                                onClick={() => navigate("/planes/booked")}>Booked</Button>

                        </Nav.Item>

                        <Navbar.Collapse className="justify-content-end">
                            <Navbar.Text className='fs-5'>
                                {"Welcome " + name}
                            </Navbar.Text>

                            <Nav.Item>
                                <Button className='mx-2 btn-sm  btn-outline-light' variant='danger' onClick={onLogout}>Logout</Button>
                            </Nav.Item>
                            &nbsp;
                            &nbsp;
                        </Navbar.Collapse>

                    </>
                    :
                    <Navbar.Collapse className="justify-content-end mx-2">
                    <Nav.Item className='fs-5'>
                        <Button className="btn-sm btn-dark btn-outline-light" onClick={() => navigate("/login")}>
                            <svg
                                className="bi bi-people-circle"
                                width="30"
                                height="30"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M13.468 12.37C12.758 11.226 11.195 10 8 10s-4.757 1.225-5.468 2.37A6.987 6.987 0 008 15a6.987 6.987 0 005.468-2.63z" />
                                <path
                                    fillRule="evenodd"
                                    d="M8 9a3 3 0 100-6 3 3 0 000 6z"
                                    clipRule="evenodd"
                                />
                                <path
                                    fillRule="evenodd"
                                    d="M8 1a7 7 0 100 14A7 7 0 008 1zM0 8a8 8 0 1116 0A8 8 0 010 8z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            LOGIN
                        </Button >
                        &nbsp;
                        &nbsp;
                      
                    </Nav.Item>
                    </Navbar.Collapse>
                }
            </Navbar>

        </>
    );
}
