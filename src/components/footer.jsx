"use client"; // Ensure this is a Client Component

import Link from 'next/link';
import { FaCompass, FaChartLine, FaUser } from 'react-icons/fa'; // Import icons from react-icons

const Footer = () => {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200">
      <div className="flex justify-around py-3">
        {/* Explore Button */}
      <Link href="/">  <button className="flex flex-col items-center text-gray-600 hover:text-green-600 transition-colors">
          <FaCompass className="w-6 h-6 mb-1" />
          <span className="text-xs">Explore</span>
        </button></Link>

        {/* Investments Button */}
        <Link href="/pages/portfolio"> <button className="flex flex-col items-center text-gray-600 hover:text-green-500 transition-colors">
          <FaChartLine className="w-6 h-6 mb-1" />
          <span className="text-xs">Investments</span>
        </button></Link>

        {/* Profile Button */}
        <Link href="/pages/profile">  <button className="flex flex-col items-center text-gray-600 hover:text-green-600 transition-colors">
          <FaUser className="w-6 h-6 mb-1" />
          <span className="text-xs">Profile</span>
        </button></Link>
      </div>
    </nav>
  );
};

export default Footer;