/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import { client } from '../App';
import defaultAvatar from '../images/default_avatar.svg';
import { getUserHexTag } from '../utils/getUserHexTag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown,
  faPoo,
  faFileUpload,
  faPaintBrush,
} from '@fortawesome/free-solid-svg-icons';
import { KeyRing, Utils, IUser } from 'libvex';
import { isImageType } from '../constants/mimeTypes';
import { emptyUUID } from '../constants/emptyUUID';

const downloadTxtFile = (s: string, filename: string) => {
  const element = document.createElement('a');
  const file = new Blob([s], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
};

export const getAvatar = (user: IUser) => {
  if (user.avatar === emptyUUID) {
    return (
      <img
        className="is-rounded"
        alt="user avatar"
        style={{
          backgroundColor: (user as any).color,
        }}
        src={defaultAvatar}
      />
    );
  } else {
    return (
      <img
        className="is-rounded"
        alt="user avatar"
        style={{
          backgroundColor: 'transparent',
        }}
        src={client.getHost(false) + '/file/' + user.avatar}
      />
    );
  }
};

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

export const userProfile = async (
  user: IUser,
  closeModal: () => void,
  openModal: (el: JSX.Element) => void,
  changeNickname: () => void
) => {
  const userDetails = await client.users.retrieve(user.userID);
  let uploadRef: HTMLInputElement | null = null;
  let avatarUploadRef: HTMLInputElement | null = null;
  let errorRef: HTMLSpanElement | null = null;
  return (
    <article className="media profile-modal has-background-black">
      <figure className="media-left">
        <p className="image is-64x64">
          {getAvatar(user)}{' '}
          <span
            className="avatar-upload-button"
            onClick={() => {
              avatarUploadRef?.click();
            }}
            style={{
              display: user.userID === client.user?.userID ? '' : 'none',
            }}
          >
            <FontAwesomeIcon icon={faFileUpload} />
          </span>
        </p>
        <input
          id="keyFileUpload"
          type="file"
          ref={(ref) => (avatarUploadRef = ref)}
          style={{ display: 'none' }}
          onChange={(fileEvent) => {
            fileEvent.persist();
            if (fileEvent.target.files) {
              if (!isImageType(fileEvent.target.files[0].type)) {
                document.getElementById('error-message')!.innerHTML =
                  'ERROR: You can only use an image file as an avatar.';

                return;
              }
              const reader = new FileReader();
              console.log(user.userID);
              reader.onload = async (loadEvent) => {
                const file = loadEvent.target?.result;
                if (file) {
                  console.log('client', client);
                  const view = new Uint8Array(file as ArrayBuffer);
                  const uploadedFileInfo = await client.files.create(
                    Utils.encodeHex(view),
                    fileEvent.target.files![0].name,
                    user.userID
                  );
                  await client.users.update({
                    userID: user.userID,
                    avatar: uploadedFileInfo.fileID,
                  });

                  closeModal();
                }
              };
              reader.onerror = (error) => {
                throw error;
              };
              reader.readAsArrayBuffer(fileEvent.target.files[0]);
            }
          }}
        />
      </figure>
      <div className="media-content">
        <div className="content">
          <p
            className="has-text-weight-bold is-size-3 profile-username"
            style={{ color: (user as any).color }}
          >
            <span
              onClick={() => {
                if (user.userID === client.user?.userID) changeNickname();
              }}
            >
              {userDetails.username}
              <span className="translucent">
                #{getUserHexTag(userDetails.userID)}
              </span>
            </span>
            &nbsp;&nbsp;
            {user.userID === client.user?.userID && (
              <span
                className="color-picker-wrapper"
                onClick={() => {
                  let inputRef: any = React.createRef();
                  const nicknameChanger = (
                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (inputRef.value === '') {
                          return;
                        }
                        closeModal();
                        await client.users.update({
                          userID: user.userID,
                          color: inputRef.value,
                        } as any);
                        // nick function here
                      }}
                    >
                      <p className="has-text-white">CHANGE COLOR</p>
                      <br />
                      <input
                        autoFocus
                        ref={(ref) => (inputRef = ref)}
                        placeholder={
                          'Enter a valid CSS color (e.g. #DEADED)...'
                        }
                        className={`input`}
                      ></input>
                      <div className="modal-bottom-strip has-text-right">
                        <button className="button is-black" type="submit">
                          Save
                        </button>
                      </div>
                    </form>
                  );
                  openModal(nicknameChanger);
                }}
              >
                {<FontAwesomeIcon icon={faPaintBrush} />}
              </span>
            )}
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
          {userDetails.userID === client.user?.userID && (
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
