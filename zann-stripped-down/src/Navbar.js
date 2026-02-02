import { Link } from 'react-router-dom';

const Navbar = () => {
    return ( 
        <nav className="navbar">
            <h1>Zann Consortium</h1>
            <div className="links">
                <Link to="/">Home</Link>
                <Link to="/circle">Circle</Link>
                <Link to="/discord">Discord</Link>
                <Link to="/history">History</Link>
            </div>
        </nav>
    );
}
 
export default Navbar;