import React, { useState, useEffect } from 'react';

const baseURL = 'http://localhost:9006';

function generateUserID() {
   return 'user_' + Date.now();
}

export function App() {
  const [userID, _] = useState(generateUserID());
  const [rooms, setRooms] = useState(['global']); // Default room, update from backend later if possible
  const [currentRoom, setCurrentRoom] = useState('global');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [lastMID, setLastMID] = useState(0);
  const[newRoomName, setNewRoomName] = useState('');

  // useEffect(() => {
  //     const fetchInitialMessages = async () => {
  //         const initialMessages = await fetchMessages(lastMID);
  //           setMessages(initialMessages);
  //   };

  //   fetchInitialMessages();
  // },[currentRoom,lastMID]);

  const handleUserJoin = async () => {
    // Make a PUT/POST call or just add dynamically for now
    const newRoom = newRoomName.trim()

    setRooms(pre =>  [...pre, newRoom]);
    setNewRoomName('');
    //console.log(`New Room ${newRoom}`);
  };


  const sendMessage = async () => {
    try {
      const newMessage = { text: inputText, user: userID };
      const response = await fetch(`${baseURL}/rooms/${currentRoom}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });

      if (response.ok) {
        // Fetch and update messages after successful sends. In a more complex version a websocket would send the message immediatly.
         await fetchMessages();
         setInputText('');
      } else {
        console.error('Fail to send message', response);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const changeCurrentRoom = async (newRoom) => {
    setCurrentRoom(newRoom);
  };

  const fetchMessages = async (lastMID) => {
    try {
      const response = await fetch(`${baseURL}/users/${currentRoom}/messages`);
      const newMessages = await response.json();
      setMessages(newMessages);
    } catch (error) {
      console.error('Error fetching messages',error);
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
                 await fetch(`${baseURL}/rooms`, {
                   method:'POST',
                   headers:{'Content-Type': 'application/json'},
                   body:JSON.stringify({name: newRoom})
                 })
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
           {messages.map(message => (
                <div key={message.mid}>
                  {message.text} ({message.user})
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
