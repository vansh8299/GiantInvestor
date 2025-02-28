import { signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import cookies from 'js-cookie';
import { useEffect, useState } from "react";
import SearchDropdown from "./SearchDropdown";

const Header = () => {
  const [token, setToken] = useState(null);
  const [googletoken, setGoogleToken] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Check regular token
      const tokenFromCookies = cookies.get('token');
      setToken(tokenFromCookies);

      // Check Next.js session
      const nextAuthToken = cookies.get('next-auth.session-token');
      setGoogleToken(nextAuthToken);

      // Get Next.js session
      const sessionData = await getSession();
      setSession(sessionData);
    };

    checkAuth();
  }, []);

  // const handleLogout = async () => {
  //   try {
  //     // Remove all cookies related to authentication
  //     cookies.remove('token');
  //     cookies.remove('next-auth.session-token');
  //     cookies.remove('next-auth.csrf-token');
  //     cookies.remove('next-auth.callback-url');
      
  //     // Also remove cookies in case they were set with different domains/paths
  //     cookies.remove('token', { path: '/' });
  //     cookies.remove('next-auth.session-token', { path: '/' });
  //     cookies.remove('next-auth.csrf-token', { path: '/' });
  //     cookies.remove('next-auth.callback-url', { path: '/' });

  //     // Sign out from NextAuth
  //     await signOut({ 
  //       callbackUrl: '/pages/login',
  //       redirect: false 
  //     });

  //     // Clear any local storage items if you're using them
  //     localStorage.clear();
      
  //     // Force a hard redirect to ensure complete session cleanup
  //     window.location.href = '/pages/login';
  //   } catch (error) {
  //     console.error('Error during logout:', error);
  //     // Fallback redirect in case of error
  //     window.location.href = '/pages/login';
  //   }
  // };

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/">
          <div className="text-2xl font-bold text-green-600">Giant Investor</div>
        </Link>
        <SearchDropdown />
        <div className="flex items-center gap-4">
        {(token || googletoken || session) ? (
            <Button className="bg-green-600">
              About
            </Button>
          ) : (
            <>
              <Link href="/pages/login">
                <Button className="bg-green-600">Sign In</Button>
              </Link>
              <Link href="/pages/signup">
                <Button className="bg-green-600">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;