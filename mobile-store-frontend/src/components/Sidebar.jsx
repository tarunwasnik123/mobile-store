import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="ms-sidebar">
      <nav>
        <ul>
          <li>
            <NavLink to="/compare" className={({isActive}) => isActive ? 'active' : ''}>
              Compare Phones
            </NavLink>
          </li>
          <li>
            <NavLink to="/upcoming" className={({isActive}) => isActive ? 'active' : ''}>
              Upcoming Phones
            </NavLink>
          </li>
          <li>
            <NavLink to="/top" className={({isActive}) => isActive ? 'active' : ''}>
              Top / Trending Phones
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
