import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './stylesheets/style.scss';
import { Root } from './Root';

function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}

export default App;
