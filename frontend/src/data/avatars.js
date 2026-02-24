// ====================================
// Predefined Avatar Options
// ====================================
// Avatar images are in: frontend/public/avatars/

const AVATARS = [
  { id: 'bahubali', file: 'bahubali.jpg', label: 'Bahubali' },
  { id: 'captain-jack-sparrow', file: 'captain Jack Sparrow.png', label: 'Jack Sparrow' },
  { id: 'chopper', file: 'chopper.jpg', label: 'Chopper' },
  { id: 'darkvader', file: 'darkvader.jpg', label: 'Darth Vader' },
  { id: 'ellie', file: 'ellie.jpg', label: 'Ellie' },
  { id: 'jane', file: 'Jane.jpg', label: 'Jane' },
  { id: 'john-marston', file: 'john marston.jpg', label: 'John Marston' },
  { id: 'john-wick', file: 'JohnWick.jpg', label: 'John Wick' },
  { id: 'leonardo-dicaprio', file: 'Leonardo DiCaprio.jpg', label: 'Leonardo DiCaprio' },
  { id: 'nami', file: 'nami.jpg', label: 'Nami' },
  { id: 'robin', file: 'robin.jpg', label: 'Robin' },
  { id: 'ryan-gosling', file: 'ryan goshling.jpg', label: 'Ryan Gosling' },
  { id: 'sadie-adler', file: 'sadie adler.jpg', label: 'Sadie Adler' },
  { id: 'sanji', file: 'sanji.jpg', label: 'Sanji' },
  { id: 'skywalker', file: 'skywalker.jpg', label: 'Skywalker' },
  { id: 'srk', file: 'srk.jpg', label: 'SRK' },
  { id: 'zoro', file: 'zoro.jpg', label: 'Zoro' },
];

/**
 * Get the full URL path for a predefined avatar filename
 * Encodes spaces in filenames for proper URL resolution
 * @param {string} filename - The avatar filename (e.g., 'JohnWick.jpg')
 * @returns {string} The full path to the avatar image
 */
export const getAvatarPath = (filename) => `/avatars/${encodeURIComponent(filename)}`;

export default AVATARS;
