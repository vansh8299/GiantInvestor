"use client"; // Ensure this is a Client Component

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Bell, PenBox, Search } from "lucide-react";

const Header = () => {

  return (
       <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-2xl font-bold text-green-600">Giant Investor</div>
          <div className="flex items-center gap-4">
            <Bell className="w-6 h-6 text-gray-600" />
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <Link href="/pages/login"><Button>Sign In</Button></Link>
            <Link href="/pages/signup"><Button>Sign Up</Button></Link>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search stocks, mutual funds & more"
              className="bg-transparent w-full ml-2 focus:outline-none"
            />
          </div>
        </div>
      </nav>

 
  );
};

export default Header;
