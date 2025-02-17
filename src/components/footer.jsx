"use client"; // Ensure this is a Client Component


const Footer = () => {

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200">
    <div className="flex justify-around py-3">
      {['Explore', 'Investments', 'Orders', 'Profile'].map((item) => (
        <button key={item} className="flex flex-col items-center text-gray-600">
          <div className="w-6 h-6 mb-1 bg-gray-200 rounded-full" />
          <span className="text-xs">{item}</span>
        </button>
      ))}
    </div>
  </nav>

 
  );
};

export default Footer;
