import React from 'react';
import './stylesheets/style.scss'

function App() {  
  return (
    <div>
      <div className="left-sidebar has-background-black-ter">
      </div>
      <div className="left-channelbar has-background-black-bis">
      </div>
      <div className="top-bar">
        <div className="top-bar-left has-background-black-bis"></div>
        <div className="top-bar-right has-background-black-ter"></div>
      </div>

      <div className="chat-window has-background-black-ter">
      </div> 
      <div className="bottom-bar has-background-black-ter">
        <div className="chat-input-wrapper has-background-grey-darker">
          <textarea  className="chat-input" />
        </div>
      </div> 
      <div className="right-sidebar has-background-black-bis">
      </div>
    </div>
  )
}

export default App;
