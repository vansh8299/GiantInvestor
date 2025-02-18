import Link from "next/link";
import { Button } from "./ui/button";
import { Bell, Search } from "lucide-react";
import cookies from 'js-cookie';
import { useEffect, useState } from "react";

const Header = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for the token only after the component has mounted
    const tokenFromCookies = cookies.get('token');
    setToken(tokenFromCookies);
  }, []);

  const handlelogout = () => {
    cookies.remove('token');
    window.location.href = '/pages/login';
  };

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-2xl font-bold text-green-600">Giant Investor</div>
        <div className="px-4 py-2">
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-[35rem]">
          <Search className="w-15 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search stocks, mutual funds & more"
            className="bg-transparent w-full ml-2 focus:outline-none"
          />
        </div>
      </div>
        <div className="flex items-center gap-4">
          {token ? (
            // If token exists, show the Logout button
            <Button onClick={handlelogout}>Logout</Button>
          ) : (
            // If token does not exist, show Sign In and Sign Up buttons
            <>
              <Link href="/pages/login"><Button>Sign In</Button></Link>
              <Link href="/pages/signup"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>
      </div>
      
      {/* Search Bar */}
     
    </nav>
  );
};

export default Header;