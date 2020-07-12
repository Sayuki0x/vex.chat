import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './stylesheets/style.scss';
import './stylesheets/animista.scss';

import { Root } from './Root';
import { KeyRing, Client, Utils } from 'libvex';

export const keyring = new KeyRing(':memory:', localStorage.getItem('pk'));
export const client = new Client(
  process.env.REACT_APP_VEX_SERVER!,
  keyring,
  null,
  process.env.REACT_APP_SSL_ENABLED
    ? process.env.REACT_APP_SSL_ENABLED === 'true'
    : true
);

client.on('ready', async () => {
  if (!localStorage.getItem('pk')) {
    await client.register();
    localStorage.setItem('pk', Utils.toHexString(keyring.getPriv()));
  }
  await client.auth();
});

function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}

export default App;
