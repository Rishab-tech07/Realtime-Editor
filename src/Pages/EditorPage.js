import React, { useEffect, useRef, useState } from 'react';
import Client from '../Components/Client';
import Editor from '../Components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ACTIONS from '../Action';


const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef('');
    const location = useLocation();
    const reactNavigator = useNavigate();
    const { roomId } = useParams();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                socketRef.current = await initSocket();

                socketRef.current.on('connect_error', handleErrors);
                socketRef.current.on('connect_failed', handleErrors);

                function handleErrors(err) {
                    console.error('Socket error:', err);
                    toast.error('Connection failed. Please try again later.');
                    reactNavigator('/');
                }

                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                socketRef.current.on(ACTIONS.JOINED, ({ clients: newClients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room`);
                    }
                    setClients((prevClients) => {
                        const existingIds = new Set(prevClients.map((client) => client.socketId));
                        const mergedClients = [...prevClients];
                        newClients.forEach((client) => {
                            if (!existingIds.has(client.socketId)) {
                                mergedClients.push(client);
                            }
                        });
                        return mergedClients;
                    });

                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                });

                socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.error(`${username} left the room`);
                    setClients((prev) =>
                        prev.filter((client) => client.socketId !== socketId)
                    );
                });
            } catch (err) {
                console.error('Socket initialization error:', err);
                toast.error('Failed to connect to the server. Please try again.');
                reactNavigator('/');
            }
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
            }
        };
    }, [roomId, location.state?.username, reactNavigator]);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard.');
        } catch (err) {
            toast.error('Could not copy the Room ID.');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrapper">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/code-sync.png" alt="logo" />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientList">
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave Room
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
        </div>
    );
};

export default EditorPage;
