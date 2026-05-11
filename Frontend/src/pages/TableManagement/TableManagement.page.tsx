import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
}

const API_BASE_URL = 'http://localhost:9005/api';

const TableFetcher: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/table/list`); 
      
      const data = response.data?.data || response.data?.result || response.data;
      
      if (Array.isArray(data)) {
        setTables(data);
      }
    } catch (error) {
      console.error("Database Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  if (loading) return <div>Loading tables from database...</div>;

  return (
    <div>
      <h1>Tables from Database</h1>
      <ul>
        {tables.map((table) => (
          <li key={table._id}>
            Table {table.tableNumber} - {table.location} ({table.capacity} seats)
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TableFetcher;