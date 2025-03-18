import React, { useState, useEffect } from 'react';
import { useInterval } from './utils';
import { useVisibilityChange } from './utils';

const BASE_URL = 'http://localhost:9006/v1';
const DEFAULT_POLLING_INTERVAL = 1000

function generateUserID() {
   return 'user_' + Date.now();
}

export function App() {
  const [userID, _] = useState(generateUserID());
  const [rooms, setRooms] = useState([]); // Default room, update from backend later if possible
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [pollingInterval, setPollingInterval] = useState(DEFAULT_POLLING_INTERVAL);
  const isPageVisible = useVisibilityChange();

  let lastMID;
  if (messages.length > 0) {
    lastMID = messages[messages.length - 1].id;
  };

  useEffect(() => {
    if (isPageVisible) {
      setPollingInterval(DEFAULT_POLLING_INTERVAL);
    } else {
      setPollingInterval(null);
    }
  }, [isPageVisible]);

  async function joinRoom(room) {
    await fetch(`${BASE_URL}/rooms/${room}/join`, {
      method:'POST',
      headers:{
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body:JSON.stringify({user_id: userID})
    })
  }

  async function refresh() {
    try {
      let after = lastMID ?? 0;
      const response = await fetch(
        `${BASE_URL}/inboxes/${userID}/messages?after=${after}&limit=50`,
        {
          headers: { 'accept': 'application/json' }
        }
      );
      const jsonResponse = await response.json();
      const newMessages = jsonResponse.messages;
      if (newMessages.length > 0) {
        let midToAdd = lastMID ?? -1;
        setMessages([...messages, ...newMessages.filter(m => m.id > midToAdd)]);
      }
    } catch (error) {
      console.error('Error fetching messages',error);
    }
  }

  useInterval(() => {
    refresh();
  }, pollingInterval);

  const sendMessage = async () => {
    try {
      const body = { message: inputText, user_id: userID };
      await fetch(`${BASE_URL}/rooms/${currentRoom}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const changeCurrentRoom = async (newRoom) => {
    setCurrentRoom(newRoom);
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <aside
        style={{
          border: '1px solid gray',
          padding: '10px',
          width:'20%'
        }}
      >
        <h2>Rooms</h2>
        <button onClick={async() => {
          const newRoom = prompt("enter new room");
            if(newRoom){
              await joinRoom(newRoom);
              setRooms(pre => [...pre, newRoom]);
            }
        }}>
           + New Room
        </button>
        <div>
            <ul>
                {rooms.map((room) => (
                    <li
                        key={room}
                        onClick={() => changeCurrentRoom(room)}
                        style={{cursor:'pointer'}}
                    >
                        {room}
                    </li>
                ))}
           </ul>
         </div>

      </aside>

    {/* Chat Container */}
    <main
       style={{
          maxWidth: '80%',
          padding: '20px',
          border: '1px solid gray',
       }}
    >
        <h2>{currentRoom}</h2>

        <div style={{ height: '300px', overflowY: 'scroll', marginBottom: '10px' }}>
          {messages.filter(m => m.message.room == currentRoom).map(message => (
                <div key={message.id}>
                  {message.message.body} ({message.message.sender})
                </div>
           ))}
        </div>
        <div style={{display:'flex'}}>

            <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1, marginRight: '10px' }}
          />
         <button onClick={sendMessage}>Send</button>
      </div>

    </main>
 </div>
 );
}
