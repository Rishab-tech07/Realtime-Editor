// import io from 'socket.io-client';
// export const initSocket = async () => {
//     const options = {
//         'force new connection': true,
//         reconnectionAttempts: 'Infinity',
//         timeout: 10000,
//         transports: ['websocket'],
//     };
//     return io(process.env.REACT_APP_BACKEND_URL, options);
// };
import { io } from 'socket.io-client';

let socket = null; // Store a single socket instance

export const initSocket = async () => {
    if (!socket) { //Prevent multiple instances
        console.log("Creating a new socket connection...");
        const options = {
            reconnectionAttempts: 'Infinity',
            timeout: 10000,
            transports: ['websocket'],
        };
        socket = io(process.env.REACT_APP_BACKEND_URL, options);
    } else {
        console.log("Using existing socket connection...");
    }
    return socket;
};
