// Hand-drawn social doodles — wobbly single-stroke icons that look sketched
// with a fine pen, not pulled from an icon pack. They inherit currentColor.

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// A little camera with a heart lens — Instagram
export function InstagramDoodle({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {/* slightly crooked rounded square */}
      <path
        {...strokeProps}
        d="M6.2,4.4 C9.8,4 14.4,3.9 17.9,4.3 C19.6,4.5 20.3,5.3 20.4,7 C20.6,10.3 20.5,14 20.2,17.2 C20,18.9 19.3,19.6 17.6,19.7 C14.2,20 10,20 6.6,19.6 C5,19.5 4.3,18.8 4.2,17.2 C3.9,13.9 4,10.1 4.3,6.8 C4.4,5.3 5,4.6 6.2,4.4 Z"
      />
      {/* heart lens */}
      <path
        {...strokeProps}
        d="M12.2,10.4 C11.3,8.9 9,9.2 9,11 C9,12.6 11,14.2 12.2,15.1 C13.4,14.2 15.4,12.6 15.4,11 C15.4,9.2 13.1,8.9 12.2,10.4 Z"
      />
      {/* viewfinder dot */}
      <circle cx="17" cy="7.4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A loose lowercase f in a sketched circle — Facebook
export function FacebookDoodle({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {/* circle drawn fast — overshoots where the pen lifts */}
      <path
        {...strokeProps}
        d="M11.5,3.6 C16.4,3.2 20.5,6.9 20.4,11.8 C20.3,16.7 16.5,20.4 11.8,20.4 C7,20.4 3.5,16.7 3.6,11.9 C3.7,7.5 6.8,4.2 11,3.7"
      />
      {/* the f */}
      <path {...strokeProps} d="M13.9,7.3 C12.4,7.1 11.3,7.9 11.3,9.6 L11.2,17.2" />
      <path {...strokeProps} d="M9.3,11.5 L13.4,11.4" />
    </svg>
  );
}

// A tiny envelope with a heart seal — Send a note
export function NoteDoodle({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {/* envelope body, hand-squared */}
      <path
        {...strokeProps}
        d="M4.4,7.2 C9.4,6.8 14.8,6.8 19.7,7.1 C20,10.2 20,14 19.8,17 C14.7,17.4 9.2,17.4 4.2,17.1 C4,14 4.1,10.3 4.4,7.2 Z"
      />
      {/* flap */}
      <path {...strokeProps} d="M4.6,7.6 C7.2,9.7 9.6,11.6 12,11.7 C14.4,11.6 16.9,9.6 19.5,7.5" />
      {/* heart seal on the flap point */}
      <path
        d="M12,10.1 C11.4,9.2 10.1,9.4 10.1,10.4 C10.1,11.2 11.2,12 12,12.6 C12.8,12 13.9,11.2 13.9,10.4 C13.9,9.4 12.6,9.2 12,10.1 Z"
        fill="currentColor"
        stroke="none"
        opacity="0.85"
      />
    </svg>
  );
}
