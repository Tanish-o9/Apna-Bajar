import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RefreshCcw, AlertCircle, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { fetchProducts, fetchCategories } from '../services/api';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State initialized from URL query parameters
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'default';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All', 'Electronics', 'Fashion', 'Accessories', 'Home Essentials']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParam);

  // Sync search input if URL param changes
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Load distinct categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchCategories();
        if (res && res.data && res.data.length > 0) {
          setCategories(['All', ...res.data]);
        }
      } catch (e) {
        console.warn('Could not load dynamic categories, falling back to defaults:', e.message);
      }
    };
    loadCategories();
  }, []);

  // Fetch products from backend whenever filters or sorting change
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (categoryParam && categoryParam !== 'All') {
          params.category = categoryParam;
        }
        if (searchParam && searchParam.trim() !== '') {
          params.search = searchParam.trim();
        }
        if (sortParam && sortParam !== 'default') {
          params.sort = sortParam;
        }

        const res = await fetchProducts(params);
        if (isMounted) {
          if (res && res.data) {
            setProducts(res.data);
          }
        }
      } catch (err) {
        console.error('Error fetching products from backend:', err);
        if (isMounted) {
          setError('Failed to fetch products from backend API. Please make sure the server is running.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [categoryParam, searchParam, sortParam]);

  // Handlers for updating URL query params
  const handleCategorySelect = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newParams.set('search', searchTerm.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value === 'default') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', e.target.value);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header Title */}
        <div className="products-header">
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Explore All Products</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Browse through our verified collection of authentic gadgets, clothing, and household essentials.
          </p>
        </div>

        {/* Filter and Search Controls Bar */}
        <div className="products-controls-bar">
          {/* Category Filter Pills */}
          <div className="filter-categories-pills">
            {categories.map((cat) => {
              const isActive = (cat === 'All' && !searchParams.get('category')) || categoryParam.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  className={`filter-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                  id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Filter by keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem 0.45rem 2.2rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-muted)',
                }}
              />
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </form>

            <div className="sort-select-wrapper">
              <label htmlFor="sort-dropdown" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                Sort:
              </label>
              <select
                id="sort-dropdown"
                className="sort-select"
                value={sortParam}
                onChange={handleSortChange}
              >
                <option value="default">Featured / Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Tagline */}
        {(categoryParam !== 'All' || searchParam || sortParam !== 'default') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Showing results for {categoryParam !== 'All' && <strong>Category: {categoryParam} </strong>}
              {searchParam && <strong>Search: "{searchParam}" </strong>}
              ({products.length} products found)
            </span>
            <button
              onClick={handleResetFilters}
              style={{
                color: 'var(--primary)',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <RefreshCcw size={13} /> Reset Filters
            </button>
          </div>
        )}

        {/* Product Catalog Display */}
        {loading ? (
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="product-card"
                style={{ height: '370px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                <div className="skeleton" style={{ height: '190px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '16px', width: '35%' }}></div>
                <div className="skeleton" style={{ height: '22px', width: '90%' }}></div>
                <div className="skeleton" style={{ height: '32px', width: '100%', marginTop: 'auto' }}></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" style={{ color: 'var(--danger)' }} />
            <h3 className="empty-state-title">Backend Connection Required</h3>
            <p className="empty-state-desc">{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag className="empty-state-icon" />
            <h3 className="empty-state-title">No Products Found</h3>
            <p className="empty-state-desc">
              We couldn't find any items matching your selected criteria. Try adjusting your search keywords or clearing active filters.
            </p>
            <button className="btn btn-outline" onClick={handleResetFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
