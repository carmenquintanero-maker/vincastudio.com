// Source of /js/hero-gradient.js. Rebuild after editing (React 18.3.1, @paper-design/shaders-react 0.0.82):
//   npx esbuild js/hero-gradient.src.js --bundle --minify --format=esm --target=es2020 --define:process.env.NODE_ENV='"production"' --legal-comments=eof --outfile=js/hero-gradient.js
// Home hero background (Paper Shaders MeshGradient). Bundled locally so no third-party CDN is contacted.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MeshGradient } from '@paper-design/shaders-react';

function HeroGradient() {
  const [size, setSize] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  React.useEffect(() => {
    const onResize = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return React.createElement(MeshGradient, {
    width:        size.w,
    height:       size.h,
    colors:       ['#F0B45E', '#DC85B7', '#736DAE', '#642027'],
    distortion:   0.45,
    swirl:        0.55,
    grainMixer:   0,
    grainOverlay: 0,
    speed:        0.5,
    offsetX:      0.08,
  });
}

const container = document.getElementById('hero-gradient');
if (container) createRoot(container).render(React.createElement(HeroGradient));
