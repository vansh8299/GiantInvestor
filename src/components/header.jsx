// import Link from "next/link";
// import { Button } from "./ui/button";
// import { Bell, Search } from "lucide-react";
// import cookies from 'js-cookie';
// import { useEffect, useState } from "react";
// import { useSearchContext } from "@/context/SearchContext";
// import { useRouter } from "next/navigation";

// const Header = () => {
//   const [token, setToken] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const route = useRouter();

//   const debounce = (func, delay) => {
//     let timeoutId;
//     return (...args) => {
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => func(...args), delay);
//     };
//   };

//   // Fetch search results from the API
//   const fetchSearchResults = async (query) => {
//     if (!query) {
//       setSearchResults([]);
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const response = await fetch(`/actions/search?keywords=${query}`);
//       const data = await response.json();
//       if (data.bestMatches) {
//         setSearchResults(data.bestMatches);
//       } else {
//         setSearchResults([]);
//       }
//     } catch (error) {
//       console.error("Error fetching search results:", error);
//       setSearchResults([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Debounced version of fetchSearchResults
//   const debouncedFetchSearchResults = debounce(fetchSearchResults, 300);

//   // Trigger search when searchQuery changes
//   useEffect(() => {
//     debouncedFetchSearchResults(searchQuery);
//   }, [searchQuery]);

//   return (
//     <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
//       <div className="flex items-center justify-between px-4 py-3">
//         <Link href="/">
//           <div className="text-2xl font-bold text-green-600">Giant Investor</div>
//         </Link>
//         <div className="relative px-4 py-2">
//           <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-[35rem]">
//             <Search className="w-15 h-5 text-gray-400" />
//             <input
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               type="text"
//               placeholder="Search stocks, mutual funds & more"
//               className="bg-transparent w-full ml-2 focus:outline-none"
//             />
//           </div>
//           {!isLoading && searchQuery && searchResults.length === 0 && (
//             <p className="absolute mt-2 text-gray-500">No results found.</p>
//           )}
       
//           {!isLoading && searchResults.length > 0 && (
//             <div className="absolute mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-[35rem]">
//               {searchResults.map((result, index) => (
//                 <div
//                   key={index}
//                   className="p-3 hover:bg-gray-100 cursor-pointer"
//                   onClick={() => {
//                     // Handle click on a search result (e.g., navigate to a details page)
//                     route.push(`/pages/getAllStocks/${result["1. symbol"]}`);
//                   }}
//                 >
//                   <p className="font-medium">{result["2. name"]}</p>
//                   <p className="text-sm text-gray-500">{result["1. symbol"]}</p>
//                 </div>
//               ))}
        
//             </div>

//           )}
         
//         </div>
//         <div className="flex items-center gap-4">
//           {token ? (
//             // If token exists, show the Logout button
//             <Button onClick={handlelogout}>Logout</Button>
//           ) : (
//             // If token does not exist, show Sign In and Sign Up buttons
//             <>
//               <Link href="/pages/login">
//                 <Button>Sign In</Button>
//               </Link>
//               <Link href="/pages/signup">
//                 <Button>Sign Up</Button>
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Header;

// import Link from "next/link";
// import { Button } from "./ui/button";
// import { Bell, Search } from "lucide-react";
// import cookies from 'js-cookie';
// import { useEffect, useState } from "react";
// import { useSearchContext } from "@/context/SearchContext";

// const Header = () => {
//   const [token, setToken] = useState(null);
//   const { searchQuery, setSearchQuery } = useSearchContext();
//   useEffect(() => {
//     // Check for the token only after the component has mounted
//     const tokenFromCookies = cookies.get('token');
//     setToken(tokenFromCookies);
//   }, []);

//   const handlelogout = () => {
//     cookies.remove('token');
//     window.location.href = '/pages/login';
//   };

//   return (
//     <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
//       <div className="flex items-center justify-between px-4 py-3">
//         <Link href="/"><div className="text-2xl font-bold text-green-600">Giant Investor</div></Link>
//         <div className="px-4 py-2">
//         <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-[35rem]">
//           <Search className="w-15 h-5 text-gray-400" />
//           <input 
//            value={searchQuery}
//            onChange={(e) => setSearchQuery(e.target.value)}
//             type="text"
//             placeholder="Search stocks, mutual funds & more"
//             className="bg-transparent w-full ml-2 focus:outline-none"
//           />
//         </div>
        
//       </div>
//         <div className="flex items-center gap-4">
//           {token ? (
//             // If token exists, show the Logout button
//             <Button onClick={handlelogout}>Logout</Button>
//           ) : (
//             // If token does not exist, show Sign In and Sign Up buttons
//             <>
//               <Link href="/pages/login"><Button>Sign In</Button></Link>
//               <Link href="/pages/signup"><Button>Sign Up</Button></Link>
//             </>
//           )}
//         </div>
//       </div>
      
//       {/* Search Bar */}
     
//     </nav>
//   );
// };

// export default Header;



import Link from "next/link";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import cookies from 'js-cookie';
import { useEffect, useState } from "react";
import SearchDropdown from "./SearchDropdown";

const Header = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
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
        <Link href="/"><div className="text-2xl font-bold text-green-600">Giant Investor</div></Link>
        <SearchDropdown />
        <div className="flex items-center gap-4">
          {token ? (
            <Button onClick={handlelogout} className=" bg-green-600">Logout</Button>
          ) : (
            <>
              <Link href="/pages/login"><Button className=" bg-green-600">Sign In</Button></Link>
              <Link href="/pages/signup"><Button className=" bg-green-600">Sign Up</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;