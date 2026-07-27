(()=>{
  const hero=document.querySelector('.hero-road');
  if(!hero)return;
  hero.innerHTML=`<svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="bg21" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#03162d"/><stop offset=".48" stop-color="#052b4b"/><stop offset="1" stop-color="#073957"/></linearGradient>
      <linearGradient id="road21" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173e59"/><stop offset="1" stop-color="#06192d"/></linearGradient>
      <filter id="glow21" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft21" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
      <pattern id="grid21" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#19aee5" opacity=".18"/></pattern>
    </defs>
    <rect width="1200" height="300" fill="url(#bg21)"/>
    <rect width="1200" height="300" fill="url(#grid21)" opacity=".32"/>
    <ellipse cx="850" cy="145" rx="420" ry="115" fill="#007bb9" opacity=".08" filter="url(#soft21)"/>

    <g opacity=".34" fill="none" stroke="#0a79aa" stroke-width="1">
      <path d="M0 235C180 208 298 213 425 238S720 270 1200 212"/>
      <path d="M0 250C202 225 320 228 460 254S760 286 1200 228"/>
      <path d="M0 266C208 243 352 245 492 270S795 299 1200 244"/>
      <path d="M650 42C780 25 965 30 1200 10"/><path d="M610 58C770 40 950 45 1200 23"/>
    </g>

    <path d="M-70 330C145 250 340 202 560 176C760 153 950 152 1270 84L1270 198C995 250 790 264 580 280C353 297 140 329-70 390Z" fill="url(#road21)" opacity=".97"/>
    <path d="M-60 326C140 250 335 207 565 181C770 158 962 155 1260 92" fill="none" stroke="#2cc9ff" stroke-width="2.5" filter="url(#glow21)"/>
    <path d="M-60 348C152 271 349 229 580 205C786 184 972 182 1260 121" fill="none" stroke="#98e9ff" stroke-width="1.8"/>
    <path d="M-20 369C180 298 367 259 590 236C796 214 976 212 1220 162" fill="none" stroke="#2ecbff" stroke-width="2" filter="url(#glow21)"/>
    <path d="M70 350C250 292 420 262 610 244C790 226 957 224 1160 184" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="18 14" opacity=".9"/>
    <path d="M210 330C350 288 493 268 650 256C810 244 950 244 1105 214" fill="none" stroke="#58d7ff" stroke-width="1.3" stroke-dasharray="13 12" opacity=".8"/>

    <path d="M500 310C650 243 740 180 826 112C902 51 1000 33 1215 24L1215 90C1044 99 964 118 908 160C840 211 784 263 712 315Z" fill="#0a2439" opacity=".95"/>
    <path d="M507 309C653 245 744 180 831 110C906 50 1004 32 1215 24" fill="none" stroke="#31cfff" stroke-width="2.2" filter="url(#glow21)"/>
    <path d="M542 314C672 254 760 196 846 129C920 72 1010 55 1212 48" fill="none" stroke="#a3efff" stroke-width="1.6"/>
    <path d="M584 316C700 267 785 214 864 154C932 102 1022 82 1190 78" fill="none" stroke="#2fd0ff" stroke-width="1.6"/>
    <path d="M621 311C717 272 797 229 878 169C944 121 1026 105 1160 104" fill="none" stroke="#fff" stroke-width="1.3" stroke-dasharray="14 12" opacity=".86"/>

    <path d="M160 240C360 211 516 208 687 221C821 231 940 257 1168 292" fill="none" stroke="#133f5e" stroke-width="29" opacity=".95"/>
    <path d="M160 232C360 204 515 201 686 214C824 224 945 251 1170 286" fill="none" stroke="#25c9ff" stroke-width="2.2" filter="url(#glow21)"/>
    <path d="M171 244C364 217 520 214 686 226C823 237 945 262 1157 294" fill="none" stroke="#8be9ff" stroke-width="1.3"/>
    <path d="M210 237C380 215 523 213 680 224C815 234 930 258 1105 284" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="14 12" opacity=".8"/>

    <g filter="url(#glow21)" fill="none" stroke="#25d2ff">
      <circle cx="566" cy="225" r="10" stroke-width="2"/><circle cx="566" cy="225" r="4" fill="#a9f4ff"/>
      <circle cx="830" cy="111" r="8" stroke-width="2"/><circle cx="830" cy="111" r="3" fill="#a9f4ff"/>
      <circle cx="963" cy="210" r="9" stroke-width="2"/><circle cx="963" cy="210" r="3" fill="#a9f4ff"/>
    </g>

    <g font-family="Arial,sans-serif" fill="#8ce8ff" stroke="#24bde9">
      <path d="M315 83v103" stroke-width="1"/><circle cx="315" cy="186" r="2.5" fill="#b8f5ff" stroke="none"/><rect x="275" y="58" width="80" height="28" rx="3" fill="#062843" fill-opacity=".9"/><text x="315" y="77" text-anchor="middle" font-size="13" stroke="none">KM 23</text>
      <path d="M698 44v91" stroke-width="1"/><circle cx="698" cy="135" r="2.5" fill="#b8f5ff" stroke="none"/><rect x="658" y="19" width="80" height="28" rx="3" fill="#062843" fill-opacity=".9"/><text x="698" y="38" text-anchor="middle" font-size="13" stroke="none">KM 57</text>
    </g>

    <g transform="translate(910 18)" font-family="Arial,sans-serif">
      <rect width="128" height="58" rx="4" fill="#041d35" fill-opacity=".82" stroke="#18bfee"/><text x="13" y="18" fill="#2bcfff" font-size="10">FLUXO</text><path d="M14 39l15-9 11 5 15-14 14 7 17-16 20 7" fill="none" stroke="#43d7ff" stroke-width="1.5"/><text x="95" y="50" fill="#8eeaff" font-size="11">87%</text>
    </g>
    <g transform="translate(1004 226)" font-family="Arial,sans-serif"><rect width="157" height="50" rx="4" fill="#041d35" fill-opacity=".82" stroke="#18bfee"/><text x="13" y="19" fill="#2bcfff" font-size="9">MONITORAMENTO</text><text x="13" y="38" fill="#a1efff" font-size="14">24/7</text><path d="M96 18h43M96 27h35M96 36h39" stroke="#33cfff" stroke-width="2"/></g>
  </svg>`;
})();
