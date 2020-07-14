/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import { client } from '../App';
import defaultAvatar from '../images/default_avatar.svg';
import { getUserColor, getUserHexTag } from '../utils/getUserColor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faPoo } from '@fortawesome/free-solid-svg-icons';
import { KeyRing } from 'libvex';

const downloadTxtFile = (s: string, filename: string) => {
  const element = document.createElement('a');
  const file = new Blob([s], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
};

export const getAvatar = (userID: string) => (
  <img
    src={defaultAvatar}
    className="is-rounded"
    alt="user avatar"
    style={{
      backgroundColor: getUserColor(userID),
    }}
  />
);

export const getUserIcon = (powerLevel: number) => {
  if (powerLevel === 100)
    return (
      <span className="role-icon has-text-warning">
        <FontAwesomeIcon icon={faCrown} />
      </span>
    );

  if (powerLevel >= 50 && powerLevel < 100)
    return (
      <span className="role-icon has-text-grey">
        <FontAwesomeIcon icon={faCrown} />
      </span>
    );

  if (powerLevel >= 25 && powerLevel < 50)
    return (
      <span className="role-icon has-text-brown">
        <FontAwesomeIcon icon={faPoo} />
      </span>
    );
  return null;
};

export const userProfile = async (userID: string) => {
  const userDetails = await client.users.retrieve(userID);
  let uploadRef: HTMLInputElement | null = null;
  let errorRef: HTMLSpanElement | null = null;
  return (
    <article className="media profile-modal has-background-black">
      <figure className="media-left">
        <p className="image is-64x64">{getAvatar(userID)}</p>
      </figure>
      <div className="media-content">
        <div className="content">
          <p
            className="has-text-weight-bold is-size-3"
            style={{ color: getUserColor(userDetails.userID) }}
          >
            {userDetails.username}
            <span className="translucent">
              #{getUserHexTag(userDetails.userID)}
            </span>
            &nbsp;&nbsp;
            {getUserIcon(userDetails.powerLevel)}
          </p>
          <p className="has-text-white is-family-monospace is-size-7">
            Public Key <br />
            {userDetails.pubkey}
          </p>

          <p className="has-text-white is-family-monospace is-size-7">
            User ID <br />
            {userDetails.userID}
          </p>

          <p className="has-text-white is-family-monospace is-size-7">
            Power Level <br />
            {userDetails.powerLevel}
          </p>
          <br />
          {userDetails.userID === client.info().client!.userID && (
            <div className="user-profile-self-section">
              <div className="buttons">
                <button
                  className="button is-danger is-small"
                  onClick={() => {
                    downloadTxtFile(localStorage.getItem('pk')!, 'key.priv');
                  }}
                >
                  Save Private Key
                </button>
                <input
                  id="keyFileUpload"
                  type="file"
                  ref={(ref) => (uploadRef = ref)}
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    event.persist();
                    if (event.target.files) {
                      if (event.target.files[0].size !== 128) {
                        console.warn(
                          'File is not the correct size for private key (expected size 128, received size ' +
                            event.target.files[0].size.toString() +
                            ')'
                        );
                        document.getElementById('error-message')!.innerHTML =
                          'File is not the correct size for private key (expected size 128, received size ' +
                          event.target.files[0].size.toString() +
                          ')';

                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const value = event.target!.result?.toString();
                        try {
                          const testKeyring = new KeyRing(':memory:', value);
                          testKeyring.on('ready', () => {
                            localStorage.setItem('pk', value!);
                            window.location.reload(false);
                          });
                          testKeyring.init();
                        } catch (err) {
                          console.log(err);
                          errorRef!.textContent = err.toString();
                        }
                      };
                      reader.onerror = (error) => {
                        throw error;
                      };
                      reader.readAsText(event.target.files[0]);
                    }
                  }}
                />
                <button
                  className="button is-small is-dark"
                  onClick={() => {
                    uploadRef?.click();
                  }}
                >
                  Import Private Key
                </button>
              </div>
              <div className="notification is-black">
                <div id="error-message" className="has-text-danger"></div>
              </div>
            </div>
          )}
        </div>
        <nav className="level is-mobile">
          <div className="level-left">
            <a className="level-item">
              <span className="icon is-small">
                <i className="fas fa-reply"></i>
              </span>
            </a>
            <a className="level-item">
              <span className="icon is-small">
                <i className="fas fa-retweet"></i>
              </span>
            </a>
            <a className="level-item">
              <span className="icon is-small">
                <i className="fas fa-heart"></i>
              </span>
            </a>
          </div>
        </nav>
      </div>
      <div className="media-right"></div>
    </article>
  );
};
