import { io } from 'socket.io-client';
 
const socket = io('http://localhost:3000'); // サーバー側のポートに合わせて！
 
export default socket;