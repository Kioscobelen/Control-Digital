
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="text-lg sm:text-xl font-semibold bg-white/20 px-4 py-2 rounded-lg">
      {time.toLocaleTimeString('es-ES')}
    </div>
  );
};

export default Clock;
