import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "./Card";
import './index.css'; // Ensure Tailwind CSS is imported

const App = () => {
  const [link, setLink] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    console.log('Updated Products:', products); 
  }, [products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/api/products", { url: link });
      console.log('API Response:', response.data);
      const products = response.data.products; 
      if (Array.isArray(products)) {
        const slicedProducts = products.slice(1, 6); // Adjusted slice to take first 6 products
        setProducts(slicedProducts); 
      } else {
        console.error('Unexpected API response format:', products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-5 flex flex-col items-center" data-theme="luxury">
      <nav className="bg-info-content shadow-sm shadow-white border-none rounded-lg flex justify-center p-4 w-1/2">
        <h1 className="text-4xl text-white font-semibold font-mono">Welcome</h1>
      </nav>
      <form onSubmit={handleSubmit} className="my-5 p-8 flex flex-col gap-4 items-center">
        <h2 className="text-2xl font-semibold font-mono">Web Scraping</h2>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Enter a link"
          className="p-2 w-96 border border-gray-300 rounded font-mono"
        />
        <button type="submit" className="px-6 py-2 mt-4 bg-accent hover:bg-secondary text-white rounded font-mono">
          Submit
        </button>
      </form>
      <div className="flex flex-col font-mono gap-5">
        {loading ? (
          <>
            <div className="skeleton h-32 w-96 mb-4"></div>
            <div className="skeleton h-32 w-96 mb-4"></div>
            <div className="skeleton h-32 w-96 mb-4"></div>
            <div className="skeleton h-32 w-96 mb-4"></div>
            <div className="skeleton h-32 w-96 mb-4"></div>
          </>
        ) : (
          Array.isArray(products) && products.length > 0 ? (
            products.map((product) => (
              <Card key={product.loc} product={product} />
            ))
          ) : (
            <p>No products available</p>
          )
        )}
      </div>
    </div>
  );
};

export default App;
