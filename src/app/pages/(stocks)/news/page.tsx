"use client"

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface NewsItem {
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: { topic: string; relevance_score: string }[];
    overall_sentiment_score: number;
    overall_sentiment_label: string;
    ticker_sentiment: {
        ticker: string;
        relevance_score: string;
        ticker_sentiment_score: string;
        ticker_sentiment_label: string;
    }[];
}

const News = () => {
    const [newsData, setNewsData] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Number of items per page
  const router = useRouter();
    useEffect(() => {
        const fetchNewsData = async () => {
            try {
                const response = await fetch('/actions/news'); // Assuming your route is at /api/news
                const data = await response.json();
                setNewsData(data.feed);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                setError('Failed to fetch news data');
            } finally {
                setLoading(false);
            }
        };

        fetchNewsData();
    }, []);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = newsData.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(newsData.length / itemsPerPage);

    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    if (loading) {
        return (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
          </div>
        );
      }
    
    if (error) return <div>{error}</div>;
    const goBack = () => {
        router.back();
      }
    return (
      
        <div className="max-w-7xl mx-auto px-4 mt-24">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4 mt-12">
            <Button className="bg-green-600" onClick={goBack}>Go Back</Button>
            <h1 className="text-3xl font-bold text-center flex-grow">Latest News on Giant Investor</h1>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                        {item.banner_image && (
                            <img
                                src={item.banner_image}
                                alt={item.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-4 flex flex-col flex-grow">
                            <h2 className="text-xl font-semibold mb-2 truncate">{item.title}</h2>
                            <p className="text-gray-600 mb-4 line-clamp-3">{item.summary}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                                <span>{item.source}</span>
                            </div>
                            <div className="mt-4">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Read More
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8 items-center">
                <button 
                    onClick={prevPage} 
                    disabled={currentPage === 1} 
                    className="mx-1 px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="mx-4 text-gray-700">Page {currentPage} of {totalPages}</span>
                <button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages} 
                    className="mx-1 px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default News;