import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = (caseId) => {
  const socketRef = useRef(null);
  const [caseUpdate, setCaseUpdate] = useState(null);

  useEffect(() => {
    if (!caseId) return;

    socketRef.current = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current.emit('joinCase', caseId);
    socketRef.current.on('caseUpdate', (data) => setCaseUpdate(data));

    return () => {
      socketRef.current.emit('leaveCase', caseId);
      socketRef.current.disconnect();
    };
  }, [caseId]);

  return { caseUpdate };
};

export default useSocket;