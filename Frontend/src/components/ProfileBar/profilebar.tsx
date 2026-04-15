import React from 'react';
import styles from './profileBar.module.scss';
import profile from './../../../img/profile.png';

const ProfileBar: React.FC = () => {
  return (
    
    <header className={styles.header}>
      <a href="/">
        <img src={profile} className={styles.profile} alt="logo" />
      </a>
    </header>
  );
};

export default ProfileBar;