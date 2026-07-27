(()=>{
  const hero=document.querySelector('.hero-road');
  if(!hero)return;
  hero.innerHTML=`<svg viewBox="0 0 1400 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="bg15" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#061f37"/><stop offset=".52" stop-color="#073b5b"/><stop offset="1" stop-color="#0b5d75"/></linearGradient>
      <radialGradient id="glow15" cx="72%" cy="16%" r="62%"><stop offset="0" stop-color="#2bb5d0" stop-opacity=".34"/><stop offset=".5" stop-color="#0c7898" stop-opacity=".08"/><stop offset="1" stop-color="#061f37" stop-opacity="0"/></radialGradient>
      <filter id="soft15"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <rect width="1400" height="420" fill="url(#bg15)"/><rect width="1400" height="420" fill="url(#glow15)"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-80 435C190 305 420 232 669 183C891 139 1117 119 1470 44" stroke="#24b8d4" stroke-width="18" opacity=".12" filter="url(#soft15)"/>
      <path d="M-70 424C204 294 429 224 674 177C903 134 1124 113 1465 40" stroke="#8ce8f5" stroke-width="3.4" opacity=".88"/>
      <path d="M-40 454C233 329 455 266 691 225C917 186 1146 170 1468 104" stroke="#63c9de" stroke-width="2.4" opacity=".78"/>
      <path d="M48 442C279 339 488 287 707 252C924 218 1147 204 1440 148" stroke="#effcff" stroke-width="3.2" stroke-dasharray="38 29" opacity=".94"/>
      <path d="M249 438C431 357 604 318 781 293C966 266 1150 255 1387 212" stroke="#e8fbff" stroke-width="2.5" stroke-dasharray="32 25" opacity=".80"/>
      <path d="M493 433C632 370 768 340 904 322C1052 302 1195 291 1360 260" stroke="#d5f8fd" stroke-width="2" stroke-dasharray="28 23" opacity=".70"/>
      <path d="M731 420C838 372 950 351 1068 340C1177 330 1272 320 1386 298" stroke="#62cae0" stroke-width="2.5" opacity=".50"/>
      <path d="M839 424C945 375 1033 350 1112 330C1192 310 1274 286 1358 234C1385 217 1408 199 1432 176" stroke="#8ce8f5" stroke-width="2.2" opacity=".76"/>
      <path d="M865 431C971 386 1059 364 1139 344C1220 323 1299 298 1384 248C1410 232 1437 212 1460 188" stroke="#edfdfd" stroke-width="2.8" opacity=".88"/>
      <path d="M805 392C929 345 1057 323 1187 307C1289 294 1368 281 1434 256" stroke="#48bed7" stroke-width="1.4" stroke-dasharray="8 9" opacity=".75"/>
    </g>
    <g fill="none" stroke="#2ba9c4" stroke-width="1" opacity=".32">
      <path d="M874 372c82-43 166-68 255-83 97-17 180-39 263-83"/><path d="M901 384c80-38 162-60 250-74 94-15 175-35 257-75"/><path d="M929 394c76-34 155-53 239-66 90-14 168-31 247-67"/><path d="M954 404c74-30 148-48 228-59 87-12 160-28 237-59"/>
    </g>
    <g stroke="#60cfe3" fill="none" opacity=".46">
      <path d="M1020 88v42M1114 64v46M1212 38v49" stroke-width="2"/><path d="M1010 88h18M1104 64h19M1202 38h20" stroke-width="1.5"/>
    </g>
  </svg>`;
})();
