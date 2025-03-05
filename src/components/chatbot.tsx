"use client";

import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaChartLine } from 'react-icons/fa';

type ChatMessage = {
  id?: string;
  text: string;
  sender: 'user' | 'bot';
  createdAt?: Date;
};

const Chatbot = () =>  {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([
      {
        text: 'Welcome to Stock Market Assistant! I can help you with:' + 
              '\n- Stock price queries' +
              '\n- Market trends' +
              '\n- Investment advice' +
              '\n- Financial analysis',
        sender: 'bot'
      }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
  
    // Fetch chat history when component mounts
    useEffect(() => {
      const fetchChatHistory = async () => {
        try {
          const response = await fetch('/actions/chatbot');
          if (response.ok) {
            const chatHistory = await response.json();
            
            // Only add historical messages if they don't already exist
            const newMessages = chatHistory.filter((historyMsg: ChatMessage) => 
              !messages.some(existingMsg => existingMsg.text === historyMsg.text)
            );
            
            setMessages(prev => [...prev, ...newMessages]);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }
      };

      fetchChatHistory();
    }, []);
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
  
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
  
    const toggleChatbox = () => {
      setIsOpen(!isOpen);
    };
  
    const handleSendMessage = async () => {
      if (!message.trim()) return;
  
      // Validate stock market related prompt
      const stockMarketKeywords = [
        'stock', 'stocks', 'market', 'shares', 'trading', 
        'investment', 'portfolio', 'finance', 'financial', 
        'nasdaq', 'nyse', 'dow jones', 'price', 'trend', 'mutual fund', 
        'analysis', 'dividend', 'earnings', 'sector' ,'investments'
      ];
  
      const isStockRelated = stockMarketKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
  
      if (!isStockRelated) {
        const errorMessage: ChatMessage = {
          text: 'Sorry, I can only assist with stock market-related queries. Please ask about stocks, investments, or financial markets.',
          sender: 'bot'
        };
        setMessages((prev) => [...prev, { text: message, sender: 'user' }, errorMessage]);
        setMessage('');
        return;
      }
  
      const userMessage: ChatMessage = { text: message, sender: 'user' };
      setMessages((prev) => [...prev, userMessage]);
      setMessage('');
  
      try {
        const response = await fetch('/actions/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          const botMessage: ChatMessage = { text: data.text, sender: 'bot' };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          throw new Error(data.error || 'Failed to fetch response');
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage: ChatMessage = {
          text: 'Sorry, our stock market assistant is experiencing issues. Please try again later.',
          sender: 'bot',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    };
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* Chatbot Icon */}
        <button
          onClick={toggleChatbox}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all transform hover:scale-110"
        >
          <FaChartLine className="w-6 h-6" />
        </button>
  
        {/* Chat Box */}
        {isOpen && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-2xl w-96 h-[480px] mt-2 mb-11 flex flex-col">
            {/* Chat Box Header */}
            <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-lg font-semibold">Stock Market Assistant</h2>
              <button
                onClick={toggleChatbox}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
  
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto relative">
              <div>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-[70%] ${
                        msg.sender === 'user'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
  
            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Specify whether it is a stock or mutual funds..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaPaperPlane className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  

export default Chatbot;