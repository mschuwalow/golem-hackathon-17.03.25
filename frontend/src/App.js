import React, { useState, useEffect } from 'react';
import { useInterval } from './utils';
import { useVisibilityChange } from './utils';

const BASE_URL = 'http://localhost:9006/v1';
const DEFAULT_POLLING_INTERVAL = 1000
const GLOBAL_ROOM = 'global'

function generateUserID() {
   return 'user_' + Date.now();
}

export function App() {
  const [userID, _] = useState(generateUserID());
  const [rooms, setRooms] = useState([GLOBAL_ROOM]); // Default room, update from backend later if possible
  const [currentRoom, setCurrentRoom] = useState(GLOBAL_ROOM);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [pollingInterval, setPollingInterval] = useState(DEFAULT_POLLING_INTERVAL);
  const [joinedGlobal, setJoinedGlobal] = useState(false);
  const isPageVisible = useVisibilityChange();

  let lastMID;
  if (messages.length > 0) {
    lastMID = messages[messages.length - 1].id;
  };

  if (!joinedGlobal) {
    joinRoom(GLOBAL_ROOM);
    setJoinedGlobal(true);
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
      let nextMid = lastMID == null ? 0 : lastMID + 1;
      let searchParams = new URLSearchParams({
        limit: 50,
        from: nextMid
      });
      const response = await fetch(
        `${BASE_URL}/inboxes/${userID}/messages?${searchParams}`,
        {
          headers: { 'accept': 'application/json' }
        }
      );
      const jsonResponse = await response.json();
      const newMessages = jsonResponse.messages;
      if (newMessages.length > 0) {
        setMessages([...messages, ...newMessages.filter(m => m.id >= nextMid)]);
      }
    } catch (error) {
      console.error('Error fetching messages',error);
    }
  }

  useInterval(() => {
    refresh();
  }, pollingInterval);

  async function sendMessage() {
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

  function changeCurrentRoom(newRoom) {
    setCurrentRoom(newRoom);
  };

  function displaySender(sender) {
    if (sender == userID) {
      return "you"
    } else {
      return sender
    }
  }

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
                  {message.message.body} ({displaySender(message.message.sender)})
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
