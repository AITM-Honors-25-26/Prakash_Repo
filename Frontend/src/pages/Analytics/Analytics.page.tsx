import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import Layout from '../../components/layout/layout.js';
import styles from './AnalyticsPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants.js';

interface Overview {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  pendingKitchenOrders: number;
  ordersByStatus: Record<string, number>;
}

interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  name: string;
  quantitySold: number;
  revenue: number;
}

const RANGE_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
];

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [rangeDays, setRangeDays] = useState<number>(7);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('qr_accessToken');
    localStorage.removeItem('qr_refreshToken');
    localStorage.removeItem('qr_user');
    toast.error('Session expired. Please log in again.');
    navigate('/LoginPage');
  }, [navigate]);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('qr_accessToken');
    if (!token) {
      handleSessionExpired();
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [handleSessionExpired]);

  const fetchAnalytics = useCallback(async (days: number, showLoading = true) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    if (showLoading) setIsLoading(true);
    try {
      const [overviewRes, trendRes, topItemsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.ANALYTICS_OVERVIEW, authHeader),
        axios.get(`${API_ENDPOINTS.ANALYTICS_SALES_TREND}?days=${days}`, authHeader),
        axios.get(`${API_ENDPOINTS.ANALYTICS_TOP_ITEMS}?limit=5`, authHeader),
      ]);

      setOverview(overviewRes.data?.data || null);
      setTrend(Array.isArray(trendRes.data?.data) ? trendRes.data.data : []);
      setTopItems(Array.isArray(topItemsRes.data?.data) ? topItemsRes.data.data : []);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error('Failed to load analytics.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader, handleSessionExpired]);

  useEffect(() => {
    const storedUser = localStorage.getItem('qr_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
      } catch (e) {
        console.error('User parse error', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAnalytics(rangeDays);
  }, [isAdmin, rangeDays, fetchAnalytics]);

  if (!isAdmin) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <h2>Access Denied</h2>
            <p>Only administrators can view analytics and reports.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading || !overview) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading" />
          <h1>Crunching the numbers...</h1>
        </div>
      </Layout>
    );
  }

  const maxTrendRevenue = Math.max(...trend.map((t) => t.revenue), 1);
  const maxTopQty = Math.max(...topItems.map((t) => t.quantitySold), 1);

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.title}>
            <h1>Analytics &amp; Reporting</h1>
            <p>Revenue, orders, and top sellers at a glance.</p>
          </div>
          <button className={styles.refreshButton} onClick={() => fetchAnalytics(rangeDays, false)}>
            Refresh
          </button>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Today's Revenue</span>
            <span className={styles.statValue}>Rs. {overview.todayRevenue.toLocaleString()}</span>
            <span className={styles.statSub}>{overview.todayOrders} orders</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>This Week</span>
            <span className={styles.statValue}>Rs. {overview.weekRevenue.toLocaleString()}</span>
            <span className={styles.statSub}>{overview.weekOrders} orders</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>This Month</span>
            <span className={styles.statValue}>Rs. {overview.monthRevenue.toLocaleString()}</span>
            <span className={styles.statSub}>{overview.monthOrders} orders</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>All-Time Revenue</span>
            <span className={styles.statValue}>Rs. {overview.totalRevenue.toLocaleString()}</span>
            <span className={styles.statSub}>{overview.totalOrders} orders</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Avg. Order Value</span>
            <span className={styles.statValue}>Rs. {overview.avgOrderValue.toLocaleString()}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending in Kitchen</span>
            <span className={styles.statValue}>{overview.pendingKitchenOrders}</span>
          </div>
        </div>

        <div className={styles.statusRow}>
          {Object.entries(overview.ordersByStatus).map(([status, count]) => (
            <div key={status} className={`${styles.statusPill} ${styles[status.toLowerCase()] || ''}`}>
              <span>{status}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div className={styles.panelGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Sales Trend</h2>
              <div className={styles.rangeSwitch}>
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={rangeDays === opt.value ? styles.rangeActive : ''}
                    onClick={() => setRangeDays(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {trend.length === 0 ? (
              <p className={styles.emptyMsg}>No paid orders in this range yet.</p>
            ) : (
              <div className={styles.barChart}>
                {trend.map((point) => (
                  <div key={point.date} className={styles.barColumn}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.bar}
                        style={{ height: `${Math.max((point.revenue / maxTrendRevenue) * 100, 2)}%` }}
                        title={`Rs. ${point.revenue.toLocaleString()} · ${point.orders} orders`}
                      />
                    </div>
                    <span className={styles.barLabel}>
                      {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Top Selling Items</h2>
            </div>
            {topItems.length === 0 ? (
              <p className={styles.emptyMsg}>No paid orders yet.</p>
            ) : (
              <div className={styles.topItemsList}>
                {topItems.map((item, index) => (
                  <div key={item.name} className={styles.topItemRow}>
                    <span className={styles.topItemRank}>#{index + 1}</span>
                    <div className={styles.topItemInfo}>
                      <span className={styles.topItemName}>{item.name}</span>
                      <div className={styles.topItemBarTrack}>
                        <div
                          className={styles.topItemBar}
                          style={{ width: `${Math.max((item.quantitySold / maxTopQty) * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                    <div className={styles.topItemStats}>
                      <span>{item.quantitySold} sold</span>
                      <span>Rs. {item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
