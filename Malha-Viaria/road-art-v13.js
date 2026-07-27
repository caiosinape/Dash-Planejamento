(()=>{
  const hero=document.querySelector('.hero-road');
  if(!hero)return;
  hero.innerHTML=`<svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sky13" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0d6f8f"/>
        <stop offset="0.55" stop-color="#0a5777"/>
        <stop offset="1" stop-color="#063a58"/>
      </linearGradient>
      <radialGradient id="glow13" cx="68%" cy="15%" r="70%">
        <stop offset="0" stop-color="#79d1df" stop-opacity=".24"/>
        <stop offset=".55" stop-color="#2f9db7" stop-opacity=".06"/>
        <stop offset="1" stop-color="#063a58" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="road13" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#355f70"/>
        <stop offset=".38" stop-color="#1f4658"/>
        <stop offset="1" stop-color="#0b2436"/>
      </linearGradient>
      <linearGradient id="rail13" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#77b7c5"/>
        <stop offset=".5" stop-color="#d8f1f5"/>
        <stop offset="1" stop-color="#78b7c5"/>
      </linearGradient>
      <filter id="shadow13" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="13" flood-color="#001622" flood-opacity=".32"/>
      </filter>
    </defs>

    <rect width="1200" height="360" fill="url(#sky13)"/>
    <rect width="1200" height="360" fill="url(#glow13)"/>

    <path d="M0 190C155 140 302 151 436 177C572 203 713 181 846 147C974 115 1092 121 1200 145V360H0Z" fill="#0a4f69" opacity=".55"/>
    <path d="M0 226C150 184 301 188 452 214C601 240 760 220 917 181C1041 151 1134 153 1200 168V360H0Z" fill="#073e5a" opacity=".60"/>

    <path d="M-90 390C130 274 351 205 588 181C815 159 1027 171 1295 111V390Z" fill="url(#road13)" filter="url(#shadow13)"/>
    <path d="M-85 367C135 254 350 191 589 170C816 150 1025 160 1290 99" fill="none" stroke="#d5f4f8" stroke-width="9" opacity=".93"/>
    <path d="M-58 390C164 296 371 242 601 225C817 209 1026 211 1271 157" fill="none" stroke="#f4fdff" stroke-width="7" opacity=".94"/>

    <path d="M40 370C228 286 421 239 616 227C813 214 1014 215 1237 166" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="38 28" opacity=".96"/>
    <path d="M255 370C391 306 533 274 674 268C839 262 1000 260 1197 218" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="34 26" opacity=".86"/>

    <path d="M-10 316C190 235 379 195 590 178C791 162 985 171 1187 129" fill="none" stroke="url(#rail13)" stroke-width="5"/>
    <path d="M-10 328C191 247 380 207 592 190C793 174 987 183 1189 141" fill="none" stroke="#6da9b8" stroke-width="2" opacity=".82"/>
    <g stroke="#6da9b8" stroke-width="2" opacity=".82">
      <path d="M95 277v34"/><path d="M205 235v31"/><path d="M322 204v28"/><path d="M452 184v25"/><path d="M596 170v23"/><path d="M752 166v22"/><path d="M909 164v21"/>
    </g>

    <g stroke="#91c9d3" stroke-width="3" fill="none" opacity=".88">
      <path d="M309 114v85q0 8 8 8h8"/>
      <path d="M492 92v80q0 8 8 8h8"/>
      <path d="M678 74v75q0 8 8 8h8"/>
    </g>
    <g fill="#ddf8fb" opacity=".95">
      <circle cx="325" cy="207" r="3.5"/>
      <circle cx="508" cy="180" r="3.5"/>
      <circle cx="694" cy="157" r="3.5"/>
    </g>

    <g filter="url(#shadow13)">
      <path d="M756 55v100M1031 42v92" stroke="#9ccdd6" stroke-width="6"/>
      <path d="M736 58h317" stroke="#9ccdd6" stroke-width="6"/>
      <rect x="824" y="42" width="144" height="55" rx="8" fill="#0a6280" stroke="#9bd1da" stroke-width="3"/>
      <rect x="844" y="56" width="104" height="26" rx="4" fill="none" stroke="#8fc5d0" stroke-width="2" opacity=".75"/>
      <path d="M872 63v12m0 0-7-7m7 7 7-7M896 63v12m0 0-7-7m7 7 7-7M920 63v12m0 0-7-7m7 7 7-7" fill="none" stroke="#d9f7fb" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
})();
