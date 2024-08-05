import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Card = ({ product }) => {
  const [description, setDescription] = useState("");
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let currentText = product.summary || "";
    let index = 0;

    const interval = setInterval(() => {
      setDisplayedText(currentText.slice(0, index));
      if (index >= currentText.length) {
        clearInterval(interval);
      } else {
        index++;
      }
    }, 15); // Adjust speed as needed

    return () => clearInterval(interval);
  }, [product.summary]);

  return (
    <div
      className="card card-side max-w-6xl bg-base-100  shadow-sm hover:shadow-md hover:shadow-slate-400 transform transition-transform duration-300 hover:scale-105"
      data-theme="luxury"
    >
      <figure className="flex-none w-60 h-60">
        <img
          src={product.images[0]?.url || "https://via.placeholder.com/400x300"}
          alt={product.images[0]?.title || "Product Image"}
          className="w-full h-full object-cover"
        />
      </figure>
      <div className="p-4 card-body bg-neutral rounded-lg flex-1 transition-colors duration-300 hover:bg-neutral-focus">
        <h2 className="card-title">
          {product.images[0]?.title || "Product Title"}
        </h2>
        <p className="text-primary text-sm mb-4">
          {displayedText}
        </p>
        <div className="card-actions justify-end">
          <Link to={product.loc} target="_blank">
            <button className="btn btn-primary px-4 py-2 bg-accent hover:bg-black text-white rounded-lg shadow transition-all duration-300 hover:shadow-lg">
              More..
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Card;
