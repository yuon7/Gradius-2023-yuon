import type { UserId } from 'commonTypesWithClient/branded';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Joystick } from 'react-joystick-component';
import type { IJoystickUpdateEvent } from 'react-joystick-component/build/lib/Joystick';
import { apiClient } from 'src/utils/apiClient';
import { getUserIdFromLocalStorage } from 'src/utils/loginWithLocalStorage';
import styles from './controller.module.css';

const Home = () => {
  const [windowsize, setWindowsize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [moveIntervalId, setMoveIntervalId] = useState<NodeJS.Timeout | null>(null);
  const moveDirection = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [userId, setUserId] = useState<UserId>('' as UserId);
  const router = useRouter();

  const getUserId = useCallback(async () => {
    const localStorageUserId = getUserIdFromLocalStorage();
    if (localStorageUserId === null) {
      alert('ログインがまだ行われておりません');
      return router.push('/login');
    }
    setUserId(localStorageUserId);
  }, [router]);
  const shootBullet = async () => {
    if (userId === '') return;

    await apiClient.bullet.$post({ body: { userId } });
  };
  const move = (e: IJoystickUpdateEvent) => {
    if (userId === '') {
      return;
    }
    const moveTo = {
      x: Math.round(e.x ?? 0),
      //canvasに合わせてy軸を反転させる
      y: Math.round((e.y ?? 0) * -1),
    };
    moveDirection.current = moveTo;
    if (moveIntervalId) {
      clearInterval(moveIntervalId);
    }
    apiClient.player.control.$post({ body: { MoveDirection: moveDirection.current, userId } });
  };
  useEffect(() => {
    const intervalId = setInterval(() => {
      getUserId();
    }, 2000);
    return () => {
      clearInterval(intervalId);
    };
  }, [getUserId]);
  setInterval(() => {
    apiClient.bullet.control.$get();
  }, 1000);

  return (
    <div className={styles.controller}>
      <div className={styles.joystick}>
        <Joystick
          size={Math.min(windowsize.width, windowsize.height) * 0.1}
          baseColor="#000000"
          stickColor="blue"
          move={move}
        />
      </div>
      <button className={styles.button} onClick={shootBullet}>
        🚀
      </button>
    </div>
  );
};

export default Home;
