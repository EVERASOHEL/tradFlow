import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ProductAutocomplete({
  products = [],
  value,
  onChange,
  placeholder = "Search product code, name, brand...",
  disabled = false,
}) {
  const selectedProduct = products.find((p) => p.id === value);
  const [query, setQuery] = useState(
    selectedProduct ? `${selectedProduct.productCode} — ${selectedProduct.productName}` : ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 460, openUpwards: false });

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync display text when value or products list updates
  useEffect(() => {
    if (selectedProduct) {
      setQuery(`${selectedProduct.productCode} — ${selectedProduct.productName}`);
    } else if (!value) {
      setQuery("");
    }
  }, [value, selectedProduct]);

  // Filter products by search query
  const filteredProducts = products.filter((p) => {
    if (!query || (selectedProduct && query === `${selectedProduct.productCode} — ${selectedProduct.productName}`)) {
      return true;
    }
    const q = query.toLowerCase();
    return (
      p.productCode?.toLowerCase().includes(q) ||
      p.productName?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.modelNo?.toLowerCase().includes(q) ||
      p.hsnCode?.toLowerCase().includes(q)
    );
  });

  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      // Keep dropdown within viewport horizontally
      const desiredWidth = Math.max(rect.width, 460);
      let left = rect.left;
      if (left + desiredWidth > window.innerWidth - 16) {
        left = window.innerWidth - desiredWidth - 16;
      }
      if (left < 12) left = 12;

      setCoords({
        top: openUpwards ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left,
        width: desiredWidth,
        openUpwards,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setIsOpen(false);
        if (selectedProduct) {
          setQuery(`${selectedProduct.productCode} — ${selectedProduct.productName}`);
        } else if (!value) {
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedProduct, value]);

  const handleSelect = (product) => {
    onChange(product.id);
    setQuery(`${product.productCode} — ${product.productName}`);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        updatePosition();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < filteredProducts.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts[highlightIndex]) {
        handleSelect(filteredProducts[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="product-autocomplete-wrapper">
      <div className="product-autocomplete-input-box">
        <input
          ref={inputRef}
          type="text"
          className="product-autocomplete-input"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onFocus={() => {
            setIsOpen(true);
            updatePosition();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            updatePosition();
            setHighlightIndex(0);
            if (!e.target.value) {
              onChange("");
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && !disabled && (
          <button
            type="button"
            className="product-autocomplete-clear"
            onClick={handleClear}
            tabIndex={-1}
            title="Clear product"
          >
            ×
          </button>
        )}
        <span
          className="product-autocomplete-arrow"
          onClick={() => {
            if (!disabled) {
              const next = !isOpen;
              setIsOpen(next);
              if (next) {
                updatePosition();
                inputRef.current?.focus();
              }
            }
          }}
        >
          ▾
        </span>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="product-autocomplete-portal-container"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 999999,
            }}
          >
            <div className="product-autocomplete-portal-header">
              <span>Matching Products ({filteredProducts.length})</span>
              <small>Use ↑↓ to navigate, Enter to select</small>
            </div>

            <ul className="product-autocomplete-dropdown">
              {filteredProducts.length === 0 ? (
                <li className="product-autocomplete-empty">
                  No matching products found. Try typing another keyword.
                </li>
              ) : (
                filteredProducts.slice(0, 40).map((p, idx) => (
                  <li
                    key={p.id}
                    className={`product-autocomplete-option ${idx === highlightIndex ? "highlighted" : ""} ${p.id === value ? "selected" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(p);
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    <div className="product-autocomplete-option-main">
                      <span className="product-autocomplete-code">{p.productCode}</span>
                      <span className="product-autocomplete-name">{p.productName}</span>
                    </div>
                    <div className="product-autocomplete-option-meta">
                      {p.brand && <span className="product-autocomplete-brand">🏢 {p.brand}</span>}
                      <span className="product-autocomplete-price">
                        Rate: ₹{Number(p.purchasePrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="product-autocomplete-tax">GST {p.gstRate ?? 18}%</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
