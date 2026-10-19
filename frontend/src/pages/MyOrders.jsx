import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Printer,
  Check,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchOrdersApi, formatPrice } from '../services/api';

const MyOrders = () => {
  const { demoSessionId, showToast } = useCart();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const newOrderPlaced = location.state?.newOrderPlaced;
  const newOrderId = location.state?.orderId;

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      if (!demoSessionId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetchOrdersApi(demoSessionId);
        if (isMounted) {
          // BUG F8 (My Orders): Expects res.orders instead of res.data, causing orders state to remain empty
          if (res && res.orders) {
            setOrders(res.orders);
            if (res.orders.length > 0) {
              setExpandedOrders({ [res.orders[0]._id]: true });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'Failed to load orders. Please make sure the backend server is running.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [demoSessionId]);

  const toggleExpand = (id) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied Order ID: #${id.slice(-8).toUpperCase()}`, 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="badge badge-warning">
            <Clock size={12} /> Pending
          </span>
        );
      case 'Confirmed':
        return (
          <span className="badge badge-primary">
            <CheckCircle size={12} /> Confirmed
          </span>
        );
      case 'Shipped':
        return (
          <span className="badge badge-accent">
            <Truck size={12} /> Shipped
          </span>
        );
      case 'Delivered':
        return (
          <span className="badge badge-success">
            <CheckCircle size={12} /> Delivered
          </span>
        );
      default:
        return <span className="badge badge-primary">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Celebration Banner for New Orders */}
        {newOrderPlaced && (
          <div
            style={{
              padding: '1.5rem 1.75rem',
              backgroundColor: 'var(--success-bg)',
              border: '1.5px solid var(--success-border)',
              borderRadius: 'var(--radius-lg)',
              color: '#065f46',
              marginBottom: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <CheckCircle size={36} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#064e3b' }}>
                Order Placed Successfully!
              </h3>
              <p style={{ fontSize: '0.925rem', marginTop: '0.3rem', color: '#047857' }}>
                Your order is confirmed with simulated Cash on Delivery. Order ID:{' '}
                <strong style={{ fontFamily: 'monospace' }}>#{newOrderId ? newOrderId.slice(-8).toUpperCase() : 'NEW'}</strong>.
                You can inspect the status and item details below.
              </p>
            </div>
          </div>
        )}

        {/* Page Heading */}
        <div style={{ marginBottom: '2.25rem' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.35rem' }}>My Orders &amp; History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Track active shipments, view item receipts, and inspect order details.
          </p>
        </div>

        {/* Order History Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="order-card"
                style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div className="skeleton" style={{ height: '36px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '28px', width: '35%' }}></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon-box" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <AlertCircle size={36} />
            </div>
            <h3 className="empty-state-title">Unable to Load Orders</h3>
            <p className="empty-state-desc">{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon-box">
              <Package size={38} />
            </div>
            <h2 className="empty-state-title">No Orders Placed Yet</h2>
            <p className="empty-state-desc">
              You haven't placed any purchases in this session yet. Explore our verified products, add items to cart, and place a simulated COD order!
            </p>
            <Link to="/products" className="btn btn-primary btn-lg" id="orders-browse-catalog-btn">
              Browse Full Catalog <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const isExpanded = expandedOrders[order._id];
              const shortId = order._id.slice(-8).toUpperCase();
              return (
                <div key={order._id} className="order-card" id={`order-${order._id}`}>
                  {/* Order Card Header */}
                  <div className="order-card-header">
                    <div className="order-meta-group">
                      <div className="order-meta-item">
                        <span className="order-meta-label">Order Number</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="order-meta-value" style={{ fontFamily: 'monospace' }}>
                            #{shortId}
                          </span>
                          <button
                            onClick={() => handleCopyOrderId(order._id)}
                            style={{ color: 'var(--text-light)', cursor: 'pointer', padding: '0.15rem' }}
                            title="Copy full Order ID"
                          >
                            {copiedId === order._id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="order-meta-item">
                        <span className="order-meta-label">Date Placed</span>
                        <span className="order-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="order-meta-item">
                        <span className="order-meta-label">Total Amount</span>
                        <span className="order-meta-value" style={{ color: 'var(--primary)', fontWeight: '800' }}>
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {getStatusBadge(order.orderStatus)}
                      <button
                        onClick={() => toggleExpand(order._id)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.45rem 0.85rem' }}
                      >
                        {isExpanded ? (
                          <>
                            Hide <ChevronUp size={15} />
                          </>
                        ) : (
                          <>
                            Details <ChevronDown size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Delivery Milestone Timeline Tracker */}
                  <div className="order-timeline-strip">
                    <div className="timeline-step completed">
                      <span className="timeline-dot">✓</span>
                      <span className="timeline-label">Order Placed</span>
                    </div>
                    <div className="timeline-step active">
                      <span className="timeline-dot">2</span>
                      <span className="timeline-label">Confirmed</span>
                    </div>
                    <div className="timeline-step">
                      <span className="timeline-dot">3</span>
                      <span className="timeline-label">In Transit</span>
                    </div>
                    <div className="timeline-step">
                      <span className="timeline-dot">4</span>
                      <span className="timeline-label">Delivered</span>
                    </div>
                  </div>

                  {/* Expandable Order Details */}
                  {isExpanded && (
                    <>
                      {/* Products List */}
                      <div className="order-items-table">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Item Breakdown ({order.items.length})
                          </h4>
                          <button
                            onClick={() => window.print()}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            <Printer size={13} /> Print Invoice
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="order-product-row">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: 'var(--primary-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Package size={18} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                    {item.productName}
                                  </div>
                                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                                    Quantity: {item.quantity} &times; {formatPrice(item.unitPrice)}
                                  </div>
                                </div>
                              </div>
                              <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>
                                {formatPrice(item.lineTotal)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Summary & Shipping Address */}
                      <div className="order-card-footer">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', maxWidth: '460px' }}>
                          <MapPin size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.9rem' }}>
                              Delivery Recipient: {order.customerName} (+91 {order.phone})
                            </strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.15rem' }}>
                              {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                              {order.shippingAddress.state} - {order.shippingAddress.pincode}
                            </p>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                            Subtotal: {formatPrice(order.subtotal)} | Delivery:{' '}
                            {order.deliveryCharge === 0 ? <strong style={{ color: 'var(--success)' }}>FREE</strong> : formatPrice(order.deliveryCharge)}
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                            Grand Total: <span style={{ color: 'var(--primary)' }}>{formatPrice(order.totalAmount)}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '700' }}>
                            Payment Method: Cash on Delivery (COD)
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
