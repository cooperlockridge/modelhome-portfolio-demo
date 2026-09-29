type HomeIllustrationProps = {
  variant?: number;
  className?: string;
};

const palettes = [
  {
    sky: "#e9e7de",
    wall: "#eee7d9",
    wood: "#a87555",
    leaf: "#808773",
    glass: "#536561",
  },
  {
    sky: "#e6e9e2",
    wall: "#e7e1d4",
    wood: "#946b51",
    leaf: "#737f6b",
    glass: "#526967",
  },
  {
    sky: "#ece3d8",
    wall: "#f3ecdf",
    wood: "#b17f61",
    leaf: "#8e9075",
    glass: "#59675e",
  },
  {
    sky: "#e3e6e1",
    wall: "#dddcd0",
    wood: "#796f5c",
    leaf: "#74806a",
    glass: "#425753",
  },
  {
    sky: "#eae4d9",
    wall: "#f0e8db",
    wood: "#b58a6c",
    leaf: "#83896f",
    glass: "#64706a",
  },
  {
    sky: "#e5e5dd",
    wall: "#e6dfd0",
    wood: "#a46d51",
    leaf: "#707c68",
    glass: "#4e615c",
  },
];

/** Original, decorative architectural studies. No external images or fonts. */
export function HomeIllustration({
  variant = 0,
  className,
}: HomeIllustrationProps) {
  const index = ((Math.trunc(variant) % 6) + 6) % 6;
  const color = palettes[index];
  const pitched = index === 1 || index === 4;
  const upper = index === 2 || index === 5;
  const reverse = index === 3 || index === 4;

  return (
    <svg
      className={className}
      viewBox="0 0 640 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path fill={color.sky} d="M0 0h640v400H0z" />
      <circle
        cx={index % 2 ? 142 : 487}
        cy="82"
        r="39"
        fill="#f8f3e7"
        opacity=".8"
      />
      <path
        d="M0 221c70-28 111-26 178-7s99 23 166 4 111-42 173-24 79 27 123 12v194H0Z"
        fill="#d5d8c9"
      />
      <path
        d="M0 270c104-17 139 1 234-9s181-24 254-5 104 22 152 9v135H0Z"
        fill="#bec5af"
      />
      <path d="m0 344 262-59 378 63v52H0Z" fill="#d7cfbc" />
      <path d="m116 312 303-8 134 32-300 27Z" fill="#626656" opacity=".13" />

      <g transform={reverse ? "translate(640 0) scale(-1 1)" : undefined}>
        {/* The side plane gives the elevation its quiet, drawn perspective. */}
        <path d="m449 177 77 36v91l-77 12Z" fill="#c7bca8" />
        <path d="M118 184h335v130H118Z" fill={color.wall} />
        {pitched ? (
          <>
            <path d="m101 192 114-94 127 94Z" fill={color.wall} />
            <path
              d="m101 192 114-94 127 94"
              stroke="#53564b"
              strokeWidth="9"
              strokeLinejoin="round"
            />
            <path d="m215 98 85 16 132 80H341Z" fill="#858273" />
            <path d="M325 183h139v13H325Z" fill="#555b50" />
            <path d="M192 146h47v38h-47Z" fill={color.glass} />
            <path d="M215 146v38" stroke={color.wall} strokeWidth="3" />
          </>
        ) : (
          <>
            <path d="m107 174 344-9 83 39-79 3-348-16Z" fill="#5f6458" />
            <path d="M107 183h348v12H107Z" fill="#454d44" />
            {!upper && <path d="M142 151h134v24H142Z" fill={color.wall} />}
          </>
        )}
        {upper && (
          <>
            <path d="M265 104h178v81H265Z" fill={color.wall} />
            <path d="m443 104 47 26v68l-47-13Z" fill="#cabfaa" />
            <path d="m254 95 192-1 51 29-54-11H254Z" fill="#535b50" />
            <path d="M283 124h133v45H283Z" fill={color.glass} />
            <path d="M327 124v45m44-45v45" stroke="#d7d4c4" strokeWidth="4" />
            <path
              d="m288 129 47 1-47 28Zm52 0h41l-41 28Z"
              fill="#d7dfd0"
              opacity=".2"
            />
          </>
        )}
        <path d="M130 199h103v111H130Z" fill={color.wood} />
        {Array.from({ length: 13 }, (_, line) => (
          <path
            key={line}
            d={`M${136 + line * 7.5} 199v111`}
            stroke="#f2dec0"
            strokeOpacity=".3"
          />
        ))}
        <path d="M151 220h59v90h-59Z" fill={color.glass} />
        <path d="M180 220v90" stroke="#b3ac95" strokeWidth="3" />
        <path d="M205 263v12" stroke="#e9dfc9" strokeWidth="2.5" />
        <path d="M250 216h121v84H250Z" fill={color.glass} />
        <path d="m255 221 75 1-75 62Z" fill="#e1e5cf" opacity=".18" />
        <path
          d="M291 216v84m39-84v84M250 274h121"
          stroke="#e9e3d4"
          strokeWidth="4"
        />
        <path d="M390 216h43v94h-43Z" fill="#8f927d" />
        <path d="M397 222h29v69h-29Z" fill={color.glass} />
        <path d="M419 266v11" stroke="#dedbc9" strokeWidth="2" />
        <path d="M119 310h336v9H119Z" fill="#b9af9b" />
        <path d="M382 318h62l8 7h-79Zm-9 7h79l9 7h-97Z" fill="#e5ddce" />
        <path d="m378 332 74 1 33 67H329Z" fill="#eee5d5" />
        <path d="m368 352 95 1m-105 20h115" stroke="#c7bfac" />
        <path d="m469 229 36 14v45l-36 6Z" fill={color.glass} />
        <path d="m486 235 1 56" stroke="#b7b59f" strokeWidth="3" />
        <path d="M116 312v-18m339 16V196" stroke="#b4aa97" />
        {/* Low planting beds soften the architectural lines. */}
        <path
          d="M108 323c-3-18 9-31 22-20 3-25 28-29 37-6 17-10 31 1 31 21 18-15 35-3 34 10Z"
          fill={color.leaf}
        />
        <path
          d="M258 319c-2-17 17-25 26-13 6-19 30-16 32 4 13-10 27-1 28 12Z"
          fill="#939a80"
        />
        <path d="M98 329h142v6H98Zm157-7h96v7h-96Z" fill="#c1b295" />
        <path
          d="m123 318 1-14m14 15 5-12m132 9 3-8m21 11 3-13"
          stroke="#d7d5b7"
          strokeOpacity=".7"
        />
      </g>

      {/* Airy trees, grass, and fine foreground lines frame each study. */}
      <path
        d="M557 305V161m0 72-26-31m26 8 27-25"
        stroke="#777760"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse cx="555" cy="161" rx="45" ry="61" fill={color.leaf} />
      <ellipse cx="577" cy="173" rx="34" ry="42" fill="#98a087" />
      <path
        d="M557 305v-93m0 23-13-14m13 33 17-20"
        stroke="#777760"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse cx="553" cy="312" rx="36" ry="7" fill="#92977c" opacity=".3" />
      <path d="M61 286V214m0 27-17-15" stroke="#81816a" strokeWidth="3" />
      <ellipse cx="60" cy="207" rx="29" ry="42" fill="#a0a78d" />
      <path
        d="m25 342 90-14m396 29 98 14M61 373l107-23"
        stroke="#b8b199"
        strokeWidth="1.5"
      />
      <path
        d="m38 322-4-15m4 15 7-18m537 22-2-15m2 15 8-16M510 342l-3-12m3 12 6-13"
        stroke="#92977a"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default HomeIllustration;
