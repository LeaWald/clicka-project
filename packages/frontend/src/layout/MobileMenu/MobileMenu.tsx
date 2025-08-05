import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './MobileMenu.module.css';
import { menus } from '../menuData';
import logo from '../Assets/Klika Logo.jpg';
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const [popupKey, setPopupKey] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; right: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
    setPopupKey(null);
    setPopupPosition(null);
  };
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupKey(null);
        setPopupPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const mobileMenus = menus.map(({ key, title, icon }) => ({ key, title, icon }));
  const handleMenuClick = (e: React.MouseEvent<HTMLLIElement>, key: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupKey(key);
    setPopupPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 45 });
  };
  useEffect(() => {
    if (popupKey && popupRef.current && popupPosition) {
      const popupHeight = popupRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      let newTop = popupPosition.top;
      if (popupPosition.top + popupHeight > viewportHeight && popupPosition.top - popupHeight > 0) {
        newTop = popupPosition.top - popupHeight - 40;
      } else if (popupPosition.top + popupHeight > viewportHeight) {
        newTop = viewportHeight - popupHeight - 10;
      }
      if (newTop !== popupPosition.top) {
        setPopupPosition(prev => prev ? { ...prev, top: newTop } : prev);
      }
    }
  }, [popupKey, popupPosition]);
  return (
    <>
      {isOpen && (
        <div className={styles.backdrop} onClick={onClose}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <button className={styles.close} onClick={onClose}>×</button>
            <div className={styles.logoWrapper}>
              <Link to="/" onClick={onClose}>
                <img src={logo} alt="Clicka Logo" className={styles.logo} />
              </Link>
            </div>
            <ul className={styles.menu}>
              {mobileMenus.map(menu => (
                <li
                  key={menu.key}
                  onClick={e => handleMenuClick(e, menu.key)}
                  className={styles.menuItem}
                >
                  {menu.icon}
                  <span>{menu.title}</span>
                </li>
              ))}
            </ul>
            {popupKey && popupPosition && (
              <div
                className={styles.popup}
                ref={popupRef}
                style={{
                  top: popupPosition.top,
                  right: popupPosition.right,
                  position: 'fixed'
                }}
              >
                <ul>
                  {menus.find(m => m.key === popupKey)?.items.map((item, index) => (
                    <li
                      key={index}
                      className={styles.popupItem}
                      onClick={() => handleNavigate(item.path)}
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default MobileMenu;