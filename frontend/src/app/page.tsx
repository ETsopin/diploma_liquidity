'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health') 
      .then(res => {
        if (!res.ok) throw new Error('Ошибка соединения с API');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Connecting to Core Module .../div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>API Response: </h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
